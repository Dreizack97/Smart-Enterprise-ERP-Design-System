let counter = 0;

/**
 * Un id único y estable para emparejar `<label for>` con su control.
 *
 * Los componentes de formulario aceptan un `id` explícito; este generador
 * cubre el caso en que no se pasa ninguno, que es el común.
 */
export function nextElementId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
