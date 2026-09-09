import { Component, input } from '@angular/core';
import { PageHeader } from '@layout/components/page-header/page-header';

/**
 * El marco que comparte cada página del catálogo: el encabezado de página
 * más los márgenes y el ritmo vertical sobre el que se sientan los bloques.
 *
 * Existe para que una página de familia sea una lista de
 * `app-showcase-block` y nada más. Que cada página repita su propio padding
 * es cómo un catálogo termina con diez márgenes ligeramente distintos.
 *
 * No reenvía el slot `[actions]` de `page-header`. Ninguna página del
 * catálogo lo ha necesitado todavía, y un slot que solo existe para
 * pasarse de largo es una apuesta sobre un requisito y no una respuesta a
 * uno.
 */
@Component({
  selector: 'app-showcase-page',
  imports: [PageHeader],
  templateUrl: './showcase-page.html',
  styleUrl: './showcase-page.css',
})
export class ShowcasePage {
  readonly title = input.required<string>();

  readonly subtitle = input('');
}
