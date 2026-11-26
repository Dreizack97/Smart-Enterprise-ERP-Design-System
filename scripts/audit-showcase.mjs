/**
 * Checks that every shared component appears in the catalogue.
 *
 * A design system whose catalogue skips components is a catalogue nobody can
 * trust: the reader cannot tell «not shown» from «does not exist». This walks
 * the selectors declared under `shared/components` and looks for each one in
 * the showcase templates.
 *
 * Components used only by other components — `accordion-item` inside
 * `accordion` — still count as shown: what matters is that the reader can see
 * them on a page, not that they were placed there by hand.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS = 'src/app/shared/components';
const SHOWCASE = 'src/app/features/showcase';

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const declared = new Map();
for (const path of walk(COMPONENTS).filter((p) => p.endsWith('.ts') && !p.endsWith('.spec.ts'))) {
  const selector = /selector: '(app-[a-z0-9-]+)'/.exec(readFileSync(path, 'utf8'))?.[1];
  if (selector) {
    declared.set(selector, path);
  }
}

const templates = walk(SHOWCASE)
  .filter((path) => path.endsWith('.html') || path.endsWith('.ts'))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

// A component the showcase places itself, or one placed by another component
// that the showcase places — both end up on a page the reader can open.
const reachable = new Set();
const queue = [...declared.keys()].filter((selector) => templates.includes(`<${selector}`));
while (queue.length > 0) {
  const selector = queue.pop();
  if (reachable.has(selector)) {
    continue;
  }
  reachable.add(selector);
  // Inline templates exist (`tab-panel` is one), so the class file is read too.
  const files = [declared.get(selector), declared.get(selector).replace(/\.ts$/, '.html')];
  const source = files
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  for (const candidate of declared.keys()) {
    if (source.includes(`<${candidate}`)) {
      queue.push(candidate);
    }
  }
}

const missing = [...declared.keys()].filter((selector) => !reachable.has(selector)).sort();
if (missing.length > 0) {
  console.error(`✘ Fuera del catálogo (${missing.length}):`);
  for (const selector of missing) {
    console.error(`  ${selector} — ${declared.get(selector)}`);
  }
  process.exit(1);
}

console.log(`✔ Catálogo: los ${declared.size} componentes compartidos aparecen en el showcase.`);
