import { Component, booleanAttribute, input } from '@angular/core';

/**
 * La anatomía de un campo de formulario: etiqueta, control, pista, error.
 *
 * Todo control tipo texto repetía este marcado palabra por palabra, y ya
 * habían divergido: `app-input` dibujaba el asterisco de obligatorio,
 * `app-textarea` y `app-select` no, así que el mismo esquema producía dos
 * rótulos distintos según qué control lo renderizara. Poseer la anatomía una
 * sola vez elimina esa clase de divergencia en vez de arreglar cada
 * instancia.
 *
 * Puramente presentacional: recibe los ids y el mensaje ya resuelto, y
 * proyecta el control nativo. Nunca sabe qué tipo de control es ese.
 */
@Component({
  selector: 'app-field',
  templateUrl: './field.html',
  styleUrl: './field.css',
})
export class Field {
  /** Etiqueta visible, ligada al control a través de `for`. Vacío la omite. */
  readonly label = input('');

  /** Id del control proyectado, para el atributo `for`. */
  readonly controlId = input('');

  /** Marca el campo como obligatorio y dibuja el asterisco. */
  readonly required = input(false, { transform: booleanAttribute });

  /** Texto de apoyo bajo el control. Se oculta mientras se muestra un error. */
  readonly hint = input('');

  /** Texto de error ya resuelto. Vacío significa válido. */
  readonly error = input('');

  /** Id del elemento de error, referenciado por el `aria-describedby` del control. */
  readonly errorId = input('');

  /**
   * Oculta la etiqueta visualmente sin quitársela a los lectores de
   * pantalla.
   *
   * Para campos cuyo significado ya está escrito al lado; sin esto, la
   * opción sería repetir el texto en pantalla o dejar el control sin nombre
   * accesible.
   */
  readonly labelHidden = input(false, { transform: booleanAttribute });

  /**
   * Renderiza la etiqueta como un `<span>` simple con `id` en vez de un
   * `<label>`.
   *
   * Un `<label for>` solo puede apuntar a un control de formulario. Un grupo
   * de radio es un `role="radiogroup"`, no un control, así que se nombra a
   * sí mismo con `aria-labelledby` y necesita que el elemento sea
   * direccionable, no clicable.
   */
  readonly labelAsText = input(false, { transform: booleanAttribute });
}
