import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';

/** Área de texto multilínea. Sin redimensionado manual: rompe la cuadrícula. */
@Component({
  selector: 'app-textarea',
  imports: [Field],
  templateUrl: './textarea.html',
  styleUrl: './textarea.css',
})
export class Textarea {
  readonly value = model('');
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');

  /** Altura del área, en líneas de texto. */
  readonly rows = input(3, { transform: numberAttribute });

  /** Presupuesto de caracteres mostrado como contador. `0` lo oculta. */
  readonly maxLength = input(0, { transform: numberAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly textareaId = input(nextElementId('textarea'));
  /**
   * Nombre accesible para un campo mostrado sin etiqueta visible.
   *
   * Un control sin `label` ni `ariaLabel` le llega a un lector de pantalla
   * como una caja de edición sin nombre, que es una falla de WCAG 4.1.2.
   * Ofrecer esto hace que el caso sin etiqueta sea expresable y no solo
   * posible.
   */
  readonly ariaLabel = input('');
  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  private readonly control = useFormControl({
    id: this.textareaId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  protected readonly counter = computed(() => {
    const limit = this.maxLength();
    return limit > 0 ? `${this.value().length} / ${limit}` : '';
  });

  /** Advierte antes de llegar al límite, no después: para entonces ya es tarde. */
  protected readonly nearLimit = computed(() => {
    const limit = this.maxLength();
    return limit > 0 && this.value().length > limit * 0.9;
  });

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLTextAreaElement).value);
  }
}
