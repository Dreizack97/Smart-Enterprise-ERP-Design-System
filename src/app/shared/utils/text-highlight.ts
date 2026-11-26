/** Un tramo de texto, marcado según coincida o no con la búsqueda. */
export interface TextSegment {
  readonly text: string;
  readonly match: boolean;
}

type Range = readonly [start: number, end: number];

/**
 * Minúsculas y sin diacríticos: «Nómina» y «nomina» se escriben igual al buscar.
 *
 * Se normaliza carácter por carácter para que cada posición del resultado
 * corresponda a la misma posición del original. Normalizar la cadena entera
 * puede cambiar su longitud (un acento ya descompuesto, por ejemplo) y el
 * resaltado caería desplazado.
 */
export function normalizeText(text: string): string {
  return Array.from(text, (char) => foldChar(char)).join('');
}

/**
 * Si `text` contiene todas las palabras de `query`, en cualquier orden.
 * Una consulta vacía coincide con todo.
 */
export function matchesQuery(text: string, query: string): boolean {
  const normalized = normalizeText(text);
  return tokenize(query).every((token) => normalized.includes(token));
}

/**
 * Corta `text` en tramos que coinciden y que no coinciden con `query`,
 * conservando las mayúsculas y los acentos del original.
 */
export function segmentMatchedText(text: string, query: string): readonly TextSegment[] {
  const ranges = mergeRanges(findRanges(normalizeText(text), tokenize(query)));
  if (ranges.length === 0) {
    return [{ text, match: false }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), match: false });
    }
    segments.push({ text: text.slice(start, end), match: true });
    cursor = end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), match: false });
  }
  return segments;
}

/**
 * Un carácter en minúscula y sin diacrítico. Si alguna de las dos
 * transformaciones cambiaría su longitud, se omite: alinear posiciones pesa
 * más que plegar un carácter exótico.
 */
function foldChar(char: string): string {
  const lower = char.toLowerCase();
  const candidates = [lower.normalize('NFD').replace(/[̀-ͯ]/g, ''), lower];
  return candidates.find((candidate) => candidate.length === char.length) ?? char;
}

function tokenize(query: string): readonly string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

function findRanges(text: string, tokens: readonly string[]): Range[] {
  const ranges: Range[] = [];
  for (const token of tokens) {
    for (let index = text.indexOf(token); index !== -1; index = text.indexOf(token, index + 1)) {
      ranges.push([index, index + token.length]);
    }
  }
  return ranges;
}

/** Ordena y une los rangos que se tocan o se encimen. */
function mergeRanges(ranges: readonly Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged.at(-1);
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
