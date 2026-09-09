/**
 * Los matices de color del sistema.
 *
 * Un solo vocabulario para todo el catálogo. Cada componente antes declaraba
 * el suyo propio — `BadgeTone`, `ActivityTone`, `EventTone`, `ReportTone` — y
 * el mismo nombre terminaba pintando colores distintos en lugares distintos.
 *
 * Un componente nunca nombra un matiz en su hoja de estilos: pone `data-tone`
 * en el elemento y agrega una de las clases `.tone-*` de `styles/shell.css`.
 * El valor de modo oscuro entonces viene del token, no del componente.
 */
export type Tone = 'neutral' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple';

/** Todo matiz, en orden de catálogo. El showcase itera sobre esto. */
export const TONES = [
  'neutral',
  'blue',
  'green',
  'yellow',
  'orange',
  'red',
  'purple',
] as const satisfies readonly Tone[];

/**
 * Cómo se pinta un tono.
 *
 * - `soft`   píldoras y burbujas: relleno del matiz, primer plano más fuerte
 * - `subtle` superficies más grandes como una alerta en línea: relleno más claro
 * - `text`   una cifra o nota desnuda en una tarjeta: sin relleno alguno
 */
export type ToneVariant = 'soft' | 'subtle' | 'text';
