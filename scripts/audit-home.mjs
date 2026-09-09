/**
 * Comprueba que las cifras de la portada digan la verdad.
 *
 * `/inicio` abre con «61 componentes en 10 familias» y una tarjeta por familia
 * con su propio conteo. Esas cifras están escritas a mano en `home.ts` porque
 * no hay forma de contarlas en tiempo de ejecución — y una cifra escrita a
 * mano que nadie compara es una cifra que se desalinea en cuanto alguien
 * agrega un componente.
 *
 * Así que la comparación la hace este script contra las carpetas reales de
 * `shared/components`. Es el mismo razonamiento por el que Fundamentos lee los
 * tokens del documento en vez de repetirlos: la única cifra confiable es la
 * que se deriva de la fuente.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS = 'src/app/shared/components';
const HOME = 'src/app/features/showcase/pages/home/home.ts';
const ROUTES = 'src/app/app.routes.ts';

/** Las carpetas de familia y cuántos componentes tiene cada una, en disco. */
const onDisk = new Map(
  readdirSync(COMPONENTS)
    .filter((entry) => statSync(join(COMPONENTS, entry)).isDirectory())
    .map((family) => [
      family,
      readdirSync(join(COMPONENTS, family)).filter((entry) =>
        statSync(join(COMPONENTS, family, entry)).isDirectory(),
      ).length,
    ]),
);

/** Lo que la portada declara: `folder` y el `count` que le sigue. */
const home = readFileSync(HOME, 'utf8');
const declared = new Map(
  [...home.matchAll(/folder: '([a-z-]+)',[\s\S]{0,200}?count: (\d+),/g)].map(([, folder, count]) => [
    folder,
    Number(count),
  ]),
);

/** Las rutas que la portada enlaza, para que ninguna tarjeta lleve a un 404. */
const routes = new Set(
  [...readFileSync(ROUTES, 'utf8').matchAll(/path: '([^']*)'/g)].map(([, path]) => `/${path}`),
);
const linked = [...home.matchAll(/route: '(\/[a-z-]*)'/g)].map(([, route]) => route);

const problems = [];

for (const [folder, count] of onDisk) {
  if (!declared.has(folder)) {
    problems.push(`La portada no menciona la familia «${folder}» (${count} componentes).`);
    continue;
  }
  if (declared.get(folder) !== count) {
    problems.push(
      `«${folder}»: la portada dice ${declared.get(folder)} y en disco hay ${count}.`,
    );
  }
}

for (const folder of declared.keys()) {
  if (!onDisk.has(folder)) {
    problems.push(`La portada menciona «${folder}», que no es una carpeta de componentes.`);
  }
}

for (const route of new Set(linked)) {
  if (!routes.has(route)) {
    problems.push(`La portada enlaza «${route}», que no es una ruta.`);
  }
}

if (problems.length > 0) {
  console.error('✘ Portada:');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

const total = [...onDisk.values()].reduce((sum, count) => sum + count, 0);
console.log(
  `✔ Portada: las cifras coinciden con el disco (${total} componentes en ${onDisk.size} familias).`,
);
