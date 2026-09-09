import { Component } from '@angular/core';

/**
 * Una matriz de variantes: cada fila nombra una y la muestra renderizada.
 *
 * Es un `<dl>` porque eso es lo que el contenido es — una lista de
 * términos y cómo se ve cada uno. Un lector de pantalla entonces lee
 * «primary: botón Guardar» en vez de dos celdas sin relación, y el
 * catálogo deja de ser la fotografía de una tabla.
 *
 * Las filas son `app-variant-row`, cuyo host es `display: contents` para
 * que su `<dt>` y su `<dd>` sean hijos reales de esta cuadrícula y
 * compartan sus columnas. Envolver cada fila en su propia caja es lo que
 * desalinea una matriz.
 */
@Component({
  selector: 'app-variant-grid',
  template: '<dl class="grid"><ng-content /></dl>',
  styleUrl: './variant-grid.css',
})
export class VariantGrid {}
