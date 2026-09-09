import {
  Component,
  ElementRef,
  booleanAttribute,
  effect,
  input,
  model,
  viewChild,
} from '@angular/core';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';

/**
 * Casilla de verificación. La etiqueta envuelve al control para ampliar el
 * área de toque.
 *
 * El tamaño es una decisión del lugar donde se usa: en un formulario se
 * sienta junto a una línea de texto; en una lista de tareas es la acción
 * principal de la fila.
 */
@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.css',
})
export class Checkbox {
  /** Estado marcado, como `model()` para que funcione suelto y dentro de un formulario. */
  readonly checked = model(false);

  /**
   * Parcialmente marcada, para un padre que gobierna una lista donde solo
   * algunos hijos están seleccionados. No es un tercer valor: `checked`
   * sigue decidiendo qué hace un clic. El estado no tiene atributo HTML, así
   * que hay que fijarlo en el nodo del DOM.
   */
  readonly indeterminate = input(false, { transform: booleanAttribute });

  readonly label = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly size = input<ControlSize>('sm');
  readonly checkboxId = input(nextElementId('checkbox'));

  /**
   * Oculta la etiqueta visualmente sin quitársela a los lectores de
   * pantalla.
   *
   * Para casillas cuyo significado ya está escrito al lado, como completar
   * una tarea.
   */
  readonly labelHidden = input(false, { transform: booleanAttribute });

  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  constructor() {
    effect(() => {
      this.box().nativeElement.indeterminate = this.indeterminate();
    });
  }

  protected onChange(event: Event): void {
    this.checked.set((event.target as HTMLInputElement).checked);
  }
}
