import { Component, booleanAttribute, input, model } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { ControlSize } from '@shared/models/size.model';
import { Icon } from '@shared/components/media/icon/icon';

/** Un segmento. `label` es siempre el nombre accesible, se muestre o no. */
export interface SegmentOption {
  readonly value: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

/**
 * La elección de una opción de un conjunto corto y fijo, mostradas todas a la
 * vez.
 *
 * Generalizado a partir del `view-toggle` original, que traía cuadrícula y
 * lista escritas a fuego y por eso solo podía ser un selector de vista. El
 * comportamiento nunca fue sobre vistas; fue sobre elegir una entre pocas.
 *
 * Construido como un grupo de botones de alternar con `aria-pressed`, no como
 * un grupo de radio: a este tamaño toda opción es visible y alcanzable con
 * Tab, y el tabindex móvil que implica un grupo de radio haría más difícil de
 * operar un control de dos botones, no más fácil.
 *
 * Para más de unas cinco opciones, o para opciones que necesitan
 * descripción, usar `app-select` en su lugar.
 */
@Component({
  selector: 'app-segmented-control',
  imports: [Icon],
  templateUrl: './segmented-control.html',
  styleUrl: './segmented-control.css',
})
export class SegmentedControl {
  /** El valor elegido. Un `model()`: el propio control lo cambia. */
  readonly value = model('');

  readonly options = input.required<readonly SegmentOption[]>();

  /** Nombre accesible del grupo. */
  readonly label = input('');

  readonly size = input<ControlSize>('md');

  /** Muestra solo el icono; la etiqueta se convierte en el nombre accesible. */
  readonly iconOnly = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  protected select(option: SegmentOption): void {
    if (!this.disabled() && !option.disabled) {
      this.value.set(option.value);
    }
  }
}
