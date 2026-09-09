import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconName } from '@core/icons/lucide-icons';
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

/** Entrada del menú de cuenta que lleva al perfil. */
const PROFILE_ITEM = 'Mi perfil';

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
})
export class Navbar {
  /** Nombre del producto que se muestra junto al logo. */
  readonly brand = input('Smart Enterprise');

  /** Calificativo bajo la marca, al estilo de la edición en uso. */
  readonly brandSuffix = input('ERP');

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

  /**
   * Se eligió «Mi perfil» en el menú de cuenta.
   *
   * Un output y no un `routerLink` en la entrada del menú: la barra no sabe
   * qué rutas existen —esa es la razón por la que sirve igual al catálogo que
   * a una aplicación— así que anuncia la intención y el contenedor la
   * resuelve, igual que con `signedOut` y `notificationOpened`.
   */
  readonly profileOpened = output<void>();

  protected readonly theme = inject(ThemeStore);
  protected readonly feed = inject(NotificationFeed);

  protected readonly query = signal('');
  protected readonly userMenuOpen = signal(false);
  protected readonly notificationsOpen = signal(false);

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
    { label: PROFILE_ITEM, icon: 'user' },
    { label: 'Configuración', icon: 'settings' },
    MENU_SEPARATOR,
    { label: SIGN_OUT_ITEM, icon: 'log-out', danger: true },
  ];

  protected onSearch(value: string): void {
    this.query.set(value);
    this.searchChanged.emit(value);
  }

  /** Abrir una notificación la marca como leída; a dónde lleva es cosa del contenedor. */
  protected onNotificationSelected(item: NotificationItem): void {
    this.feed.markRead(item.id);
    this.notificationsOpen.set(false);
    this.notificationOpened.emit(item);
  }

  protected onUserMenuSelect(label: string): void {
    if (label === PROFILE_ITEM) {
      this.profileOpened.emit();
      return;
    }
    if (label === SIGN_OUT_ITEM) {
      this.signedOut.emit();
    }
  }
}
