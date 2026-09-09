import { Component, computed, input, numberAttribute } from '@angular/core';
import { ControlSize } from '@shared/models/size.model';
import { Avatar } from '@shared/components/media/avatar/avatar';

/**
 * Las personas ligadas a algo, en el ancho de unos dos avatares.
 *
 * Discos superpuestos más un conteo de quienes no cupieron. El conteo es la
 * razón de ser del componente: una fila de avatares que simplemente sigue
 * empujando arrastra el resto de la celda fuera de la pantalla el día que
 * una tarea tenga nueve asignados.
 */
@Component({
  selector: 'app-avatar-group',
  imports: [Avatar],
  templateUrl: './avatar-group.html',
  styleUrl: './avatar-group.css',
  host: { role: 'group', '[attr.aria-label]': 'label() || null' },
})
export class AvatarGroup {
  /** Todas las personas, en el orden en que deben leerse. */
  readonly names = input.required<readonly string[]>();

  /** Cuántos discos se dibujan antes de que el resto se convierta en un conteo. */
  readonly max = input(4, { transform: numberAttribute });

  readonly size = input<ControlSize>('md');

  /** Nombra al grupo como conjunto, p. ej. «Asignados a la tarea». */
  readonly label = input('');

  protected readonly shown = computed(() => this.names().slice(0, this.max()));

  protected readonly hidden = computed(() => Math.max(0, this.names().length - this.max()));

  /**
   * Los nombres detrás del «+N», para que el conteo no sea un callejón sin
   * salida.
   *
   * Quien haya desbordado sigue siendo una persona que quien lee podría
   * necesitar identificar, y un número desnudo no le dice nada. Se convierte
   * en el `title` del disco y en su nombre accesible.
   */
  protected readonly hiddenNames = computed(() => this.names().slice(this.max()).join(', '));
}
