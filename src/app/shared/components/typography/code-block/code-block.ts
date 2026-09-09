import {
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { copyText } from '@shared/utils/clipboard';
import { Button } from '@shared/components/actions/button/button';

/** Cuánto dura visible la confirmación de copiado. */
const FEEDBACK_MS = 1600;

/**
 * Un bloque de código, con la única acción que alguien realiza sobre uno.
 *
 * **Sin resaltado de sintaxis, deliberadamente.** Resaltar significa un
 * tokenizador por lenguaje y una segunda paleta que mantener en sincronía con
 * la capa de tokens — una dependencia y un sistema de color, para un
 * catálogo que muestra fragmentos de marcado. La tipografía monoespaciada y
 * el marco ya dicen «esto es código»; lo que de verdad faltaba era el botón
 * de copiar.
 *
 * El código llega como string y no como contenido proyectado. Un marcado
 * proyectado se interpretaría como marcado: un `<app-button>` dentro del
 * bloque renderizaría un botón en vez de mostrar la etiqueta que alguien
 * vino a leer.
 */
@Component({
  selector: 'app-code-block',
  imports: [Button],
  templateUrl: './code-block.html',
  styleUrl: './code-block.css',
})
export class CodeBlock {
  /** El código en sí, exactamente como debe leerse y copiarse. */
  readonly code = input.required<string>();

  /** Se muestra como etiqueta en el marco. Puramente informativo: nada lo parsea. */
  readonly language = input('');

  /** Quita el botón de copiar, para un bloque que nadie debe reutilizar. */
  readonly copyable = input(true, { transform: booleanAttribute });

  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly copied = signal<boolean | null>(null);

  /** Dice qué pasó, y dice los dos resultados de forma distinta. */
  protected readonly feedback = computed(() => {
    const state = this.copied();
    if (state === null) {
      return '';
    }
    return state ? 'Copiado' : 'No se pudo copiar';
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  protected async copy(): Promise<void> {
    this.copied.set(await copyText(this.code()));

    this.clearTimer();
    this.timer = setTimeout(() => this.copied.set(null), FEEDBACK_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
