import { DOCUMENT, Service, inject, signal } from '@angular/core';

/** La clase que detiene el scroll del documento, definida en `styles/shell.css`. */
const LOCK_CLASS = 'modal-open';

/**
 * Bloqueo de scroll del documento, contado por referencia.
 *
 * Antes, cada overlay alternaba `body.modal-open` por su cuenta. Con dos
 * abiertos a la vez —un diálogo de confirmación levantado desde dentro de un
 * modal, que es el caso común— el primero en cerrarse liberaba el bloqueo
 * mientras el otro seguía abierto, y la página hacía scroll detrás de él.
 *
 * Contar significa que el bloqueo se levanta solo cuando el último tenedor lo
 * suelta. Los `release` son idempotentes, así que un componente que
 * desbloquea dos veces no puede llevar el contador a negativo y dejar la
 * página congelada para siempre.
 *
 * El desplazamiento horizontal que el bloqueo solía causar se maneja en otro
 * lugar: `base.css` reserva el canal de la barra de scroll de forma
 * permanente.
 */
@Service()
export class ScrollLock {
  private readonly document = inject(DOCUMENT);
  private readonly holders = signal(0);

  /**
   * Cuántos overlays sostienen el bloqueo en este momento.
   *
   * Es un signal y no un simple getter: una plantilla que lee un getter no
   * está suscrita a nada, así que el número que muestra es el que haya dejado
   * la última pasada de detección de cambios ajena a este estado.
   */
  readonly count = this.holders.asReadonly();

  lock(): void {
    const next = this.holders() + 1;
    this.holders.set(next);
    if (next === 1) {
      this.document.body.classList.add(LOCK_CLASS);
    }
  }

  release(): void {
    if (this.holders() === 0) {
      return;
    }
    const next = this.holders() - 1;
    this.holders.set(next);
    if (next === 0) {
      this.document.body.classList.remove(LOCK_CLASS);
    }
  }
}
