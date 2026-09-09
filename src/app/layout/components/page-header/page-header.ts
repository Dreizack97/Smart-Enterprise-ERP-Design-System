import { Component, input } from '@angular/core';

/**
 * Encabezado de página: breadcrumb, título, subtítulo y las acciones
 * principales de la página.
 *
 * El breadcrumb es un slot y no un input para que cada pantalla decida si lo
 * necesita: en una pantalla de nivel superior, un trayecto de un solo paso es
 * puro ruido.
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  /** El título de la página. Es el único `h1` del documento. */
  readonly title = input.required<string>();

  /** Descriptor bajo el título. Vacío lo omite. */
  readonly subtitle = input('');
}
