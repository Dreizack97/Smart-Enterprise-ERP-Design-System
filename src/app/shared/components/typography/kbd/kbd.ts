import { Component, input } from '@angular/core';

/**
 * Un atajo de teclado, dibujado como las teclas sobre las que se presiona.
 *
 * Toma la combinación completa en vez de una sola tecla, y ese es el punto:
 * la parte repetida de «Ctrl + K» no es la tecla en sí, es el separador y el
 * espaciado entre teclas. Un componente que dibujara una sola tecla dejaría
 * que cada llamador escribiera el signo de más, y no coincidirían.
 */
@Component({
  selector: 'app-kbd',
  templateUrl: './kbd.html',
  styleUrl: './kbd.css',
})
export class Kbd {
  /** Las teclas de la combinación, en el orden en que se presionan. */
  readonly keys = input.required<readonly string[]>();

  /**
   * Qué va entre las teclas.
   *
   * Una combinación es «Ctrl + K»; una secuencia es «g luego i». Mismo
   * componente, palabra distinta, porque son instrucciones distintas.
   */
  readonly separator = input('+');
}
