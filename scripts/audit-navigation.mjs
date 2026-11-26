/**
 * Checks that the sidebar and the catalogue agree.
 *
 * The menu points at pages by route and at groups of components by anchor, and
 * both halves live in different files from the one that draws them. Three ways
 * that goes wrong, all of them silent in the browser:
 *
 * - an entry naming a route that no longer exists — the link does nothing;
 * - an entry naming an anchor no page carries — the link navigates and stays
 *   where it was, which reads as a broken menu;
 * - an anchor nothing points at — dead weight, and the reason a page keeps ids
 *   that no longer mean anything.
 */
import { readFileSync } from 'node:fs';

const NAVIGATION = 'src/app/layout/layouts/main-layout/main-navigation.config.ts';
const ROUTES = 'src/app/app.routes.ts';

const navigation = readFileSync(NAVIGATION, 'utf8');
const routesSource = readFileSync(ROUTES, 'utf8');

/** Every route the router answers, as it is written in the menu: `/formularios`. */
const routes = new Set(
  [...routesSource.matchAll(/path: '([^']*)'/g)].map(([, path]) => `/${path}`),
);

/** Which page component each route loads, so its anchors can be read. */
const pages = new Map();
for (const [, path, page] of routesSource.matchAll(
  /path: '([^']*)',[\s\S]{0,200}?pages\/([a-z-]+)\//g,
)) {
  pages.set(`/${path}`, `src/app/features/showcase/pages/${page}/${page}.html`);
}

const entries = [...navigation.matchAll(/route: '([^']+)'(?:,\s*fragment: '([^']+)')?/g)].map(
  ([, route, fragment]) => ({ route, fragment }),
);

const problems = [];
const pointedAt = new Set();

for (const { route, fragment } of entries) {
  if (!routes.has(route)) {
    problems.push(`El menú apunta a «${route}», que no es una ruta.`);
    continue;
  }
  if (!fragment) {
    continue;
  }
  const template = pages.get(route);
  if (!template) {
    problems.push(
      `«${route}» no carga ninguna página del catálogo, pero el menú le pide un ancla.`,
    );
    continue;
  }
  if (!readFileSync(template, 'utf8').includes(`anchor="${fragment}"`)) {
    problems.push(
      `«${route}#${fragment}» no existe: ningún bloque de ${template} lleva esa ancla.`,
    );
  }
  pointedAt.add(`${route}#${fragment}`);
}

for (const [route, template] of pages) {
  for (const [, anchor] of readFileSync(template, 'utf8').matchAll(/anchor="([a-z-]+)"/g)) {
    if (!pointedAt.has(`${route}#${anchor}`)) {
      problems.push(`El ancla «${anchor}» de ${template} no la usa ninguna entrada del menú.`);
    }
  }
}

if (problems.length > 0) {
  console.error('✘ Navegación:');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

console.log(
  `✔ Navegación: las ${entries.length} entradas del menú apuntan a rutas y anclas que existen.`,
);
