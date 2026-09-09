/**
 * Geometry invariants of the token layer.
 *
 * The system's promise is that a button, a field and a select **line up** when
 * they sit side by side in a toolbar. Heights were tokenised for exactly that
 * — and the radii were not checked, so `--button-radius` sat 0.25 rem rounder
 * than `--field-radius` for three phases without anything failing. It was
 * spotted by eye, on a page that finally put the two next to each other.
 *
 * The cause is worth remembering: **our radius scale is not Tailwind's.** Ours
 * is shifted one step up (`--radius-xl` is 1 rem, Tailwind's `rounded-xl` is
 * 0.75 rem), so translating a migrated class by its NAME inflates the radius
 * silently. Five tokens carried that mistake.
 *
 * Run with `npm run audit:geometry`.
 */
import { readTokens } from './token-map.mjs';

/**
 * Tokens that must agree, and why.
 *
 * The groups are the answer to "what ends up adjacent to what": controls share
 * a row in a toolbar, containers share a page.
 */
const MUST_AGREE = [
  {
    what: 'radio de los controles',
    why: 'un botón y un campo en la misma barra',
    tokens: ['--button-radius', '--field-radius', '--segmented-radius', '--dropdown-radius'],
  },
  {
    what: 'radio de los contenedores',
    why: 'una tarjeta, un modal y una tarjeta de formulario en la misma pantalla',
    tokens: ['--card-radius', '--modal-radius', '--form-card-radius'],
  },
  {
    what: 'altura pequeña',
    why: 'la fila compacta de una barra de herramientas',
    tokens: ['--control-height-sm', '--button-height-sm', '--field-height-sm'],
  },
  {
    what: 'altura media',
    why: 'el tamaño por defecto de todo control',
    tokens: ['--control-height-md', '--button-height-md', '--field-height-md'],
  },
  {
    what: 'altura grande',
    why: 'el pie de un formulario',
    tokens: ['--control-height-lg', '--button-height-lg', '--field-height-lg'],
  },
];

/** Every radius has to come from the scale, not from a number typed in place. */
const RADIUS_SCALE = [
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-full',
];

main();

function main() {
  const { light } = readTokens();
  const failures = [...checkAgreement(light), ...checkRadiusScale(light)];

  if (failures.length === 0) {
    console.log('✔ Geometría: los grupos de tokens que deben coincidir, coinciden.');
    return;
  }

  console.log(`✘ ${failures.length} incoherencia(s) de geometría\n`);
  for (const line of failures) {
    console.log(`  ${line}`);
  }
  process.exitCode = 1;
}

function checkAgreement(tokens) {
  const failures = [];
  for (const group of MUST_AGREE) {
    const present = group.tokens.filter((name) => tokens.has(name));
    const values = new Set(present.map((name) => tokens.get(name)));
    if (values.size > 1) {
      const detail = present.map((name) => `${name}=${tokens.get(name)}`).join(', ');
      failures.push(`${group.what} (${group.why}): ${detail}`);
    }
  }
  return failures;
}

function checkRadiusScale(tokens) {
  const allowed = new Set(RADIUS_SCALE.map((name) => tokens.get(name)).filter(Boolean));
  const failures = [];

  for (const [name, value] of tokens) {
    if (!name.endsWith('-radius') || value.includes('(')) {
      continue;
    }
    if (!allowed.has(value)) {
      failures.push(`${name}=${value} no pertenece a la escala de radios`);
    }
  }
  return failures;
}
