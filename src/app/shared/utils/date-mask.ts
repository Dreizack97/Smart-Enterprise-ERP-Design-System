/**
 * La máscara de escritura de un campo de fecha: entran dígitos, sale
 * `dd/mm/aaaa`.
 *
 * Compartida por los tres campos de fecha — uno en `date-picker`, dos en
 * `date-range-picker` — porque una máscara es sobre todo aritmética de
 * cursor, y esa aritmética escrita tres veces son tres comportamientos
 * distintos.
 *
 * ## Lo que una máscara tiene que resolver bien
 *
 * Insertar los separadores es la mitad fácil. La mitad que sale mal:
 *
 * - **El cursor.** Reescribir el valor del campo mueve el cursor al final,
 *   así que corregir el mes de `08/09/2026` desde el medio lanza el cursor
 *   hasta el extremo derecho en cada tecleo. Por eso la posición se rastrea
 *   por **cuántos dígitos la preceden**, no por índice de carácter: los
 *   dígitos son lo que sobrevive a la reescritura, los separadores van y
 *   vienen.
 * - **Backspace sobre un separador.** Con el cursor justo después del `/` de
 *   `08/09`, borrar el separador deja `0809`, que la máscara reescribe de
 *   inmediato como `08/09` — así que Backspace parece no hacer nada, para
 *   siempre. La tecla tiene que alcanzar más allá del separador y tomar el
 *   dígito de antes.
 *
 * El separador solo se escribe cuando le sigue un dígito, así que el campo
 * nunca se queda con un `08/` colgando al final con el que el siguiente
 * Backspace tenga que pelear.
 */

/** Dígitos de una fecha completa: dos de día, dos de mes, cuatro de año. */
const MAX_DIGITS = 8;

/** Dónde caen los separadores, como conteo de dígitos. */
const BREAKS = [2, 4];

/**
 * Si el campo contiene una fecha completa en vez de una que se está
 * escribiendo.
 *
 * La diferencia decide cuándo se puede confirmar una fecha escrita.
 * Confirmar en cada tecleo significa confirmar `01/09/19` en camino a
 * `01/09/1997` — y como un año de dos cifras se expande a 2019, el campo se
 * reescribe como `01/09/2019` bajo los dedos y los últimos dos dígitos
 * chocan con el tope de longitud. **1997 se vuelve imposible de escribir.**
 * Una fecha solo está terminada cuando su año lo está.
 */
export function hasFullDate(text: string): boolean {
  return countDigits(text) === MAX_DIGITS;
}

/** Lo que la máscara hace de un string, y dónde termina el cursor en él. */
export interface MaskedDate {
  readonly text: string;
  readonly caret: number;
}

/**
 * La máscara en sí: entra un string y un cursor, sale un string enmascarado y
 * un cursor.
 *
 * Pura, y separada del elemento al que normalmente se aplica, para que la
 * aritmética del cursor —la parte fácil de arruinar sutilmente e imposible
 * de verificar a simple vista— se pueda comprobar directamente en vez de a
 * través de un navegador.
 */
export function maskDate(raw: string, caret: number): MaskedDate {
  const digitsBeforeCaret = countDigits(raw.slice(0, caret));
  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS);
  const text = group(digits);
  return { text, caret: positionAfterDigits(text, digitsBeforeCaret) };
}

/**
 * Aplica la máscara a un campo en el propio elemento, e informa lo que ahora
 * contiene.
 *
 * Escribe sobre el elemento en vez de devolver el string para que quien
 * llama lo aplique, porque el cursor tiene que restaurarse **en el mismo
 * turno** que el valor: con cualquier espacio de por medio, el navegador ya
 * lo habrá puesto al final.
 */
export function maskDateField(input: HTMLInputElement): string {
  const { text, caret } = maskDate(input.value, input.selectionStart ?? input.value.length);
  input.value = text;
  input.setSelectionRange(caret, caret);
  return text;
}

/**
 * Deja que Backspace borre el dígito que se esconde detrás de un separador.
 *
 * Se llama en `keydown`, antes de que ocurra el borrado: mueve la selección
 * un carácter a la izquierda, para que el navegador elimine el dígito y la
 * máscara tenga algo a lo que reaccionar.
 */
export function absorbSeparatorBackspace(event: KeyboardEvent): void {
  if (event.key !== 'Backspace') {
    return;
  }

  const input = event.target as HTMLInputElement;
  const caret = input.selectionStart ?? 0;

  // Solo cuando no hay nada seleccionado: con una selección, Backspace la
  // borra y no es el cursor lo que aquí se está preguntando.
  if (caret !== input.selectionEnd) {
    return;
  }

  const moved = caretPastSeparator(input.value, caret);
  if (moved !== caret) {
    input.setSelectionRange(moved, moved);
  }
}

/**
 * Dónde tiene que estar el cursor para que Backspace borre un dígito.
 *
 * Un carácter más a la izquierda cuando un separador estorba. Pura, por la
 * misma razón que `maskDate`: esta es la regla que hace que la tecla
 * funcione, y «el campo se veía bien cuando lo probé» no es una
 * comprobación.
 */
export function caretPastSeparator(text: string, caret: number): number {
  if (caret > 0 && text[caret - 1] === '/') {
    return caret - 1;
  }
  return caret;
}

/** `08092026` → `08/09/2026`, con un separador solo donde le sigue un dígito. */
function group(digits: string): string {
  let text = '';
  for (let index = 0; index < digits.length; index += 1) {
    if (BREAKS.includes(index)) {
      text += '/';
    }
    text += digits[index];
  }
  return text;
}

/** El índice justo después del enésimo dígito de `text`. */
function positionAfterDigits(text: string, digits: number): number {
  if (digits === 0) {
    return 0;
  }
  let seen = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (/\d/.test(text[index])) {
      seen += 1;
      if (seen === digits) {
        return index + 1;
      }
    }
  }
  return text.length;
}

function countDigits(text: string): number {
  return (text.match(/\d/g) ?? []).length;
}
