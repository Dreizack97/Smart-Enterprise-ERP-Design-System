/**
 * Two invariants of the styling layer, checked without a browser.
 *
 * 1. **Every font size comes from the type scale.** Seven roles exist and
 *    Tailwind's own scale was emptied on purpose, so a `font-size: 13px` in a
 *    component is a role nobody agreed to — and it will not move when the
 *    scale does.
 * 2. **Every colour comes from a token.** A hex literal in a component is a
 *    colour that exists in one theme only: it cannot be re-declared for the
 *    other, so it survives the theme switch unchanged and lands wrong.
 *
 * Both were being checked by hand with `grep` after each lot, which is exactly
 * the kind of discipline that lasts until the day someone is in a hurry.
 *
 * The token files are exempt: literals are the point there. That is the whole
 * shape of the rule — level 1 holds the values, and everything above it holds
 * names.
 *
 * Run with `npm run audit:consistency`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { blocksOf, readTokens, stripComments } from './token-map.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Where component and page styles live. The token layer is deliberately out. */
const SCANNED = [join(ROOT, 'src/app'), join(ROOT, 'src/styles')];

/** Level 1 and 2: the only place a literal value belongs. */
const TOKEN_LAYER = join(ROOT, 'src/styles/tokens');

/** Properties whose value is a colour, or contains one. */
const COLOUR_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'background-image',
  'border',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-inline-color',
  'border-block-color',
  'outline',
  'outline-color',
  'fill',
  'stroke',
  'box-shadow',
  'text-shadow',
  'caret-color',
  'accent-color',
  'text-decoration-color',
  'column-rule-color',
]);

/** A literal colour: hex, or any of the functional notations. */
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

/**
 * Colour keywords that carry no theme and therefore no risk.
 *
 * `transparent` and `currentColor` follow whatever surrounds them, and
 * `inherit` / `initial` / `unset` name no colour at all.
 */
const SAFE_KEYWORDS = /^(?:transparent|currentcolor|inherit|initial|unset|revert|none)$/i;

/** A length typed in place rather than taken from the scale. */
const LITERAL_LENGTH = /^-?\d*\.?\d+(?:px|rem|em|pt|%|ch|ex|vw|vh)$/i;

const findings = [];

for (const root of SCANNED) {
  for (const file of cssFilesIn(root)) {
    if (file.startsWith(TOKEN_LAYER)) {
      continue;
    }
    auditFile(file);
  }
}

auditFontSizeTokens();

report();

/** Every `.css` under a directory, recursively. */
function cssFilesIn(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (entry.endsWith('.css')) {
        out.push(path);
      }
    }
  };
  walk(root);
  return out;
}

function auditFile(file) {
  const source = stripComments(readFileSync(file, 'utf8'));
  const where = relative(ROOT, file).replaceAll('\\', '/');

  for (const { selector, body } of blocksOf(source)) {
    // A theme block inside a component sheet is still a component sheet, but
    // `@keyframes` percentages are not declarations of anything colourable.
    if (/^@keyframes/i.test(selector)) {
      continue;
    }

    for (const { property, value } of declarationsIn(body)) {
      // A custom property declared inside a component is that component's own
      // level-3 token: it is allowed to hold a value.
      if (property.startsWith('--')) {
        continue;
      }

      if (property === 'font-size' && LITERAL_LENGTH.test(value)) {
        findings.push({
          kind: 'tamaño',
          where,
          selector,
          detail: `font-size: ${value}`,
          why: 'no sale de la escala tipográfica',
        });
      }

      if (
        COLOUR_PROPERTIES.has(property) &&
        !SAFE_KEYWORDS.test(value) &&
        COLOUR_LITERAL.test(value)
      ) {
        findings.push({
          kind: 'color',
          where,
          selector,
          detail: `${property}: ${value}`,
          why: 'es un valor literal, no un token',
        });
      }
    }
  }
}

/**
 * Every `--*-font-size` token has to end at one of the seven roles.
 *
 * A component token that resolves to a raw length is the same defect one level
 * further in: it looks tokenised and moves with nothing.
 */
function auditFontSizeTokens() {
  const { light } = readTokens();
  const source = readFileSync(join(TOKEN_LAYER, 'component.css'), 'utf8');
  // The suffix matters: the tokens are named `--button-font-size-md`, not
  // `--button-font-size`. The first version of this pattern anchored the name
  // at `font-size` and therefore matched almost nothing — it passed while the
  // half of the audit it belongs to was checking a single token.
  const declared = [...stripComments(source).matchAll(/(--[\w-]*font-size[\w-]*)\s*:\s*([^;]+);/g)];

  for (const [, name, raw] of declared) {
    const value = raw.trim();
    if (!value.startsWith('var(')) {
      findings.push({
        kind: 'tamaño',
        where: 'src/styles/tokens/component.css',
        selector: name,
        detail: value,
        why: 'no apunta a un rol de la escala',
      });
      continue;
    }
    const target = value.slice(4, value.indexOf(')')).trim();
    if (!target.startsWith('--text-')) {
      findings.push({
        kind: 'tamaño',
        where: 'src/styles/tokens/component.css',
        selector: name,
        detail: `${value} → ${light.get(target) ?? '?'}`,
        why: 'apunta fuera de los siete roles',
      });
    }
  }
}

/** The declarations of one block, ignoring nested at-rules. */
function declarationsIn(body) {
  const out = [];
  let depth = 0;
  let buffer = '';

  for (const char of body) {
    if (char === '{') {
      depth += 1;
      buffer = '';
      continue;
    }
    if (char === '}') {
      depth -= 1;
      buffer = '';
      continue;
    }
    if (char === ';') {
      if (depth === 0) {
        push(buffer);
      }
      buffer = '';
      continue;
    }
    buffer += char;
  }
  if (depth === 0) {
    push(buffer);
  }

  return out;

  function push(text) {
    const at = text.indexOf(':');
    if (at === -1) {
      return;
    }
    const property = text.slice(0, at).trim().toLowerCase();
    const value = text.slice(at + 1).trim();
    if (property && value) {
      out.push({ property, value });
    }
  }
}

function report() {
  if (findings.length === 0) {
    console.log(
      '✔ Consistencia: todo tamaño de fuente sale de la escala y todo color, de un token.',
    );
    return;
  }

  console.error(`✖ Consistencia: ${findings.length} declaración(es) fuera del sistema.\n`);
  for (const finding of findings) {
    console.error(`  [${finding.kind}] ${finding.where} · ${finding.selector}`);
    console.error(`      ${finding.detail} — ${finding.why}\n`);
  }
  process.exitCode = 1;
}
