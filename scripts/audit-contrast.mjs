/**
 * Contrast audit of the token layer, in both themes, without a browser.
 *
 * Theming defects hide in the token layer: an ink that was never restated for
 * dark mode keeps its light value and a whole section becomes unreadable at
 * night. That is invisible in code review and easy to miss on screen, because
 * the eye adapts. So it is computed.
 *
 * The script parses the three token files, builds one map per theme resolving
 * `var()` chains, then measures every ink role against the surfaces it can
 * plausibly land on. Run it with `npm run audit:contrast`.
 *
 * Deliberately not a unit test: it is a measurement of the design, and its
 * output is a table someone reads, not a boolean.
 */
import { readTokens } from './token-map.mjs';

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
]);

/**
 * Roles whose background is not a token at all.
 *
 * `--avatar-ink` sits on a hue derived in TypeScript from the person's name;
 * `avatar.ts` solves the lightness so every one of the 360 hues clears AA, and
 * that is checked there, not here.
 */
const NOT_A_TOKEN_PAIR = new Set(['--avatar-ink', '--chart-tooltip-title', '--chart-tooltip-body']);

main();

function main() {
  const { light, dark } = readTokens();

  const failures = [...report('claro', light), ...report('oscuro', dark)];

  if (failures.length === 0) {
    console.log(`✔ Contraste: ningún rol de tinta por debajo de ${AA}:1 en ninguno de los temas.`);
    return;
  }

  console.log(`✘ ${failures.length} combinación(es) por debajo de ${AA}:1\n`);
  for (const row of failures) {
    console.log(
      `  ${row.theme.padEnd(7)} ${row.ink.padEnd(34)} sobre ${row.surface.padEnd(22)} ${row.ratio.toFixed(2)}:1`,
    );
  }
  process.exitCode = 1;
}

function report(theme, tokens) {
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
    const surfaces = own ? [own] : SURFACES;
    for (const surfaceName of surfaces) {
      const surface = lightestStop(tokens.get(surfaceName) ?? '');
      if (!surface) {
        continue;
      }
      const base = surface.a < 1 ? over(surface, parseColour(tokens.get('--surface-1'))) : surface;
      const ratio = contrast(over(ink, base), base);
      if (ratio < AA) {
        failures.push({ theme, ink: name, surface: surfaceName, ratio });
      }
    }
  }
  return failures;
}

function isInk(name) {
  return /-ink$|-ink-strong$|-ink-hover$|-ink-active$|^--ink-/.test(name);
}

/** A gradient is judged by its lightest stop: the worst case for light ink. */
function lightestStop(value) {
  if (!/gradient/i.test(value)) {
    return parseColour(value);
  }
  const stops = [...value.matchAll(/#[0-9a-f]{3,6}\b|rgba?\([^)]*\)/gi)]
    .map((match) => parseColour(match[0]))
    .filter(Boolean);
  return stops.length ? stops.reduce((a, b) => (luminance(a) > luminance(b) ? a : b)) : null;
}

function parseColour(input) {
  const value = (input ?? '').trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((d) => d + d)
            .join('')
        : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
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
