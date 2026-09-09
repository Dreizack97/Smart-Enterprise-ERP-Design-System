import { Component, booleanAttribute, input, model, numberAttribute } from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';

/**
 * Campo numérico.
 *
 * Separado de `app-input` porque su valor es un `number`, no un string: un
 * solo componente no puede satisfacer a la vez `FormValueControl<string>` y
 * `FormValueControl<number>`, y convertir en cada pantalla sería peor que
 * tener dos controles.
 */
@Component({
  selector: 'app-number-input',
  imports: [Field],
  templateUrl: './number-input.html',
  styleUrl: './number-input.css',
})
export class NumberInput {
  readonly value = model(0);
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly size = input<ControlSize>('md');

  /** Unidad mostrada después del número: `%`, `kg`, `MXN`. */
  readonly suffix = input('');

  /**
   * `undefined` y no `null`: esa es la forma que exige el contrato de
   * Signal Forms, que llena estos límites a partir de los validadores del
   * esquema.
   */
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1, { transform: numberAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly inputId = input(nextElementId('number'));
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
    id: this.inputId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).valueAsNumber;
    // Un campo vacío produce NaN; se lee como cero y no como "sin valor".
    this.value.set(Number.isNaN(raw) ? 0 : raw);
  }
}
