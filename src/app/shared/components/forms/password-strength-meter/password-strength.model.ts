import { Tone } from '@shared/models/tone.model';

/**
 * El puntaje de zxcvbn: 0 = trivial de adivinar, 4 = muy resistente.
 *
 * Una estimación de entropía, no una regla de negocio: la política que
 * decide si una contraseña se acepta se queda en el backend (o, sin
 * backend, en el esquema del formulario).
 */
export type PasswordScore = 0 | 1 | 2 | 3 | 4;

/** El resultado de zxcvbn, reducido a lo que la interfaz necesita mostrar. */
export interface PasswordStrength {
  readonly score: PasswordScore;
  /** Razón principal de la debilidad, ya traducida. `null` si no hay ninguna. */
  readonly warning: string | null;
  /** Consejo concreto para mejorarla, ya traducido. */
  readonly suggestions: readonly string[];
  /** Tiempo estimado para romperla bajo un ataque offline con hashing lento. */
  readonly crackTime: string;
}

/**
 * Cómo se presenta cada puntaje.
 *
 * El matiz viene del vocabulario de tonos compartido. El original escribía
 * aquí `bg-amber-500` y `text-amber-700`, y el ámbar ya había sido retirado
 * del sistema como duplicado del amarillo — así que ese nivel quedaba fuera
 * del remapeo de modo oscuro y su etiqueta salía ilegible sobre una tarjeta
 * oscura.
 */
export interface StrengthLevel {
  readonly label: string;
  readonly tone: Tone;
}

export const STRENGTH_LEVELS: readonly StrengthLevel[] = [
  { label: 'Muy débil', tone: 'red' },
  { label: 'Débil', tone: 'orange' },
  { label: 'Aceptable', tone: 'yellow' },
  { label: 'Buena', tone: 'green' },
  { label: 'Excelente', tone: 'green' },
];
