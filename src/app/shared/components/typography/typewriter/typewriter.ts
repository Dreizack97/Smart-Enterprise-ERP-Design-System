import { Component, computed, input } from '@angular/core';

const SESSION_KEY = 'erp_welcome_animated';

/** Presenta texto con una animación opcional que, en modo automático, se muestra una vez por sesión. */
@Component({
  selector: 'app-typewriter',
  templateUrl: './typewriter.html',
  styleUrl: './typewriter.css',
})
export class Typewriter {
  /** Texto completo que se presenta desde el primer renderizado. */
  readonly text = input.required<string>();

  /** Fuerza la animación o el modo estático; sin valor explícito, anima una vez por sesión. */
  readonly animate = input<boolean | undefined>(undefined);

  private checkSessionAnimation(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const alreadyAnimated = sessionStorage.getItem(SESSION_KEY);
      if (!alreadyAnimated) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        return true;
      }
      return false;
    } catch {
      // Si el navegador bloquea sessionStorage (modo incógnito / SecurityError),
      // no rompemos el componente y optamos por mostrarlo sin consumir token.
      return false;
    }
  }

  protected readonly isAnimated = computed(() => {
    const explicit = this.animate();
    // Solo evalúa sessionStorage si animate es undefined (modo automático).
    return explicit !== undefined ? explicit : this.checkSessionAnimation();
  });
}
