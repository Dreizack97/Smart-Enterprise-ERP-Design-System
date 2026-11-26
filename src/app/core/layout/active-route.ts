import { Service, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/**
 * La URL actual, como signal.
 *
 * El sidebar necesita saber si una rama contiene la ruta activa, para
 * expandirla y marcar el trayecto. `Router.url` es una propiedad, no un
 * signal, así que aquí se convierte en uno.
 */
@Service()
export class ActiveRoute {
  private readonly router = inject(Router);

  readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** La `#sección` de la URL actual, sin el gato. Vacío cuando no hay ninguna. */
  readonly fragment = computed(() => this.url().split('#')[1] ?? '');

  /** Coincidencia por prefijo: `/clients/42` cae dentro de `/clients`. */
  matches(route: string): boolean {
    return this.path() === route || this.path().startsWith(`${route}/`);
  }

  /**
   * Reconoce una ruta o sus descendientes y, cuando la entrada nombra una,
   * exige que coincida su sección.
   *
   * Sin la segunda mitad, todas las entradas de una página se encenderían a
   * la vez: el menú apunta seis grupos a `/formularios`, y solo se
   * diferencian por el ancla.
   */
  matchesSection(route: string, fragment?: string): boolean {
    if (!this.matches(route)) {
      return false;
    }
    return fragment ? this.fragment() === fragment : true;
  }

  /** La URL sin el query ni el ancla. */
  private path(): string {
    return this.url().split('?')[0].split('#')[0];
  }
}
