import { Component, booleanAttribute, input, model } from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * `chip`: compacto, sobre un relleno sólido, sin borde. El de la barra
 * superior.
 * `field`: un campo completo con borde e icono interno. El de los filtros de
 * listas.
 */
export type SearchVariant = 'chip' | 'field';

/**
 * Caja de búsqueda.
 *
 * Dos presentaciones de una sola idea. Dividirlas en dos componentes
 * duplicaría el comportamiento, que es idéntico.
 *
 * La etiqueta existe pero está oculta: el icono es una pista visual, no un
 * nombre accesible.
 *
 * El ancho no es un input. El host es un bloque, así que el consumidor lo
 * dimensiona desde afuera; el original tomaba un string `inputClass` de
 * clases de Tailwind, que dejaba a cualquier llamador meterse a
 * reestilizar el control.
 */
@Component({
  selector: 'app-search-input',
  imports: [Icon],
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
})
export class SearchInput {
  /** El texto de búsqueda. Un `model()`: el propio control lo limpia desde su botón. */
  readonly value = model('');

  readonly variant = input<SearchVariant>('chip');
  readonly placeholder = input('Buscar...');

  /** Nombre accesible del campo, no mostrado en ninguna variante. */
  readonly label = input('Buscar');

  /** Muestra un spinner en el lugar del botón de limpiar mientras hay resultados pendientes. */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input(nextElementId('search'));

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }

  protected clear(): void {
    this.value.set('');
  }
}
