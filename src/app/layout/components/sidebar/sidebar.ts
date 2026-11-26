import {
  Component,
  DOCUMENT,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Icon } from '@shared/components/media/icon/icon';
import { SidebarNavItem } from '../sidebar-nav-item/sidebar-nav-item';
import { NavSection, subtreeIdsOf } from './navigation.model';
import { filterNavigation } from './navigation-filter';

/**
 * El sidebar de navegación.
 *
 * Por debajo de 1024 px es un cajón deslizante; por encima, un panel fijo
 * que puede reducirse a un riel de solo icono. En modo riel los submenús
 * dejan de ser un acordeón y se convierten en flyouts laterales, abiertos
 * con `:hover` y `:focus-within` para que el teclado los alcance sin
 * JavaScript.
 *
 * `open` y `rail` llegan como inputs en vez de leerse aquí desde
 * `LayoutStore`. El layout ya guarda ese estado, y un componente
 * presentacional que lee un store es uno que no se puede mostrar en el
 * catálogo en ningún estado que no sea el actual de la aplicación.
 *
 * La búsqueda filtra el árbol y resalta las coincidencias. Es estado local:
 * nadie fuera del sidebar necesita saber qué se está buscando. En modo riel
 * no hay espacio para el campo, así que se muestra un botón que pide al
 * layout expandir el panel y después enfoca el campo.
 */
@Component({
  selector: 'app-sidebar',
  imports: [Icon, SearchInput, SidebarNavItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.sidebar--open]': 'open()',
    '[class.sidebar--rail]': 'rail()',
    '(document:keydown.control.k)': 'onShortcut($event)',
    '(document:keydown.meta.k)': 'onShortcut($event)',
  },
})
export class Sidebar {
  /** Todo el árbol de navegación, agrupado en secciones. */
  readonly sections = input.required<readonly NavSection[]>();

  /** Cajón abierto. Solo tiene efecto bajo el punto de quiebre de escritorio. */
  readonly open = input(false, { transform: booleanAttribute });

  /** Colapsado a un riel de icono. Solo tiene efecto en escritorio. */
  readonly rail = input(false, { transform: booleanAttribute });

  /** Se pidió buscar desde el riel: el layout debe expandir el panel. */
  readonly searchRequested = output<void>();

  protected readonly query = signal('');

  protected readonly visibleSections = computed(() => {
    const query = this.query().trim();
    return query ? filterNavigation(this.sections(), query) : this.sections();
  });

  private readonly document = inject(DOCUMENT);
  private readonly searchField = viewChild.required<SearchInput>('searchField');

  /** El campo se enfoca cuando el riel ya se expandió y el campo es visible. */
  private readonly focusPending = signal(false);

  constructor() {
    afterRenderEffect(() => {
      if (this.focusPending() && !this.rail()) {
        this.searchField().focus();
        this.focusPending.set(false);
      }
    });
  }

  protected requestSearch(): void {
    this.focusPending.set(true);
    this.searchRequested.emit();
  }

  protected clearSearch(): void {
    this.query.set('');
  }

  protected onShortcut(event: Event): void {
    if (event.defaultPrevented) {
      return;
    }

    if (
      this.document.querySelector('dialog[open], .modal-overlay.is-open, .drawer-scrim.is-open')
    ) {
      return;
    }

    if (this.rail()) {
      this.requestSearch();
      event.preventDefault();
    } else if (this.searchField().focus()) {
      event.preventDefault();
    }
  }

  /**
   * Los ids de todo grupo de primer nivel, de **todas** las secciones.
   *
   * Es lo que hace que abrir un menú cierre a los demás: un nodo recibe esta
   * lista como sus hermanos, y abrirse cierra a cada uno de ellos. Antes la
   * lista era la de su propia sección, así que «Fundamentos» y «Formularios»
   * podían quedar abiertos a la vez y el menú crecía hasta necesitar scroll
   * para ver lo que ya estaba abierto.
   *
   * Un `computed`, no un método: la plantilla lo lee una vez por nodo y el
   * árbol no cambia entre renders.
   */
  protected readonly topLevelIds = computed(() =>
    subtreeIdsOf(this.visibleSections().flatMap((section) => section.items)),
  );
}
