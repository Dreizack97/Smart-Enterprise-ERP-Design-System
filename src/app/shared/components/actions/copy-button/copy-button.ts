import {
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Icon } from '@shared/components/media/icon/icon';
import { Tooltip } from '@shared/directives/tooltip';
import { copyText } from '@shared/utils/clipboard';

type CopyState = 'idle' | 'pending' | 'copied' | 'error';

/** Duración de la confirmación, igual que en el bloque de código compartido. */
const FEEDBACK_MS = 1600;

/** Copia texto y comunica el resultado real sin propagar el clic al contenedor. */
@Component({
  selector: 'app-copy-button',
  imports: [Icon, Tooltip],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.css',
  host: { '[attr.data-state]': 'state()', '[class.copy-button--reveal]': 'revealOnHover()' },
})
export class CopyButton {
  /** Contenido exacto que se escribe en el portapapeles. */
  readonly text = input.required<string>();

  /** Nombra el dato que puede copiarse, por ejemplo «Copiar correo». */
  readonly label = input('Copiar');

  /** Revela el botón al apuntar o enfocar su contenido; en dispositivos táctiles permanece visible. */
  readonly revealOnHover = input(false, { transform: booleanAttribute });

  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private revision = 0;

  protected readonly state = signal<CopyState>('idle');
  protected readonly inactive = computed(() => this.state() === 'pending' || !this.text().trim());
  protected readonly feedback = computed(() => {
    switch (this.state()) {
      case 'pending':
        return 'Copiando…';
      case 'copied':
        return 'Copiado al portapapeles';
      case 'error':
        return 'No se pudo copiar. Intenta de nuevo.';
      default:
        return '';
    }
  });

  constructor() {
    effect(() => {
      this.text();
      untracked(() => {
        this.revision++;
        this.clearTimer();
        this.state.set('idle');
      });
    });
    this.destroyRef.onDestroy(() => {
      this.revision++;
      this.clearTimer();
    });
  }

  /** Espera la escritura y descarta respuestas de un valor anterior o de un control destruido. */
  protected async copy(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (this.inactive()) return;
    const text = this.text();
    const revision = ++this.revision;
    this.clearTimer();
    this.state.set('pending');

    const copied = await copyText(text);
    if (this.destroyRef.destroyed || revision !== this.revision || text !== this.text()) return;

    this.state.set(copied ? 'copied' : 'error');
    this.timer = setTimeout(() => {
      this.state.set('idle');
      this.timer = null;
    }, FEEDBACK_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
