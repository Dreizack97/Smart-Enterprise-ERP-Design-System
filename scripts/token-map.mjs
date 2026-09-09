/**
 * Reads the token files into one resolved map per theme, without a browser.
 *
 * Shared by the audits. Extracted the day a second audit needed it: two copies
 * of a CSS parser is two things to keep in step, and the parser is the part
 * that already got this wrong once.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = ['primitive.css', 'semantic.css', 'component.css'].map((name) =>
  join(ROOT, 'src/styles/tokens', name),
);

/** `{ light, dark }`, each a `Map` of custom property to a literal value. */
export function readTokens() {
  const source = FILES.map((file) => readFileSync(file, 'utf8')).join('\n');
  return {
    light: resolveAll(declarationsFor(source, 'light')),
    dark: resolveAll(declarationsFor(source, 'dark')),
  };
}

/**
 * Every custom property declared for one theme, later declarations winning.
 *
 * The light theme is `:root`; the dark one is `:root` plus `html.dark`, which
 * is exactly how the cascade resolves them on the document element.
 */
function declarationsFor(source, theme) {
  const declarations = new Map();

  for (const { selector, body } of blocksOf(stripComments(source))) {
    if (/^@keyframes/i.test(selector)) {
      continue;
    }
    const isDarkBlock = /html\.dark/.test(selector);
    const isLightBlock = /:root|^@theme/.test(selector);
    if (isDarkBlock ? theme !== 'dark' : !isLightBlock) {
      continue;
    }
    for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      declarations.set(name, value.trim().replace(/\s+/g, ' '));
    }
  }
  return declarations;
}

/** Drops comments, which otherwise contribute stray braces to the scan. */
export function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Top-level `selector { body }` pairs, matching braces rather than guessing.
 *
 * The first version of this used one regular expression and quietly found 23
 * "blocks", most of them comment text and `@keyframes` percentages — so the
 * audit passed while measuring almost nothing. A green light from a check that
 * cannot fail is worse than no check, which is why every audit built on this
 * is probed against a known defect before being trusted.
 */
export function blocksOf(source) {
  const blocks = [];
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      if (depth === 0) {
        bodyStart = index + 1;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        blocks.push({
          selector: source
            .slice(selectorStart, bodyStart - 1)
            .trim()
            .replace(/\s+/g, ' '),
          body: source.slice(bodyStart, index),
        });
        selectorStart = index + 1;
      }
    }
  }
  return blocks;
}

/** Substitutes `var()` chains until every value is literal. */
function resolveAll(declarations) {
  const resolved = new Map(declarations);
  for (let pass = 0; pass < 10; pass += 1) {
    let changed = false;
    for (const [name, value] of resolved) {
      if (!value.includes('var(')) {
        continue;
      }
      const next = value.replace(/var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)/gi, (whole, token) =>
        resolved.has(token) ? resolved.get(token) : whole,
      );
      if (next !== value) {
        resolved.set(name, next);
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }
  return resolved;
}
