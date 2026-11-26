/**
 * Quita del control los caracteres que no estén en `allowedChars` y,
 * si se pide, convierte a mayúsculas. Deja el cursor donde estaba.
 */
export function sanitizeInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  allowedChars: string,
  uppercase = false,
): string {
  const raw = el.value;
  let next = uppercase ? raw.toUpperCase() : raw;

  if (allowedChars) {
    const re = new RegExp(`^${allowedChars}$`, 'u');
    next = Array.from(next)
      .filter((ch) => re.test(ch))
      .join('');
  }

  if (next !== raw) {
    const removed = raw.length - next.length;
    const caret = Math.max(0, (el.selectionStart ?? next.length) - removed);
    el.value = next;
    el.setSelectionRange(caret, caret);
  }

  return next;
}
