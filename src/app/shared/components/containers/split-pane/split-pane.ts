import { Component, DestroyRef, DOCUMENT, inject, input, model, signal } from '@angular/core';

/** Orientación en que se distribuyen los paneles del contenedor dividido. */
export type SplitDirection = 'horizontal' | 'vertical';

const KEY_STEP = 16;

/**
 * Contenedor de dos o tres paneles separados por divisores arrastrables.
 *
 * Admite colapsar el primer o tercer panel mediante `showFirst` y
 * `showThird`, redimensionamiento con puntero o teclado (`ArrowLeft` /
 * `ArrowRight` / `ArrowUp` / `ArrowDown`) y cambio dinámico de dirección
 * (`horizontal` o `vertical`).
 */
@Component({
  selector: 'app-split-pane',
  templateUrl: './split-pane.html',
  styleUrl: './split-pane.css',
})
export class SplitPane {
  /** Ancho (o alto en vertical) del primer panel en píxeles. */
  readonly firstWidth = model(240);

  /** Ancho (o alto en vertical) del segundo panel en píxeles. */
  readonly secondWidth = model(360);

  readonly minFirst = input(180);
  readonly maxFirst = input(360);
  readonly minSecond = input(260);
  readonly maxSecond = input(560);

  readonly direction = input<SplitDirection>('horizontal');
  readonly showFirst = input(true);
  readonly showThird = input(true);

  protected readonly draggingHandle = signal<'first' | 'second' | null>(null);

  private readonly document = inject(DOCUMENT);
  private cleanupDrag: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cleanupDrag?.());
  }

  protected startDrag(handle: 'first' | 'second', event: PointerEvent): void {
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    event.preventDefault();
    this.cleanupDrag?.();
    this.draggingHandle.set(handle);

    const vertical = this.direction() === 'vertical';
    const startCoord = vertical ? event.clientY : event.clientX;
    const initialSize = handle === 'first' ? this.firstWidth() : this.secondWidth();
    const min = handle === 'first' ? this.minFirst() : this.minSecond();
    const max = handle === 'first' ? this.maxFirst() : this.maxSecond();

    const onMove = (moveEvent: PointerEvent) => {
      const coord = vertical ? moveEvent.clientY : moveEvent.clientX;
      const clamped = Math.min(max, Math.max(min, Math.round(initialSize + (coord - startCoord))));
      if (handle === 'first') {
        this.firstWidth.set(clamped);
      } else {
        this.secondWidth.set(clamped);
      }
    };

    const onUp = () => {
      this.draggingHandle.set(null);
      view.removeEventListener('pointermove', onMove);
      view.removeEventListener('pointerup', onUp);
      this.cleanupDrag = null;
    };

    view.addEventListener('pointermove', onMove);
    view.addEventListener('pointerup', onUp);
    this.cleanupDrag = onUp;
  }

  protected onHandleKeydown(handle: 'first' | 'second', event: KeyboardEvent): void {
    const decreaseKey = this.direction() === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const increaseKey = this.direction() === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    if (event.key !== decreaseKey && event.key !== increaseKey) {
      return;
    }

    event.preventDefault();
    const delta = event.key === increaseKey ? KEY_STEP : -KEY_STEP;
    const min = handle === 'first' ? this.minFirst() : this.minSecond();
    const max = handle === 'first' ? this.maxFirst() : this.maxSecond();
    const current = handle === 'first' ? this.firstWidth() : this.secondWidth();
    const next = Math.min(max, Math.max(min, current + delta));

    if (handle === 'first') {
      this.firstWidth.set(next);
    } else {
      this.secondWidth.set(next);
    }
  }
}
