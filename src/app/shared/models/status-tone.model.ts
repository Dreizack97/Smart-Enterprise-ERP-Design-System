import { Tone } from './tone.model';

/**
 * El significado de un estado, no un color.
 *
 * Compartido por `app-status-badge`, `app-alert` y `app-progress` para que el
 * mismo estado se pinte igual dondequiera que aparezca. Deliberadamente no es
 * el mismo vocabulario que `Tone`: ahí el nombre es el matiz, aquí el nombre
 * es lo que el estado significa.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/** Todo estado, en orden de catálogo. El showcase itera sobre esto. */
export const STATUS_TONES = [
  'success',
  'warning',
  'danger',
  'neutral',
  'info',
] as const satisfies readonly StatusTone[];

/**
 * Cada estado semántico se apoya en un matiz del sistema en vez de en colores
 * propios, para que un `success` y un `<app-badge tone="green">` no terminen
 * siendo dos verdes distintos.
 */
export const STATUS_HUE: Record<StatusTone, Tone> = {
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  neutral: 'neutral',
  info: 'blue',
};
