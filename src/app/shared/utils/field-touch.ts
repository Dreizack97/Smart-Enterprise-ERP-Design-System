import { inject } from '@angular/core';
import { FORM_FIELD } from '@angular/forms/signals';

/**
 * Marca como tocado el campo de Signal Forms al que pertenece este control.
 *
 * Necesario porque `blur` no burbujea: la directiva `formField` se sienta en
 * el elemento del componente (`<app-input>`), mientras que el foco se pierde
 * en el `<input>` nativo de adentro, que la directiva nunca ve. Sin esto, los
 * mensajes de validación jamás aparecerían.
 *
 * Debe llamarse en un contexto de inyección (un inicializador de campo). Usada
 * fuera de un formulario, devuelve una función inerte.
 */
export function fieldTouchMarker(): () => void {
  const formField = inject(FORM_FIELD, { optional: true });

  if (!formField) {
    return () => undefined;
  }

  return () => formField.field()().markAsTouched();
}
