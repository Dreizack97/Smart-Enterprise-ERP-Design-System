import { Component, input } from '@angular/core';

/** Cómo se distribuyen las demos dentro de un bloque. */
export type ShowcaseLayout = 'row' | 'stack' | 'grid';

/** La superficie sobre la que se muestran las demos. */
export type ShowcaseSurface = 'canvas' | 'card';

/**
 * Un bloque del catálogo: un componente, para qué sirve, y sus variantes.
 *
 * Durante un tiempo cargó un interruptor de tema por bloque, que ya no
 * existe. La comparación que ofrecía — un bloque invertido contra el resto
 * de la página — está disponible de forma más simple al voltear el
 * catálogo entero desde la barra superior, y toda página está construida
 * para leerse en ambos temas de todos modos. Lo que el interruptor sí
 * agregaba era una segunda fuente de verdad para "¿cuál es el tema aquí?",
 * y de ahí salieron tres defectos distintos.
 */
@Component({
  selector: 'app-showcase-block',
  templateUrl: './showcase-block.html',
  styleUrl: './showcase-block.css',
})
export class ShowcaseBlock {
  /** Nombre del componente o patrón en exhibición. */
  readonly title = input.required<string>();

  /** Cuándo recurrir a él. Vacío lo omite. */
  readonly description = input('');

  /**
   * Ancla a la que salta el sidebar. Vacío deja al bloque sin `id`.
   *
   * Solo lo lleva el bloque que abre un grupo del menú: un ancla es una
   * promesa de que algo la enlaza, y `scripts/audit-navigation.mjs` verifica
   * las dos mitades de esa promesa.
   */
  readonly anchor = input('');

  /**
   * Cómo el área de la demo distribuye a sus hijos.
   *
   * - `row` los envuelve uno al lado del otro: controles, insignias, avatares
   * - `stack` pone uno debajo del otro: campos, alertas, filas de lista
   * - `grid` dispone tarjetas en una pista responsiva
   */
  readonly layout = input<ShowcaseLayout>('row');

  /**
   * Sobre qué superficie se sientan las demos, porque no todos los
   * componentes viven en el mismo lugar.
   *
   * Una tarjeta, una tabla o una ficha de medio se colocan SOBRE el
   * lienzo; un campo, un botón o un checkbox viven DENTRO de una tarjeta.
   * Pintar todo sobre el lienzo estaba mal de una forma que solo se notaba
   * en la página de formularios: `--surface-field` en modo oscuro es
   * exactamente el mismo color que `--surface-canvas`, así que cada input
   * era una superficie hundida sobre un fondo de su propio color y se leía
   * como un contorno desnudo. Mostrar un componente sobre una superficie
   * que nunca ocupa no es una elección neutral.
   */
  readonly surface = input<ShowcaseSurface>('canvas');
}
