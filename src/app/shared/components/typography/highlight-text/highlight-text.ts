import { Component, computed, input } from '@angular/core';
import { segmentMatchedText } from '@shared/utils/text-highlight';

/**
 * Un texto con las coincidencias de una búsqueda marcadas con `<mark>`.
 *
 * La coincidencia ignora mayúsculas y acentos, pero lo que se pinta es
 * siempre el texto original.
 */
@Component({
  selector: 'app-highlight-text',
  templateUrl: './highlight-text.html',
  styleUrl: './highlight-text.css',
})
export class HighlightText {
  readonly text = input.required<string>();

  /** Lo que se busca. Vacío pinta el texto sin marcas. */
  readonly query = input('');

  protected readonly segments = computed(() => segmentMatchedText(this.text(), this.query()));
}
