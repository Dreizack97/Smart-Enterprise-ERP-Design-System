import { Signal, computed } from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { fieldTouchMarker } from './field-touch';

/** Los signals que todo control de formulario del sistema expone como `input()`. */
export interface FormControlInputs {
  /** El id del control, del cual se deriva el id del mensaje de error. */
  readonly id: Signal<string>;
  /** Un mensaje escrito a mano, para formularios sin validación declarativa. */
  readonly error: Signal<string>;
  /** Los errores que Signal Forms inyecta. */
  readonly errors: Signal<readonly ControlError[]>;
  /** Signal Forms establece esto cuando se abandona el campo. */
  readonly touched: Signal<boolean>;
}

/** Estado derivado y manejador de blur compartidos por todo control. */
export interface FormControlState {
  /** Id del elemento del mensaje, para `aria-describedby`. */
  readonly errorId: Signal<string>;
  /**
   * El texto de error a mostrar, o un string vacío.
   *
   * Un `error` manual siempre gana. Los errores de validación solo salen a
   * la superficie una vez que se abandona el campo: un campo obligatorio es
   * inválido desde el primer render, y quejarse antes de que alguien haya
   * tenido oportunidad de escribir es hostil.
   */
  readonly message: Signal<string>;
  /** Marca el campo como tocado en Signal Forms. Conectar a `(blur)`. */
  readonly onBlur: () => void;
}

/**
 * El contrato compartido de los controles de formulario del sistema.
 *
 * Cada uno solía repetir `errorId`, `message` y el par `markTouched` /
 * `onBlur` palabra por palabra. La forma es deliberada y debe ser idéntica en
 * todos, así que tenerla una sola vez es correcto y no incidental.
 *
 * Debe llamarse en un contexto de inyección, porque `fieldTouchMarker()`
 * inyecta.
 */
export function useFormControl(inputs: FormControlInputs): FormControlState {
  const errorId = computed(() => `${inputs.id()}-error`);

  const message = computed(() => {
    const manual = inputs.error();
    if (manual) {
      return manual;
    }
    return inputs.touched() ? (inputs.errors()[0]?.message ?? '') : '';
  });

  const markTouched = fieldTouchMarker();

  return { errorId, message, onBlur: () => markTouched() };
}
