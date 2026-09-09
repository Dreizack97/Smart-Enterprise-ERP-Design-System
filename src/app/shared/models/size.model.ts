/**
 * El eje de tamaño de los controles interactivos.
 *
 * Deliberadamente separado de `variant`. En el original ambos venían soldados
 * — cada variante de botón cargaba su propio padding y, en tres de seis
 * casos, ningún tamaño de fuente — así que el mismo botón medía distinto
 * según dónde se colocara. Mantener los ejes ortogonales es lo que permite
 * que un botón, un campo y un select se alineen en una barra de herramientas.
 *
 * Las medidas viven en `styles/tokens/component.css` como `--control-height-*`.
 */
export type ControlSize = 'sm' | 'md' | 'lg';

/** Todos los tamaños, en orden de escala. El showcase itera sobre esto. */
export const CONTROL_SIZES = ['sm', 'md', 'lg'] as const satisfies readonly ControlSize[];
