/** Genera el catálogo SVG desde la versión instalada de Lucide sin empaquetar sus componentes Angular. */
import '@angular/compiler';
import * as lucide from '@lucide/angular';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const manifest = JSON.parse(
  readFileSync(new URL('./icon-components.json', import.meta.url), 'utf8'),
);
const data = manifest.map((name) => {
  const icon = lucide[name]?.icon;
  if (!icon?.name || !icon.node) throw new Error(`Icono no disponible: ${name}`);
  return icon;
});
const output = new URL('../src/app/core/icons/app-icon-data.ts', import.meta.url);
const license = readFileSync(
  new URL('../node_modules/@lucide/angular/LICENSE', import.meta.url),
  'utf8',
);
const source = await format(
  `// Generado con npm run generate:icons. No editar manualmente.\n/*! @license\n${license}\n*/\nimport type { LucideIconData } from '@lucide/angular';\n\n/** Datos originales del catálogo registrado; no contiene componentes Angular por icono. */\nexport const APP_ICON_DATA: readonly LucideIconData[] = ${JSON.stringify(data, null, 2)};\n`,
  {
    ...(await resolveConfig(fileURLToPath(output))),
    filepath: fileURLToPath(output),
  },
);
if (process.argv.includes('--check')) {
  if (readFileSync(output, 'utf8') !== source)
    throw new Error('Regenera el catálogo de iconos con npm run generate:icons.');
} else {
  writeFileSync(output, source);
}
