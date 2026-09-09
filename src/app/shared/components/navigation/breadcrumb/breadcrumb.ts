import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '@shared/components/media/icon/icon';

/** Un peldaño del trayecto. Sin `route` se renderiza como texto, no como enlace. */
export interface BreadcrumbItem {
  readonly label: string;
  readonly route?: string;
}

/**
 * El trayecto hasta la pantalla actual.
 *
 * El último peldaño nunca es un enlace y lleva `aria-current="page"`:
 * enlazar a la página en la que ya se está desorienta a quien navega con
 * teclado o lector de pantalla.
 */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, Icon],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  /** El trayecto completo, desde la raíz hasta la página actual inclusive. */
  readonly items = input.required<readonly BreadcrumbItem[]>();

  /**
   * Nombre accesible del `<nav>`. Solo hace falta cambiarlo cuando una
   * pantalla pinta dos trayectos: dos landmarks con el mismo nombre se
   * anulan entre sí.
   */
  readonly label = input('Ruta de navegación');
}
