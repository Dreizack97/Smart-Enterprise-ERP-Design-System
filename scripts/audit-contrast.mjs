/**
 * Contrast audit of the token layer across supported palettes, without a browser.
 *
 * Theming defects hide in the token layer: an ink that was never restated for
 * dark mode keeps its light value and a whole section becomes unreadable at
 * night. That is invisible in code review and easy to miss on screen, because
 * the eye adapts. So it is computed.
 *
 * The script parses the three token files, builds one map per palette resolving
 * `var()` chains, then measures each ink role against its documented fill or
 * the page surfaces it can plausibly land on. Glass surfaces use color-mix and
 * ambient gradients, so backdrop-dependent contrast is not measured here.
 * Run it with `npm run audit:contrast`.
 *
 * Deliberately not a unit test: it is a measurement of the design, and its
 * output is a table someone reads, not a boolean.
 */
import { readThemeTokens } from './token-map.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** WCAG AA for body text. Large text is 3:1, but an ink role has to serve both. */
const AA = 4.5;

/** The surfaces an ink can end up on. A role is judged against all of them. */
const SURFACES = ['--surface-1', '--surface-canvas', '--surface-2', '--surface-3'];

/**
 * Ink roles paired with their own fill instead of the page surfaces.
 *
 * White on a solid accent is correct and would otherwise be reported as 1:1
 * against the card behind it. The pairing cannot be inferred from the names:
 * a stepper's fill is `--stepper-accent`, not `--stepper-accent-surface`.
 */
const OWN_FILL = new Map([
  ['--stepper-accent-ink', '--stepper-accent'],
  ['--segmented-item-ink-active', '--segmented-item-surface-active'],
  ['--sidebar-link-active-ink', '--sidebar-link-active-surface'],
  ['--sidebar-sublink-active-ink', '--sidebar-sublink-active-surface'],
  ['--navbar-mark-ink', '--navbar-mark-surface'],
  ['--form-card-logo-ink', '--form-card-logo-surface'],
  ['--centered-footer-ink', '--centered-footer-surface'],
  ['--centered-footer-ink-hover', '--centered-footer-surface'],
  ['--calendar-today-ink', '--calendar-today-surface'],
  ['--button-primary-ink', '--button-primary-surface'],
  ['--button-danger-ink', '--button-danger-surface'],
  ['--tab-pill-ink', '--tab-pill-surface'],
  ['--upload-error-ink', '--upload-error-surface'],
  ['--dropdown-danger-ink', '--dropdown-danger-surface'],
  ['--field-icon-ink', '--field-icon-surface'],
  ['--date-grid-selected-ink', '--date-grid-selected-surface'],
  ['--date-grid-range-ink', '--date-grid-range-surface'],
  ['--combobox-option-selected-ink', '--combobox-option-selected-surface'],
  ['--toolbar-selection-ink', '--toolbar-selection-surface'],
  ['--field-toggle-ink-hover', '--surface-field'],
  ['--upload-badge-ink', '--surface-1'],
  ['--strength-caution-ink', '--form-card-surface'],
  ['--requirements-pending-ink', '--requirements-surface'],
  ['--requirements-met-ink', '--requirements-surface'],
  ['--form-card-link-ink', '--form-card-surface'],
  ['--sidebar-link-ink-hover', '--sidebar-link-surface-hover'],
  ['--showcase-copied-ink', '--surface-1'],
]);

/** Tone text has documented surface roles and should not be tested on every page surface. */
for (const tone of ['neutral', 'blue', 'green', 'yellow', 'orange', 'red', 'purple']) {
  OWN_FILL.set(`--tone-${tone}-ink`, ['--surface-1']);
  OWN_FILL.set(`--tone-${tone}-ink-strong`, [
    `--tone-${tone}-surface-soft`,
    `--tone-${tone}-surface-subtle`,
  ]);
}

/**
 * Roles whose background is not a token at all.
 *
 * `--avatar-ink` sits on a hue derived in TypeScript from the person's name;
 * `avatar.ts` solves the lightness so every one of the 360 hues clears AA, and
 * that is checked there, not here.
 */
const NOT_A_TOKEN_PAIR = new Set(['--avatar-ink', '--chart-tooltip-title', '--chart-tooltip-body']);

// Estos dos roles solo pintan iconos; el resto pinta texto normal.
const ROLE_MINIMUM = new Map([
  ['--field-toggle-ink-hover', 3],
  ['--upload-badge-ink', 3],
]);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

function main() {
  const palettes = readThemeTokens();
  const failures = palettes.flatMap(({ label, tokens }) => report(label, tokens));

  if (failures.length === 0) {
    console.log(
      `✔ Contraste: ningún par por debajo del umbral de su rol (texto ${AA}:1; iconos 3:1) en las paletas con superficies opacas.`,
    );
    console.log(
      'ℹ Las superficies de cristal no se miden: su contraste depende del fondo y de los degradados ambientales.',
    );
    return;
  }

  console.log(`✘ ${failures.length} combinación(es) por debajo del umbral de su rol\n`);
  for (const row of failures) {
    console.log(
      `  ${row.theme.padEnd(20)} ${row.ink.padEnd(34)} sobre ${row.surface.padEnd(30)} ${row.ratio.toFixed(2)}:1`,
    );
  }
  console.log(
    '\nℹ Las superficies de cristal no se miden: su contraste depende del fondo y de los degradados ambientales.',
  );
  process.exitCode = 1;
}

export function report(theme, tokens) {
  const failures = [];
  for (const [name, value] of tokens) {
    if (!isInk(name) || NOT_A_TOKEN_PAIR.has(name)) {
      continue;
    }
    const ink = parseColour(value);
    if (!ink) {
      continue;
    }
    const own = OWN_FILL.get(name);
    const surfaces = own ? (Array.isArray(own) ? own : [own]) : SURFACES;
    for (const surfaceName of surfaces) {
      const surface = worstSurface(
        tokens.get(surfaceName) ?? '',
        ink,
        tokens.get('--surface-1') ?? '',
      );
      if (!surface) {
        continue;
      }
      const ratio = contrast(over(ink, surface), surface);
      const minimum = ROLE_MINIMUM.get(name) ?? AA;
      if (ratio < minimum) {
        failures.push({ theme, ink: name, surface: surfaceName, ratio, minimum });
      }
    }
  }
  return failures;
}

function isInk(name) {
  return /-ink$|-ink-strong$|-ink-hover$|-ink-active$|^--ink-/.test(name);
}

/** Estimates the lowest contrast across an opaque gradient for either light or dark ink. */
function worstSurface(value, ink, pageSurface) {
  const stops = /gradient/i.test(value)
    ? [...value.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)]
        .map((match) => parseColour(match[0]))
        .filter(Boolean)
    : [parseColour(value)].filter(Boolean);
  if (stops.length === 0) return null;

  const page = parseColour(pageSurface);
  let worst = null;
  let lowestRatio = Infinity;
  const consider = (colour) => {
    const surface = colour.a < 1 ? over(colour, page) : colour;
    const ratio = contrast(over(ink, surface), surface);
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      worst = surface;
    }
  };

  consider(stops[0]);
  for (let index = 1; index < stops.length; index += 1) {
    const from = stops[index - 1];
    const to = stops[index];
    for (let step = 1; step <= 32; step += 1) {
      const fraction = step / 32;
      consider({
        r: from.r + (to.r - from.r) * fraction,
        g: from.g + (to.g - from.g) * fraction,
        b: from.b + (to.b - from.b) * fraction,
        a: from.a + (to.a - from.a) * fraction,
      });
    }
  }
  return worst;
}

export function parseColour(input) {
  const value = (input ?? '').trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value);
  if (hex) {
    const digits =
      hex[1].length <= 4
        ? hex[1]
            .split('')
            .map((d) => d + d)
            .join('')
        : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1,
    };
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (!rgb) {
    return null;
  }
  const parts = rgb[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
    return null;
  }
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}

function over(front, back) {
  if (!back) {
    return front;
  }
  return {
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}
