import { Component, ElementRef, input, model, viewChild } from '@angular/core';
import { useDialog } from '@shared/utils/dialog-behavior';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';

/** A qué borde está pegado el panel. */
export type DrawerSide = 'start' | 'end';

/** Cuánto del borde ocupa el panel. */
export type DrawerSize = 'sm' | 'md' | 'lg';

/**
 * Un panel pegado al borde de la pantalla.
 *
 * La misma función que un modal — interrumpir para una cosa, volver — con
 * una diferencia que decide cuándo usarlo: **el drawer deja visible la
 * página a su lado**. Eso es lo que el detalle de una fila de una lista
 * necesita. Un modal en el centro cubre la lista, así que pasar de un
 * cliente al siguiente significa cerrar, encontrar la siguiente fila, y
 * abrir de nuevo; un drawer mantiene las filas en pantalla y quien lee
 * conserva su lugar.
 *
 * Sigue siendo `aria-modal`, porque la interacción sigue confinada a él. La
 * visibilidad es para orientación, no para trabajar en dos lugares a la
 * vez.
 *
 * Todo lo que lo hace usable — la trampa de foco, el bloqueo de scroll,
 * Escape, y devolver el foco — es `useDialog`, compartido con `modal` y
 * `confirm-dialog`. Lo que vive aquí es el borde, el tamaño y el
 * deslizamiento.
 *
 * Oculto por clase en vez de desmontado, para que la salida pueda animar:
 * un elemento removido del DOM ya no tiene nada que transicionar.
 */
@Component({
  selector: 'app-drawer',
  imports: [Icon],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer {
  /**
   * Si el drawer se está mostrando.
   *
   * Un `model()` porque se cierra solo: con `Escape`, con el botón de
   * cerrar y con el fondo oscurecido.
   */
  readonly open = model(false);

  /** Título del panel. También su nombre accesible. */
  readonly title = input.required<string>();

  /**
   * El borde del que viene. `end` — la derecha en una lectura de izquierda a
   * derecha — es el valor por defecto: un panel de detalle pertenece al
   * lado donde el ojo termina, y el sidebar ya es dueño del otro.
   */
  readonly side = input<DrawerSide>('end');

  readonly size = input<DrawerSize>('md');

  /** Un formulario a medio llenar no debe cerrarse por accidente. */
  readonly dismissible = input(true);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = nextElementId('drawer-title');

  private readonly dialog = useDialog({
    open: this.open,
    panel: this.panel,
    dismissible: this.dismissible,
  });

  readonly requestClose = this.dialog.requestClose;
  protected readonly onOverlayClick = this.dialog.onOverlayClick;
  protected readonly onTab = this.dialog.onTab;
}
