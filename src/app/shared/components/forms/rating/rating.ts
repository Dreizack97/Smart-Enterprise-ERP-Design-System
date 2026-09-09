import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Un puntaje sobre cinco, leído o dado.
 *
 * Los dos modos son elementos genuinamente distintos, no un elemento con
 * una bandera de deshabilitado:
 *
 * - **Leer** una calificación es mirar la imagen de un número. Es un solo
 *   `role="img"` etiquetado «4 de 5», así que un lector de pantalla dice el
 *   puntaje una vez en vez de recorrer cinco estrellas idénticas.
 * - **Dar** una es elegir entre unas pocas opciones, que es un grupo de
 *   radio. Los radios nativos traen las flechas, el foco móvil y la
 *   semántica de grupo; una fila de botones no traería nada de eso.
 *
 * Solo estrellas completas. Media estrella es un valor al que el control no
 * se puede fijar por teclado ni por puntero, así que ofrecerla para mostrar
 * significaría un componente que puede mostrar un estado que no puede
 * producir.
 */
@Component({
  selector: 'app-rating',
  imports: [Icon],
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class Rating {
  readonly value = model(0);

  /** Cuántas estrellas hay. Cinco, salvo que un dominio diga lo contrario. */
  readonly max = input(5, { transform: numberAttribute });

  /** Un puntaje para mirar en vez de para fijar. */
  readonly readonly = input(false, { transform: booleanAttribute });

  readonly size = input<ControlSize>('md');

  /** Nombra la calificación: «Valoración del producto». Obligatorio para poder fijar una. */
  readonly label = input('');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly groupId = input(nextElementId('rating'));

  protected readonly stars = computed(() =>
    Array.from({ length: this.max() }, (_, index) => index + 1),
  );

  protected readonly summary = computed(() => `${this.value()} de ${this.max()}`);

  protected readonly labelId = computed(() => `${this.groupId()}-label`);

  /**
   * El lado de la estrella en píxeles, por tamaño de control.
   *
   * `app-icon` mide en píxeles y el resto del sistema mide en nombres de
   * tamaño; el mapeo tiene que ocurrir en algún lugar, y aquí es mejor que
   * en cada sitio donde se llama.
   */
  protected readonly starSize = computed(() => STAR_SIZE[this.size()]);

  protected optionId(star: number): string {
    return `${this.groupId()}-${star}`;
  }

  protected select(star: number): void {
    if (!this.disabled()) {
      this.value.set(star);
    }
  }
}

/** Un lado de estrella por tamaño de control, en píxeles. */
const STAR_SIZE: Record<ControlSize, number> = { sm: 14, md: 18, lg: 22 };
