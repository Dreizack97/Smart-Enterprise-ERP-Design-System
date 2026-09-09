import {
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveRoute } from '@core/layout/active-route';
import { LayoutStore } from '@core/layout/layout-store';
import { Icon } from '@shared/components/media/icon/icon';
import { NavItem } from '../sidebar/navigation.model';

/**
 * Un nodo del árbol de navegación.
 *
 * Se renderiza a sí mismo de forma recursiva, así que tres niveles cuestan
 * una sola plantilla en vez de tres casi idénticas.
 *
 * Un grupo que contiene la ruta activa se expande solo y marca su trayecto:
 * al llegar por URL directa, el menú tiene que revelar dónde está la
 * persona.
 *
 * `rail` es un input y no una clase leída desde `<body>`. En el original toda
 * regla del riel era un selector `body.sidebar-collapsed .sidebar-*` que
 * alcanzaba a través del árbol de componentes; aquí la bandera se detiene en
 * la profundidad 0, que es también la única profundidad donde significa algo
 * — dentro del flyout, los niveles anidados ya son el menú de ancho completo
 * que deben ser, sin overrides que deshagan el riel.
 */
@Component({
  selector: 'app-sidebar-nav-item',
  imports: [Icon, RouterLink],
  templateUrl: './sidebar-nav-item.html',
  styleUrl: './sidebar-nav-item.css',
  host: {
    '[class.nav--rail]': 'rail()',
  },
})
export class SidebarNavItem {
  /** El nodo. Con `children` se pinta como grupo; sin ellos, como enlace. */
  readonly item = input.required<NavItem>();

  /** Los ids de los hermanos: expandir este nodo los colapsa. */
  readonly siblingIds = input<readonly string[]>([]);

  /** Nivel de anidamiento, contando desde cero. Gobierna sangría y tamaño de letra. */
  readonly depth = input(0, { transform: numberAttribute });

  /** Riel de solo icono. Nunca es verdadero salvo en la profundidad 0. */
  readonly rail = input(false, { transform: booleanAttribute });

  private readonly layout = inject(LayoutStore);
  private readonly activeRoute = inject(ActiveRoute);

  protected readonly isGroup = computed(() => (this.item().children?.length ?? 0) > 0);
  protected readonly children = computed(() => this.item().children ?? []);
  protected readonly childIds = computed(() => this.children().map((child) => child.id));
  protected readonly panelId = computed(() => `submenu-${this.item().id}`);
  protected readonly isRoot = computed(() => this.depth() === 0);
  protected readonly expanded = computed(() => this.layout.isSubmenuOpen(this.item().id));

  /** Este nodo es exactamente la ruta actual, y la sección que nombra. */
  protected readonly isActive = computed(() => {
    const node = this.item();
    return node.route ? this.activeRoute.matchesSection(node.route, node.fragment) : false;
  });

  /** Alguna ruta descendiente es la actual. */
  protected readonly inActiveTrail = computed(() =>
    routesOf(this.item()).some((route) => this.activeRoute.matches(route)),
  );

  constructor() {
    effect(() => {
      if (this.isGroup() && this.inActiveTrail()) {
        this.layout.openBranch([this.item().id]);
      }
    });
  }

  protected toggle(): void {
    this.layout.toggleSubmenu(this.item().id, this.siblingIds());
  }

  /** En móvil el cajón cubre el contenido: navegar lo cierra. */
  protected onNavigate(): void {
    this.layout.closeDrawer();
  }
}

function routesOf(item: NavItem): string[] {
  const own = item.route ? [item.route] : [];
  const nested = (item.children ?? []).flatMap(routesOf);
  return [...own, ...nested];
}
