/** El umbral WCAG 2.1 para texto de cuerpo, para que la página nunca repita un número desnudo. */
export const CONTRAST_AA = 4.5;

/**
 * El ratio de contraste WCAG entre un primer plano y la superficie detrás de
 * él.
 *
 * Calculado en el navegador a partir de los colores ya resueltos, en vez de
 * anotado a mano. Una anotación es una afirmación sobre un valor; esto es el
 * valor. Cuando un token se mueve, el número se mueve con él y el catálogo
 * no puede quedarse obsoleto en silencio.
 *
 * Los primeros planos translúcidos se componen primero sobre la superficie —
 * varios rellenos de tono son lavados `rgba(...)`, y tratar uno como opaco
 * reporta un ratio que quien lee nunca ve.
 *
 * Devuelve `null` cuando alguno de los dos colores no se puede interpretar,
 * para que quien llama muestre nada en vez de un número seguro pero
 * equivocado.
 */
export function contrastRatio(foreground: string, surface: string): number | null {
  const back = parseColour(surface);
  const front = parseColour(foreground);
  if (!back || !front) {
    return null;
  }

  const flat = composite(front, { ...back, a: 1 });
  const lighter = Math.max(relativeLuminance(flat), relativeLuminance(back));
  const darker = Math.min(relativeLuminance(flat), relativeLuminance(back));
  return (lighter + 0.05) / (darker + 0.05);
}

/** «4.53» — dos decimales, porque el tercero nunca cambia un veredicto. */
export function formatRatio(ratio: number): string {
  return ratio.toFixed(2);
}

interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

function composite(front: Rgba, back: Rgba): Rgba {
  return {
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a),
    a: 1,
  };
}

function relativeLuminance({ r, g, b }: Rgba): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Interpreta las dos formas que `getComputedStyle` devuelve: `#rrggbb` (y
 * `#rgb`) tal como se escriben en los tokens, y `rgb()` / `rgba()` una vez
 * que el navegador ya normalizó uno.
 */
function parseColour(input: string): Rgba | null {
  const value = input.trim();

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
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) {
      return null;
    }
    const alpha = parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1;
    return { r: parts[0], g: parts[1], b: parts[2], a: alpha };
  }

  return null;
}
