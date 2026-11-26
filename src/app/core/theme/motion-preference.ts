import { DOCUMENT, DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { ThemeStore } from './theme-store';

/** Combina las preferencias de movimiento de la aplicación y del sistema operativo. */
@Service()
export class MotionPreference {
  private readonly theme = inject(ThemeStore);
  private readonly media = inject(DOCUMENT).defaultView?.matchMedia?.(
    '(prefers-reduced-motion: reduce)',
  );
  private readonly systemReduced = signal(this.media?.matches ?? false);

  /** Indica si las animaciones por script deben mostrar directamente su resultado final. */
  readonly reduced = computed(() => this.theme.reducedMotion() || this.systemReduced());

  constructor() {
    const update = (event: MediaQueryListEvent): void => this.systemReduced.set(event.matches);
    this.media?.addEventListener?.('change', update);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener?.('change', update));
  }
}
