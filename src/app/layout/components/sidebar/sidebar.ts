import { Component, booleanAttribute, computed, input } from '@angular/core';
import { SidebarNavItem } from '../sidebar-nav-item/sidebar-nav-item';
import { NavSection } from './navigation.model';

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
 */
@Component({
  selector: 'app-sidebar',
  imports: [SidebarNavItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: {
    '[class.sidebar--open]': 'open()',
    '[class.sidebar--rail]': 'rail()',
  },
})
export class Sidebar {
  /** Todo el árbol de navegación, agrupado en secciones. */
  readonly sections = input.required<readonly NavSection[]>();

  /** Cajón abierto. Solo tiene efecto bajo el punto de quiebre de escritorio. */
  readonly open = input(false, { transform: booleanAttribute });

  /** Colapsado a un riel de icono. Solo tiene efecto en escritorio. */
  readonly rail = input(false, { transform: booleanAttribute });

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
    this.sections().flatMap((section) => section.items.map((item) => item.id)),
  );
}
