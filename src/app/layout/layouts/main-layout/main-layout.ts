import { Component, DOCUMENT, ElementRef, inject } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { LayoutStore } from '@core/layout/layout-store';
import { NotificationItem } from '@core/notifications/notification.model';
import { Notifications } from '@core/services/notification';
import { Navbar } from '@layout/components/navbar/navbar';
import { Sidebar } from '@layout/components/sidebar/sidebar';
import { NAV_SECTIONS } from './main-navigation.config';

/** Aire que queda entre la barra superior y el bloque al que salta una entrada del menú. */
const ANCHOR_GAP = 16;

/**
 * El marco del catálogo: barra superior, navegación lateral y el contenido
 * enrutado.
 *
 * Este es el único lugar que lee `LayoutStore`. La barra y el sidebar reciben
 * su estado como inputs e informan de vuelta a través de outputs, que es lo
 * que permite poner a cualquiera de los dos en una página en un estado
 * arbitrario sin que se filtre el estado propio de la aplicación.
 */
@Component({
  selector: 'app-main-layout',
  imports: [Navbar, RouterOutlet, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  host: {
    '[class.shell--rail]': 'layout.sidebarCollapsed()',
    '(window:resize)': 'onResize()',
  },
})
export class MainLayout {
  private readonly document = inject(DOCUMENT);
  private readonly notifications = inject(Notifications);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);

  constructor() {
    // Qué tan arriba de un ancla se detiene la página. El router hace scroll
    // del ancla hasta el borde mismo del viewport, que es donde está la
    // barra fija, así que sin esto los enlaces de sección del sidebar caen
    // sobre un encabezado que la barra tapa. Medido en vez de declarado: la
    // barra es más baja en un teléfono, y un número escrito aquí solo sería
    // correcto en un ancho de pantalla.
    inject(ViewportScroller).setOffset(() => [
      0,
      (this.host.nativeElement.querySelector('app-navbar')?.clientHeight ?? 0) + ANCHOR_GAP,
    ]);
  }

  protected readonly layout = inject(LayoutStore);
  protected readonly sections = NAV_SECTIONS;

  /**
   * El ancho se lee desde el `defaultView` inyectado, no desde el `window`
   * global: cualquier otro acceso al navegador en el proyecto pasa por
   * `DOCUMENT`, y asumir el global es lo que rompe el día que esto se
   * renderiza fuera de uno.
   *
   * Deliberadamente sin debounce. `syncWithViewport` termina en un
   * `set(false)` sobre un signal que casi siempre ya es `false`, y un signal
   * no notifica cuando el valor no cambió: arrastrar el borde de la ventana
   * no causa repintados, solo esta comparación.
   */
  protected onResize(): void {
    const width = this.document.defaultView?.innerWidth;
    if (width !== undefined) {
      this.layout.syncWithViewport(width);
    }
  }

  /** Todavía no existe índice de búsqueda; decirlo es mejor que tragarse las teclas. */
  protected onSearch(query: string): void {
    if (query.trim().length >= 3) {
      this.notifications.info('La búsqueda global llegará con el catálogo completo');
    }
  }

  /** La barra anuncia la intención; saber que el perfil vive en `/perfil` es de aquí. */
  protected onProfileOpened(section = 'datos'): void {
    void this.router.navigate(['/perfil'], { queryParams: { seccion: section } });
  }

  protected onSignOut(): void {
    this.notifications.info('Esta es una vitrina: no hay sesión que cerrar');
  }

  protected onNotificationOpened(item: NotificationItem): void {
    this.notifications.info(item.title);
  }
}
