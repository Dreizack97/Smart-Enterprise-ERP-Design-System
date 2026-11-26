import {
  Component,
  DOCUMENT,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconName } from '@core/icons/lucide-icons';
import { bindSearchEscape } from '@core/layout/page-search';
import { NotificationFeed } from '@core/notifications/notification-feed';
import { NotificationItem } from '@core/notifications/notification.model';
import { ThemeStore } from '@core/theme/theme-store';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { Icon } from '@shared/components/media/icon/icon';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import {
  DropdownMenu,
  DropdownMenuEntry,
  MENU_SEPARATOR,
} from '@shared/components/overlays/dropdown-menu/dropdown-menu';
import { NotificationList } from '@shared/components/overlays/notification-list/notification-list';

/** Entrada del menú de cuenta que cierra la sesión. */
const SIGN_OUT_ITEM = 'Cerrar sesión';

/**
 * La barra superior fija.
 *
 * Reúne los tres controles globales: llegar al menú, el tema y la sesión.
 *
 * Renombrada desde `app-navbar`: la carpeta repetía el prefijo del selector,
 * así que el import leía `AppNavbar` desde `app-navbar/app-navbar` en una
 * aplicación en la que todo selector ya empieza con `app-`.
 *
 * No sabe nada de autenticación. En el original leía `AuthStore` a través de
 * su contenedor y la identidad quedaba soldada a una forma particular de
 * iniciar sesión; aquí la persona son cuatro inputs y cerrar sesión es un
 * output, así que la misma barra sirve al catálogo, a una demo, o a una
 * aplicación con un modelo de sesión distinto.
 */
@Component({
  selector: 'app-navbar',
  imports: [Avatar, DropdownMenu, Icon, NotificationList, RouterLink, SearchInput],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  host: {
    '(document:keydown)': 'onSearchShortcut($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Navbar {
  /** Nombre del producto que se muestra junto al logo. */
  readonly brand = input('Smart Enterprise');

  /** Calificativo bajo la marca, al estilo de la edición en uso. */
  readonly brandSuffix = input('ERP');

  /** Ruta del logo SVG de la marca. */
  readonly logoSrc = input('/favicon.svg');

  /** Nombre de la persona con sesión iniciada, mostrado en el menú de cuenta. */
  readonly userName = input('Invitada');

  /** Rol mostrado bajo el nombre. */
  readonly userRole = input('');

  /** Correo mostrado en el menú de cuenta. Vacío lo omite. */
  readonly userEmail = input('');

  /** Imagen del avatar. Vacío recae en iniciales sobre un disco de color. */
  readonly userImage = input('');

  /** El riel está colapsado. Gobierna la etiqueta y la dirección del chevron. */
  readonly railCollapsed = input(false, { transform: booleanAttribute });

  /** Se presionó el interruptor del cajón. Solo se muestra bajo el punto de quiebre de escritorio. */
  readonly drawerToggled = output<void>();

  /** Se presionó el interruptor del riel. Solo se muestra en escritorio. */
  readonly railToggled = output<void>();

  /** Emitido con el texto de búsqueda conforme se escribe. */
  readonly searchChanged = output<string>();

  /** Emitido al elegir cerrar sesión. Cerrar sesión es tarea del contenedor. */
  readonly signedOut = output<void>();

  /** Se abrió una notificación. El contenedor decide a dónde lleva. */
  readonly notificationOpened = output<NotificationItem>();

  /** Muestra el buscador global en la barra superior cuando se necesita. */
  readonly showSearch = input(false, { transform: booleanAttribute });

  /** Texto guía opcional para el buscador de la barra superior. */
  readonly searchPlaceholder = input('Buscar...');

  /** Nombre accesible opcional para el buscador de la barra superior. */
  readonly searchLabel = input('Buscar');

  /** Consulta actual; puede controlarse desde el contenedor o usarse de forma autónoma. */
  readonly searchQuery = model('');

  /** Atajo de teclado mostrado y escuchado cuando el buscador de la barra está activo. */
  readonly searchShortcut = input<readonly string[]>(['/']);

  /** Indica si el contenedor proyectó un panel de resultados en el slot `searchPanel`. */
  readonly hasSearchPanel = input(false, { transform: booleanAttribute });

  /** Nombre accesible de la región desplegable con resultados bajo el buscador. */
  readonly searchResultsLabel = input('Resultados de búsqueda');

  /**
   * Se eligió «Mi perfil» en el menú de cuenta.
   *
   * Un output y no un `routerLink` en la entrada del menú: la barra no sabe
   * qué rutas existen —esa es la razón por la que sirve igual al catálogo que
   * a una aplicación— así que anuncia la intención y el contenedor la
   * resuelve, igual que con `signedOut` y `notificationOpened`.
   */
  readonly profileOpened = output<string>();

  protected readonly theme = inject(ThemeStore);
  protected readonly feed = inject(NotificationFeed);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly searchInput = viewChild(SearchInput);
  private readonly searchBox = viewChild<ElementRef<HTMLElement>>('searchBox');
  private pointerDownInsideSearch = false;

  protected readonly userMenuOpen = signal(false);
  protected readonly notificationsOpen = signal(false);
  protected readonly searchOpen = signal(false);
  protected readonly searchPanelVisible = computed(
    () =>
      this.showSearch() &&
      this.hasSearchPanel() &&
      this.searchOpen() &&
      Boolean(this.searchQuery().trim()),
  );

  constructor() {
    effect((onCleanup) => {
      const box = this.searchBox()?.nativeElement;
      if (!box) {
        return;
      }
      onCleanup(bindSearchEscape(box, () => this.dismissSearch()));
    });
  }

  protected readonly themeIcon = computed<IconName>(() => (this.theme.isDark() ? 'sun' : 'moon'));

  protected readonly accountLabel = computed(() => `Cuenta de ${this.userName()}`);

  protected readonly railLabel = computed(() =>
    this.railCollapsed() ? 'Expandir menú' : 'Contraer menú',
  );

  /** El número va en la etiqueta: nadie anuncia un punto rojo. */
  protected readonly notificationsLabel = computed(() => {
    const unread = this.feed.unreadCount();
    return unread === 0 ? 'Notificaciones' : `Notificaciones, ${unread} sin leer`;
  });

  protected readonly userMenuItems: readonly DropdownMenuEntry[] = [
    { label: 'Datos personales', icon: 'user' },
    { label: 'Seguridad', icon: 'shield' },
    { label: 'Preferencias', icon: 'settings' },
    MENU_SEPARATOR,
    { label: SIGN_OUT_ITEM, icon: 'log-out', danger: true },
  ];

  /** Cierra el panel de resultados, limpia la consulta y saca el foco del buscador. */
  dismissSearch(): void {
    this.searchOpen.set(false);
    this.pointerDownInsideSearch = false;
    if (this.searchQuery()) {
      this.onSearch('');
    }
    const box = this.searchBox()?.nativeElement;
    const active = this.document.activeElement;
    if (box && active instanceof HTMLElement && box.contains(active)) {
      active.blur();
    }
  }

  protected onSearch(value: string): void {
    this.searchQuery.set(value);
    this.searchChanged.emit(value);
    this.searchOpen.set(Boolean(value.trim()));
  }

  protected onSearchFocusIn(): void {
    this.searchOpen.set(true);
  }

  protected onSearchFocusOut(event: FocusEvent): void {
    const box = this.searchBox()?.nativeElement;
    const next = event.relatedTarget;
    if (!box || (next instanceof Node && box.contains(next))) {
      return;
    }
    this.searchOpen.set(false);
  }

  protected onDocumentPointerDown(event: Event): void {
    const box = this.searchBox()?.nativeElement;
    const inside = Boolean(box && event.target instanceof Node && box.contains(event.target));
    this.pointerDownInsideSearch = inside;
    if (!inside) {
      this.searchOpen.set(false);
    }
  }

  protected onDocumentClick(event: Event): void {
    const wasInside = this.pointerDownInsideSearch;
    this.pointerDownInsideSearch = false;
    if (wasInside) {
      return;
    }
    const box = this.searchBox()?.nativeElement;
    if (!box || (event.target instanceof Node && box.contains(event.target))) {
      return;
    }
    this.searchOpen.set(false);
  }

  /** Enfoca el buscador de la barra con `/` cuando no hay un campo editable o diálogo activo. */
  protected onSearchShortcut(event: KeyboardEvent): void {
    if (
      event.defaultPrevented ||
      !this.showSearch() ||
      !this.searchShortcut().length ||
      event.key !== '/' ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    const search = this.searchInput();
    if (!search || this.host.nativeElement.closest('[inert], [aria-hidden="true"]')) {
      return;
    }

    if (
      this.document.querySelector('dialog[open], .modal-overlay.is-open, .drawer-scrim.is-open')
    ) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      (target.closest('input, textarea, select') ||
        (target instanceof HTMLElement && target.isContentEditable))
    ) {
      return;
    }

    if (!search.focus()) {
      return;
    }

    event.preventDefault();
  }

  /** Abrir una notificación la marca como leída; a dónde lleva es cosa del contenedor. */
  protected onNotificationSelected(item: NotificationItem): void {
    this.feed.markRead(item.id);
    this.notificationsOpen.set(false);
    this.notificationOpened.emit(item);
  }

  protected onUserMenuSelect(label: string): void {
    if (label === SIGN_OUT_ITEM) {
      this.signedOut.emit();
      return;
    }
    const sectionMap: Record<string, string> = {
      'Datos personales': 'datos',
      Seguridad: 'seguridad',
      Preferencias: 'preferencias',
    };
    const section = sectionMap[label] ?? 'datos';
    this.profileOpened.emit(section);
  }
}
