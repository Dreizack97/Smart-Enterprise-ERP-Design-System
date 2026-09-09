/**
 * La forma de un string usada para comparar, nunca para mostrarse.
 *
 * En minúsculas y sin diacríticos, para que «diaz» encuentre «Díaz» y «angel»
 * encuentre «Ángel». En español esto no es un detalle cosmético: un acento es
 * algo que la gente omite al escribir, y un filtro que lo exige reporta «sin
 * resultados» sobre una lista que claramente contiene el nombre.
 *
 * Se compartió en cuanto apareció un segundo consumidor — la pantalla de
 * Listado ya la tenía, y `combobox` necesita exactamente la misma regla. Dos
 * copias de una regla de comparación son dos respuestas a «¿esto coincide?».
 */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
