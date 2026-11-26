import {
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';
import { Kbd } from '@shared/components/typography/kbd/kbd';

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
  imports: [Icon, Kbd],
  templateUrl: './search-input.html',
  styleUrl: './search-input.css',
})
export class SearchInput {
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  /** El texto de búsqueda. Un `model()`: el propio control lo limpia desde su botón. */
  readonly value = model('');

  readonly variant = input<SearchVariant>('field');
  readonly placeholder = input('Buscar...');

  /** Nombre accesible del campo, no mostrado en ninguna variante. */
  readonly label = input('Buscar');

  /** Muestra un spinner en el lugar del botón de limpiar mientras hay resultados pendientes. */
  readonly loading = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input(nextElementId('search'));

  /** Muestra la combinación implementada por el consumidor, por ejemplo `['Ctrl', 'K']`. */
  readonly shortcut = input<readonly string[]>([]);

  /** Conserva la ayuda de teclado alternativa que proporciona el contenedor. */
  private readonly containerShortcut = signal<readonly string[]>([]);

  protected readonly effectiveShortcut = computed(() =>
    this.shortcut().length ? this.shortcut() : this.containerShortcut(),
  );

  /** Permite a un contenedor como `TableToolbar` definir el atajo por defecto. */
  setContainerShortcut(keys: readonly string[]): void {
    this.containerShortcut.set(keys);
  }

  /** Enfoca y selecciona el texto; devuelve `false` si el campo no puede recibir el foco. */
  focus(): boolean {
    const el = this.inputEl()?.nativeElement;
    if (!el || this.disabled()) {
      return false;
    }
    el.focus();
    if (el.ownerDocument.activeElement !== el) {
      return false;
    }
    el.select();
    return true;
  }

  protected onInput(event: Event): void {
    const control = event.target as HTMLInputElement;
    if (this.disabled()) {
      control.value = this.value();
      return;
    }
    this.value.set(control.value);
  }

  /** Limpia antes de ceder Escape al contenedor cuando la búsqueda ya está vacía. */
  protected onEscape(event: Event): void {
    if (this.disabled()) {
      return;
    }
    if (this.value()) {
      event.preventDefault();
      event.stopPropagation();
      this.clear();
    } else {
      this.inputEl()?.nativeElement.blur();
    }
  }

  protected clear(): void {
    if (!this.disabled()) {
      this.value.set('');
    }
  }
}
