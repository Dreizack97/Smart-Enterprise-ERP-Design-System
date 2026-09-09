import { Component, ElementRef, input, model, viewChild } from '@angular/core';
import { useDialog } from '@shared/utils/dialog-behavior';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';

/** Ancho máximo del panel del diálogo. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Diálogo modal.
 *
 * Oculto por clase en vez de desmontado: el panel tiene que quedarse en el
 * DOM para que su salida pueda animar. Por eso `open` no envuelve el
 * contenido en un `@if`.
 *
 * Al abrirse atrapa el foco, sostiene el bloqueo de scroll del documento y
 * responde a `Escape`; al cerrarse devuelve el foco a lo que sea que lo
 * abrió.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  host: { '(keydown.escape)': 'requestClose()' },
})
export class Modal {
  /**
   * Si el diálogo se está mostrando.
   *
   * Un `model()` porque el diálogo se cierra solo: con `Escape`, con el
   * botón de cerrar y con el fondo.
   */
  readonly open = model(false);

  /** Título del diálogo. También su nombre accesible, a través de `aria-labelledby`. */
  readonly title = input.required<string>();

  readonly size = input<ModalSize>('lg');

  /** Un diálogo destructivo o un formulario a medio llenar no debe cerrarse por accidente. */
  readonly dismissible = input(true);

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = nextElementId('modal-title');

  /**
   * La trampa de foco, el bloqueo de scroll, Escape y la devolución del
   * foco vienen todos de `useDialog`, compartido con `confirm-dialog` y
   * `drawer`. Lo que queda aquí es lo que hace de esto un modal y no un
   * drawer: su tamaño y el hecho de que se sienta en el centro.
   */
  private readonly dialog = useDialog({
    open: this.open,
    panel: this.panel,
    dismissible: this.dismissible,
  });

  readonly requestClose = this.dialog.requestClose;
  protected readonly onOverlayClick = this.dialog.onOverlayClick;
  protected readonly onTab = this.dialog.onTab;
}
