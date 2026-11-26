import { Component, booleanAttribute, computed, input, model } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { ControlError } from '@shared/models/form-control.model';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { sanitizeInput } from '@shared/utils/sanitize-input';
import { Icon } from '@shared/components/media/icon/icon';
import { Field } from '@shared/components/forms/field/field';

/** El `type` nativo, que decide el teclado y la validación del navegador. */
export type InputType = 'text' | 'email' | 'tel' | 'url' | 'date' | 'time' | 'search';

/**
 * Campo de texto con etiqueta, icono opcional y mensaje de error.
 *
 * Cumple el contrato `FormValueControl` de Signal Forms: expone `value`
 * como `model()` y acepta `errors`, `touched`, `disabled`, `required` y
 * `name`, que la directiva `formField` mantiene sincronizados. También
 * funciona por su cuenta, con `[(value)]` y un `error` escrito a mano.
 */
@Component({
  selector: 'app-input',
  imports: [Icon, Field],
  templateUrl: './input.html',
  styleUrl: './input.css',
})
export class Input {
  /** El valor del campo, como `model()` para que funcione suelto y dentro de un formulario. */
  readonly value = model('');

  readonly label = input('');
  readonly type = input<InputType>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly size = input<ControlSize>('md');

  /** Icono decorativo mostrado dentro del campo. `null` lo omite. */
  readonly icon = input<IconName | null>(null);

  /** Texto de apoyo bajo el campo. Se oculta mientras se muestra un error. */
  readonly hint = input('');

  readonly disabled = input(false, { transform: booleanAttribute });

  /** Dentro de Signal Forms esto viene del esquema, no de la plantilla. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Confirma desde el formulario que el valor es válido; no sustituye su validación. */
  readonly showValidCheck = input(false, { transform: booleanAttribute });

  readonly name = input('');

  /** Máximo número de caracteres permitidos. */
  readonly maxlength = input<number | null, unknown>(null, {
    transform: (val: unknown) => (val != null && val !== '' ? Number(val) : null),
  });
  readonly minlength = input<number | null, unknown>(null, {
    transform: (val: unknown) => (val != null && val !== '' ? Number(val) : null),
  });
  readonly title = input<string | null>(null);

  /**
   * Clase de caracteres permitidos, p. ej. `[A-Za-z0-9_-]`.
   * Lo que no coincida se borra al escribir o pegar. Usa el flag `u`,
   * así que acepta `\p{L}` (cualquier letra, con acentos y ñ).
   */
  readonly allowedChars = input('');

  /** Pasa el texto a mayúsculas mientras se escribe. */
  readonly uppercase = input(false, { transform: booleanAttribute });

  /** Id del control, que ata etiqueta y mensaje de error entre sí. */
  readonly inputId = input(nextElementId('input'));
  /**
   * Nombre accesible para un campo mostrado sin etiqueta visible.
   *
   * Un control sin `label` ni `ariaLabel` le llega a un lector de pantalla
   * como una caja de edición sin nombre, que es una falla de WCAG 4.1.2.
   * Ofrecer esto hace que el caso sin etiqueta sea expresable y no solo
   * posible.
   */
  readonly ariaLabel = input('');

  /** Mensaje escrito a mano, para formularios sin validación declarativa. */
  readonly error = input('');

  /** Errores inyectados por Signal Forms. */
  readonly errors = input<readonly ControlError[]>([]);

  /** Signal Forms establece esto cuando se abandona el campo. */
  readonly touched = input(false, { transform: booleanAttribute });

  private readonly control = useFormControl({
    id: this.inputId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  /** Oculta la confirmación si el campo está vacío, deshabilitado o tiene errores, incluso antes del blur. */
  protected readonly validCheckVisible = computed(
    () =>
      this.showValidCheck() &&
      !!this.value().trim() &&
      !this.disabled() &&
      !this.error() &&
      this.errors().length === 0,
  );

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.value.set(sanitizeInput(el, this.allowedChars(), this.uppercase()));
  }
}
