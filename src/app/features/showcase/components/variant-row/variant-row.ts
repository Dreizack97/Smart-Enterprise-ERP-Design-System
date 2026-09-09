import { Component, input } from '@angular/core';

/**
 * Una fila de una matriz de variantes: el nombre a la izquierda, el ejemplo
 * a la derecha.
 *
 * `display: contents` en el host, para que el `<dt>` y el `<dd>` caigan
 * directamente en la cuadrícula `<dl>` que los envuelve. Sin esto, cada fila
 * sería su propia caja y las columnas dejarían de alinearse entre filas.
 */
@Component({
  selector: 'app-variant-row',
  templateUrl: './variant-row.html',
  styleUrl: './variant-row.css',
})
export class VariantRow {
  /** El nombre de la variante, exactamente como se escribe en la API. */
  readonly label = input.required<string>();

  /** Cuándo usarla, en pocas palabras. Vacío lo omite. */
  readonly note = input('');
}
