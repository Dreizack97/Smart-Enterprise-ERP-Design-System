import { Component, booleanAttribute, computed, input, model } from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Una opción de un `app-select`. */
export interface SelectOption {
  /** El valor emitido cuando se elige. */
  readonly value: string;

  /** El texto mostrado en la lista. */
  readonly label: string;

  readonly disabled?: boolean;

  /** Encabezado opcional al que pertenece esta opción, renderizado como `<optgroup>`. */
  readonly group?: string;
}

/** Opciones bajo un `<optgroup>`, o bajo ninguno cuando `label` está vacío. */
export interface SelectGroup {
  readonly label: string;
  readonly options: readonly SelectOption[];
}

/**
 * Un desplegable nativo vestido con la piel del sistema.
 *
 * El `<select>` nativo se conserva a propósito: en móvil abre el selector
 * del sistema operativo, que ninguna reimplementación iguala en usabilidad.
 */
@Component({
  selector: 'app-select',
  imports: [Field, Icon],
  templateUrl: './select.html',
  styleUrl: './select.css',
})
export class Select {
  readonly value = model('');
  readonly label = input('');
  readonly hint = input('');
  readonly size = input<ControlSize>('md');

  /** Opciones ofrecidas, en el orden en que se muestran. */
  readonly options = input<readonly SelectOption[]>([]);

  /** Se muestra como primera opción, no seleccionable, mientras el valor está vacío. */
  readonly placeholder = input('');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly selectId = input(nextElementId('select'));
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

  /**
   * Las opciones repartidas en `<optgroup>`s, en orden de primera aparición.
   *
   * `SelectOption.group` estaba documentado como «renderizado como
   * `<optgroup>`» y nunca implementado: la plantilla pintaba una lista
   * plana y el campo se ignoraba en silencio. Una promesa en una API
   * pública que nada cumple es peor que ninguna promesa, y solo salió a
   * la luz cuando el catálogo la ejerció.
   *
   * Las opciones sin grupo conservan su lugar al frente en vez de
   * empujarse después de los grupos: quien escribe «Todos» primero quiere
   * que quede primero.
   */
  protected readonly groups = computed<readonly SelectGroup[]>(() => {
    const groups: SelectGroup[] = [];
    const byLabel = new Map<string, SelectOption[]>();

    for (const option of this.options()) {
      const label = option.group ?? '';
      let bucket = byLabel.get(label);
      if (!bucket) {
        bucket = [];
        byLabel.set(label, bucket);
        groups.push({ label, options: bucket });
      }
      bucket.push(option);
    }
    return groups;
  });

  private readonly control = useFormControl({
    id: this.selectId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  protected onChange(event: Event): void {
    this.value.set((event.target as HTMLSelectElement).value);
  }
}
