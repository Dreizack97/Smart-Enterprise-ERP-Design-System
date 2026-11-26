/**
 * Eje de densidad para contenedores, tablas y superposiciones.
 *
 * Ortogonal al tamaño (`ControlSize`) y a la variante visual (`variant`).
 * - `normal`: Espaciado estándar (1.5rem / 24px) para lectura cómoda y paneles generales.
 * - `compact`: Relleno y dimensiones compactas (10-12px) para captura intensiva de datos de ERP.
 */
export type ComponentDensity = 'normal' | 'compact';

/** Lista inmutable de densidades para validación y showcases. */
export const COMPONENT_DENSITIES = [
  'normal',
  'compact',
] as const satisfies readonly ComponentDensity[];
