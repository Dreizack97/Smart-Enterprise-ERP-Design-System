/**
 * Pone texto en el portapapeles, e informa si funcionó.
 *
 * Un solo lugar para esto, porque ahora dos componentes copian: las muestras
 * de color del catálogo y `code-block`. Lo interesante no es la llamada — es
 * que la llamada **falla en condiciones normales**. `navigator.clipboard`
 * necesita un contexto seguro, el navegador puede negar el permiso sin más, y
 * un navegador embebido o automatizado normalmente lo hace. Un componente que
 * asume éxito muestra «copiado» aunque no se copió nada, que es peor que no
 * ofrecerlo.
 *
 * Por eso el resultado es un booleano y no una promesa que rechaza: aquí la
 * negativa es un resultado esperado, no una excepción, y cada llamador tiene
 * que decir algo distinto para cada caso.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
