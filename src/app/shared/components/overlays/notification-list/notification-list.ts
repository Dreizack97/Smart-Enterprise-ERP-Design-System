import { Component, computed, input, output } from '@angular/core';
import { NotificationItem } from '@core/notifications/notification.model';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * La bandeja de notificaciones.
 *
 * Presentacional: recibe la lista y emite lo que le ocurre. No sabe de dónde
 * vienen los avisos ni qué la envuelve, así que funciona igual dentro del
 * dropdown de la campana que en una página de notificaciones propia.
 */
@Component({
  selector: 'app-notification-list',
  imports: [Icon],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css',
})
export class NotificationList {
  /** Los avisos mostrados, en el orden en que llegan. */
  readonly items = input.required<readonly NotificationItem[]>();

  readonly heading = input('Notificaciones');

  /** Se muestra cuando no hay nada en la bandeja. */
  readonly emptyLabel = input('No tienes avisos pendientes.');

  /** Emitido con el aviso presionado. Marcarlo como leído es tarea del contenedor. */
  readonly selected = output<NotificationItem>();

  readonly markAllRead = output<void>();

  protected readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);
}
