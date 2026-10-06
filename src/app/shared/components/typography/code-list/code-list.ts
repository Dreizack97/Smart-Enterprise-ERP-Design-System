import { Component, input } from '@angular/core';

/**
 * Códigos cortos de un solo uso en una cuadrícula, uno por casilla.
 *
 * Existe para los códigos de recuperación y similares: diez códigos en un
 * `code-block` se leen como un bloque de texto, y en casillas se pueden
 * contar, copiar uno solo con un clic (`user-select: all`) o tachar en papel
 * cuando se imprimen.
 *
 * Copiar, descargar o imprimir todos es una acción del contenedor, que sabe
 * qué hacer con ellos.
 */
@Component({
  selector: 'app-code-list',
  templateUrl: './code-list.html',
  styleUrl: './code-list.css',
})
export class CodeList {
  readonly codes = input.required<readonly string[]>();

  /** Nombre accesible de la lista. */
  readonly label = input('Códigos');
}
