import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveRoute } from '@core/layout/active-route';
import { LayoutStore } from '@core/layout/layout-store';
import { Icon } from '@shared/components/media/icon/icon';
import { HighlightText } from '@shared/components/typography/highlight-text/highlight-text';
import { placeAnchored, watchAnchor } from '@shared/utils/anchored-position';
import { NavItem, subtreeIdsOf } from '../sidebar/navigation.model';

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
  imports: [HighlightText, Icon, RouterLink],
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

  /** Búsqueda en curso en el sidebar: sus coincidencias se resaltan en la etiqueta. */
  readonly query = input('');

  /** Emitido al hacer clic en un enlace de navegación para limpiar búsquedas activas. */
  readonly navigated = output<void>();

  private readonly layout = inject(LayoutStore);
  private readonly activeRoute = inject(ActiveRoute);
  private readonly view = inject(DOCUMENT).defaultView;

  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly submenu = viewChild<ElementRef<HTMLElement>>('submenu');
  private stopFlyoutTracking: (() => void) | null = null;

  protected readonly isGroup = computed(() => (this.item().children?.length ?? 0) > 0);
  protected readonly children = computed(() => this.item().children ?? []);
  protected readonly childIds = computed(() => subtreeIdsOf(this.children()));
  protected readonly ownSubtreeIds = computed(() => [this.item().id, ...this.childIds()]);
  protected readonly panelId = computed(() => `submenu-${this.item().id}`);
  protected readonly isRoot = computed(() => this.depth() === 0);
  /**
   * Mientras se busca, todo grupo que sobrevivió al filtro se muestra abierto: contiene una
   * coincidencia. Se deriva aquí en vez de abrirlo en `LayoutStore`, para que buscar no altere los
   * submenús que el usuario dejó abiertos.
   */
  protected readonly expanded = computed(
    () => this.query().trim() !== '' || this.layout.isSubmenuOpen(this.item().id),
  );

  /** El flyout del riel solo existe en el primer nivel de un grupo. */
  private readonly hasFlyout = computed(() => this.rail() && this.isRoot() && this.isGroup());

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
        this.layout.openBranch([this.item().id], this.siblingIds(), this.ownSubtreeIds());
      } else if (!this.isGroup() && this.isActive()) {
        this.layout.openBranch([], this.siblingIds());
      }
    });

    inject(DestroyRef).onDestroy(() => this.closeFlyout());
  }

  protected toggle(): void {
    this.layout.toggleSubmenu(this.item().id, this.siblingIds(), this.ownSubtreeIds());
  }

  /** En móvil el cajón cubre el contenido: navegar lo cierra. */
  protected onNavigate(): void {
    this.layout.closeDrawer();
    this.closeFlyout();
    this.navigated.emit();
  }

  /**
   * El flyout se muestra con CSS (`:hover` y `:focus-within`); aquí solo se coloca. Es `fixed`
   * para que el `<nav>` con scroll no lo recorte, así que se reubica mientras está visible: al
   * hacer scroll, al cambiar la ventana o al crecer porque se abrió un nivel interno.
   */
  protected openFlyout(): void {
    const submenu = this.submenu()?.nativeElement;
    if (!this.hasFlyout() || !this.view || !submenu || this.stopFlyoutTracking) {
      return;
    }

    const reposition = () => this.placeFlyout(submenu);
    reposition();

    const stopWatchingViewport = watchAnchor(this.view, reposition);
    const resizeObserver = new ResizeObserver(reposition);
    resizeObserver.observe(submenu);

    this.stopFlyoutTracking = () => {
      stopWatchingViewport();
      resizeObserver.disconnect();
    };
  }

  /** Deja de seguir la posición, salvo que el foco siga dentro (`focusout` hacia un hijo). */
  protected closeFlyout(event?: FocusEvent): void {
    const host = this.submenu()?.nativeElement.parentElement;
    if (event?.relatedTarget instanceof Node && host?.contains(event.relatedTarget)) {
      return;
    }
    this.stopFlyoutTracking?.();
    this.stopFlyoutTracking = null;
  }

  private placeFlyout(submenu: HTMLElement): void {
    const trigger = this.trigger()?.nativeElement;
    if (trigger && this.view) {
      placeAnchored(submenu, trigger, this.view, { placement: 'right-start', clampHeight: true });
    }
  }
}

function routesOf(item: NavItem): string[] {
  const own = item.route ? [item.route] : [];
  const nested = (item.children ?? []).flatMap(routesOf);
  return [...own, ...nested];
}
