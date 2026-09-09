import { Component, ElementRef, computed, input, model, output, viewChild } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';
import { useDialog } from '@shared/utils/dialog-behavior';
import { nextElementId } from '@shared/utils/element-id';
import { Button } from '@shared/components/actions/button/button';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Confirmación de una acción irreversible.
 *
 * Separado de `Modal` porque su composición es fija — glifo de alerta,
 * mensaje centrado, dos acciones — y esa rigidez es el punto: un diálogo de
 * eliminar tiene que leerse igual en toda la aplicación.
 *
 * El foco cae en Cancelar, no en Confirmar: si alguien presiona Enter por
 * costumbre, la acción que ocurre es la segura.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button, Icon],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  host: { '(keydown.escape)': 'cancel()' },
})
export class ConfirmDialog {
  /**
   * Si el diálogo se está mostrando.
   *
   * Un `model()` porque el diálogo se cierra solo al confirmar, al cancelar
   * y con `Escape`.
   */
  readonly open = model(false);

  /** Título del diálogo. También su nombre accesible. */
  readonly title = input.required<string>();

  /** La consecuencia de la acción, escrita para quien tiene que decidir. */
  readonly message = input.required<string>();

  /** Texto de la acción que se confirma. */
  readonly confirmLabel = input('Eliminar');

  /** Texto de la acción segura, que es la que recibe el foco. */
  readonly cancelLabel = input('Cancelar');

  readonly icon = input<IconName>('triangle-alert');

  /**
   * Severidad de la acción. `danger` es el valor por defecto porque para eso
   * existe este diálogo; `warning` encaja en una acción reversible pero
   * ruidosa, como enviarle algo a todos.
   */
  readonly tone = input<StatusTone>('danger');

  /** Emitido al aceptar. El diálogo ya se cerró para cuando esto llega. */
  readonly confirmed = output<void>();

  /** Emitido al cancelar, ya sea por botón, `Escape` o el fondo. */
  readonly cancelled = output<void>();

  // `read: ElementRef` es obligatorio: una referencia de plantilla sobre un
  // componente da su instancia, no el elemento del DOM.
  private readonly cancelAction = viewChild('cancelAction', { read: ElementRef });
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = nextElementId('confirm-title');
  protected readonly messageId = nextElementId('confirm-message');
  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);

  /** Una confirmación `warning` no debe ofrecer un botón rojo. */
  protected readonly confirmVariant = computed(() =>
    this.tone() === 'danger' ? ('danger' as const) : ('primary' as const),
  );

  /**
   * El bloqueo, el foco y la trampa vienen de `useDialog`; lo que se queda
   * aquí es qué *significa* cerrar este diálogo, que es una pregunta
   * distinta para una confirmación que para cualquier otra superficie —
   * tiene que decir si la respuesta fue sí o no.
   *
   * `dismissible` es una constante `true` y no un input: una confirmación
   * que no se puede descartar es una trampa, y Escape o el fondo
   * simplemente significan «no», que es la respuesta segura sobre la que
   * este diálogo está construido.
   */
  private readonly dialog = useDialog({
    open: this.open,
    panel: this.panel,
    dismissible: computed(() => true),
    initialFocus: () =>
      (this.cancelAction()?.nativeElement as HTMLElement | undefined)?.querySelector('button'),
  });

  protected readonly onTab = this.dialog.onTab;

  protected confirm(): void {
    this.open.set(false);
    this.confirmed.emit();
  }

  protected cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }
}
