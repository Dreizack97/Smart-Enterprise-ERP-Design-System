import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ComponentDensity } from '@shared/models/density.model';
import { useDialog } from '@shared/utils/dialog-behavior';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';
import { ConfirmDialog } from '@shared/components/overlays/confirm-dialog/confirm-dialog';

/** Ancho máximo del panel del diálogo. */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/** Diálogo con cierre accesible y una confirmación común para descartar cambios. */
@Component({
  selector: 'app-modal',
  imports: [Icon, ConfirmDialog],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly size = input<ModalSize>('lg');
  readonly density = input<ComponentDensity>('normal');

  /** Si el contenido tiene cambios sin guardar: al intentar cerrar pide confirmación automáticamente. */
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly discardTitle = input('¿Descartar cambios sin guardar?');
  readonly discardMessage = input(
    'Hay datos capturados o modificados. Si sales ahora se perderán los cambios.',
  );
  readonly discardConfirmLabel = input('Descartar');
  readonly discardCancelLabel = input('Seguir editando');

  /** Un diálogo destructivo o en medio de guardado no debe cerrarse por accidente. */
  readonly dismissible = input(true);

  /** Se emite cuando el usuario intenta cerrar mientras `dismissible` es `false`. */
  readonly dismissBlocked = output<void>();

  /** Se emite cuando el usuario confirma descartar los cambios de un modal con `dirty`. */
  readonly discarded = output<void>();

  protected readonly confirmDiscardOpen = signal(false);
  private discardAction: (() => void) | null = null;

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = nextElementId('modal-title');

  private readonly canDismissImmediately = computed(() => this.dismissible() && !this.dirty());

  private readonly dialog = useDialog({
    open: this.open,
    panel: this.panel,
    dismissible: this.canDismissImmediately,
    onDismissBlocked: () => {
      this.requestDiscard(() => this.open.set(false));
    },
  });

  constructor() {
    effect(() => {
      if (!this.open()) {
        untracked(() => this.onCancelDiscard());
      }
    });
  }

  readonly requestClose = this.dialog.requestClose;
  protected readonly onOverlayClick = this.dialog.onOverlayClick;
  protected readonly onTab = this.dialog.onTab;

  /**
   * Confirma antes de ejecutar una salida interna, por ejemplo volver de un formulario al listado.
   * Comparte la validación de cambios y de guardado con el cierre completo del modal.
   */
  requestDiscard(action: () => void): void {
    if (!this.open()) return;
    if (!this.dismissible()) {
      this.dismissBlocked.emit();
      return;
    }
    if (this.dirty()) {
      this.discardAction = action;
      this.confirmDiscardOpen.set(true);
    } else {
      action();
    }
  }

  protected onConfirmDiscard(): void {
    const action = this.discardAction;
    this.onCancelDiscard();
    if (!this.open() || !action) return;
    // Un guardado iniciado mientras se mostraba la confirmación también impide descartar.
    if (!this.dismissible()) {
      this.dismissBlocked.emit();
      return;
    }
    action();
    this.discarded.emit();
  }

  protected onCancelDiscard(): void {
    this.confirmDiscardOpen.set(false);
    this.discardAction = null;
  }
}
