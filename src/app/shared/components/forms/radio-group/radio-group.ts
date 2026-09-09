import { Component, booleanAttribute, computed, input, model } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Una opción.
 *
 * `icon` y `badge` existen porque las decisiones importantes de un ERP (un
 * segundo factor, un plan de facturación) se presentan como tarjetas, no
 * como una lista desnuda. Sin ellos, el componente no podría reemplazar ese
 * marcado y cada pantalla volvería a escribir sus propios radios a mano.
 */
export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: IconName;
  readonly badge?: string;
  readonly disabled?: boolean;
}

/**
 * Un grupo de opciones mutuamente excluyentes.
 *
 * Construido sobre `<input type="radio">` nativos compartiendo un `name`: el
 * navegador ya implementa el desplazamiento con flechas y la semántica de
 * grupo, y reimplementarlos solo agregaría formas de equivocarse.
 */
@Component({
  selector: 'app-radio-group',
  imports: [Field, Icon],
  templateUrl: './radio-group.html',
  styleUrl: './radio-group.css',
})
export class RadioGroup {
  readonly value = model('');
  readonly options = input<readonly RadioOption[]>([]);

  /** Encabezado del grupo. Es el nombre accesible del `radiogroup`. */
  readonly label = input('');

  /** Oculta el encabezado visualmente sin quitárselo a los lectores de pantalla. */
  readonly labelHidden = input(false, { transform: booleanAttribute });

  readonly hint = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly groupId = input(nextElementId('radio-group'));
  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  protected readonly labelId = computed(() => `${this.groupId()}-label`);

  private readonly control = useFormControl({
    id: this.groupId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  protected optionId(value: string): string {
    return `${this.groupId()}-${value}`;
  }

  protected onChange(value: string): void {
    this.value.set(value);
  }
}
