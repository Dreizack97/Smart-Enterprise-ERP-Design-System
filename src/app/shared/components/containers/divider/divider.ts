import { Component, input } from '@angular/core';

/** Hacia dónde corre la línea. */
export type DividerOrientation = 'horizontal' | 'vertical';

/**
 * Una línea entre dos bloques de contenido, con una palabra opcional en
 * medio.
 *
 * La forma etiquetada es la razón de que esto sea un componente y no un
 * `<hr>`: «o continúa con» entre un botón de inicio de sesión y los botones
 * de proveedor se construía a mano con tres elementos y un par de
 * pseudo-elementos en la pantalla de Acceso, y esos mismos tres elementos se
 * habrían vuelto a construir en la siguiente pantalla que necesitara uno.
 *
 * La semántica cambia con la forma, porque tiene que hacerlo. Sin etiqueta es
 * un `<hr>` — el elemento que ya significa «quiebre temático». Con una no
 * puede serlo: un `<hr>` no puede contener texto, así que se convierte en un
 * `role="separator"` cuyo nombre accesible es la etiqueta.
 */
@Component({
  selector: 'app-divider',
  templateUrl: './divider.html',
  styleUrl: './divider.css',
  host: { '[class]': '"divider--" + orientation()' },
})
export class Divider {
  readonly orientation = input<DividerOrientation>('horizontal');

  /**
   * Una palabra en medio de la línea. Solo horizontal.
   *
   * Una línea vertical con texto tendría que rotarlo o apilarlo letra por
   * letra, y ambas opciones se leen mal a cualquier tamaño.
   */
  readonly label = input('');
}
