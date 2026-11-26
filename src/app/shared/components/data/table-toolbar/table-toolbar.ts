import {
  Component,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { Button } from '@shared/components/actions/button/button';
import { SearchInput } from '@shared/components/forms/search-input/search-input';

/**
 * La fila sobre una tabla: lo que la acota, y lo que actúa sobre ella.
 *
 * La plantilla de Listado componía esto a mano con un campo de búsqueda, dos
 * selects y un botón «Limpiar», y dejaba una nota diciendo que este
 * componente lo absorbería. Lo hace — y lo que absorbe no son los controles
 * en sí, que difieren por pantalla y siguen proyectados, sino las tres
 * decisiones que se estaban tomando de nuevo en cada pantalla:
 *
 * 1. **Cuándo aparece «limpiar».** Un botón de limpiar permanente sobre una
 *    lista sin filtrar es una acción sin nada que hacer; uno que aparece
 *    solo cuando hay algo que limpiar también le dice a quien lee que lo
 *    hay.
 * 2. **Dónde vive la barra masiva.** Seleccionar filas convierte la misma
 *    franja en las acciones para la selección, en vez de empujar la tabla
 *    hacia abajo con una segunda barra que solo a veces existe.
 * 3. **Cómo se intercambian los dos estados.** Son alternativas, no vecinas:
 *    mientras una selección está viva, filtrarla no es lo que nadie está
 *    haciendo.
 *
 * Sus propios botones toman la altura de control por defecto y no la
 * compacta. Una barra de herramientas es una fila de controles uno junto al
 * otro, y toda la promesa de geometría del sistema — la que hace cumplir
 * `audit:geometry` — es que esos se alineen; un «Limpiar» de 32 px junto a
 * un campo de búsqueda de 40 px la rompe justo en el único lugar donde la
 * comparación es inevitable.
 */
@Component({
  selector: 'app-table-toolbar',
  imports: [Button],
  templateUrl: './table-toolbar.html',
  styleUrl: './table-toolbar.css',
  host: {
    role: 'search',
    '[attr.aria-label]': 'label() || null',
    '(document:keydown.control.b)': 'onSearchShortcut($event)',
    '(document:keydown.meta.b)': 'onSearchShortcut($event)',
  },
})
export class TableToolbar {
  /** Nombra la franja, p. ej. «Filtros de la cartera». */
  readonly label = input('');

  /**
   * Si algo está acotando la lista en este momento.
   *
   * El consumidor sabe esto — es dueño de los filtros — así que es un input
   * en vez de algo adivinado a partir de los controles proyectados, que el
   * componente no puede leer sin meterse en marcado que no es suyo.
   */
  readonly filtered = input(false, { transform: booleanAttribute });

  /** Cuántas filas están seleccionadas. Sobre cero, la franja se convierte en la barra masiva. */
  readonly selectedCount = input(0, { transform: numberAttribute });

  /** Pide al consumidor que quite todo filtro. */
  readonly cleared = output<void>();

  /** Pide al consumidor que quite la selección. */
  readonly selectionCleared = output<void>();

  protected readonly selecting = computed(() => this.selectedCount() > 0);

  /** «1 fila seleccionada» / «4 filas seleccionadas». */
  protected readonly selectionLabel = computed(() => {
    const count = this.selectedCount();
    return count === 1 ? '1 fila seleccionada' : `${count} filas seleccionadas`;
  });

  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = contentChild(SearchInput);

  constructor() {
    effect(() => {
      this.searchInput()?.setContainerShortcut(['Control', 'b']);
    });
  }

  protected onSearchShortcut(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }

    const search = this.searchInput();
    if (
      !search ||
      this.selecting() ||
      this.host.nativeElement.closest('[inert], [aria-hidden="true"]')
    ) {
      return;
    }

    const activeModal = this.document.querySelector(
      'dialog[open], .modal-overlay.is-open, .drawer-scrim.is-open',
    );
    if (activeModal && !activeModal.contains(this.host.nativeElement)) {
      return;
    }

    const active = this.document.activeElement;
    if (
      active &&
      active.closest('app-table-toolbar') &&
      !this.host.nativeElement.contains(active)
    ) {
      return;
    }

    if (!search.focus()) {
      return;
    }

    event.preventDefault();
  }
}
