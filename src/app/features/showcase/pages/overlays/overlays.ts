import { Component, inject, signal } from '@angular/core';
import { NotificationFeed } from '@core/notifications/notification-feed';
import { NotificationItem } from '@core/notifications/notification.model';
import { Notifications } from '@core/services/notification';
import { Button } from '@shared/components/actions/button/button';
import { ConfirmDialog } from '@shared/components/overlays/confirm-dialog/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuEntry,
  DropdownMenuItem,
  MENU_SEPARATOR,
} from '@shared/components/overlays/dropdown-menu/dropdown-menu';
import { Drawer } from '@shared/components/overlays/drawer/drawer';
import { Modal } from '@shared/components/overlays/modal/modal';
import { NotificationList } from '@shared/components/overlays/notification-list/notification-list';
import { Input } from '@shared/components/forms/input/input';
import { Tooltip } from '@shared/directives/tooltip';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/** Página de catálogo de la familia `overlays/`, más la directiva de tooltip. */
@Component({
  selector: 'app-overlays',
  imports: [
    Button,
    ConfirmDialog,
    Drawer,
    DropdownMenu,
    Input,
    Modal,
    NotificationList,
    ShowcaseBlock,
    ShowcasePage,
    Tooltip,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './overlays.html',
  styleUrl: './overlays.css',
})
export class Overlays {
  private readonly notifications = inject(Notifications);
  protected readonly feed = inject(NotificationFeed);

  protected readonly modalOpen = signal(false);
  protected readonly nestedOpen = signal(false);
  protected readonly confirmOpen = signal(false);
  protected readonly warningOpen = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly panelOpen = signal(false);
  protected readonly detailDrawer = signal(false);
  protected readonly filterDrawer = signal(false);

  protected readonly reference = signal('PED-2481');

  /** El último elemento elegido, para que la demo pruebe que el output realmente se dispara. */
  protected readonly lastChoice = signal('');

  protected readonly actions: readonly DropdownMenuEntry[] = [
    { label: 'Ver detalle', icon: 'eye' },
    { label: 'Duplicar', icon: 'copy' },
    { label: 'Imprimir', icon: 'printer' },
    MENU_SEPARATOR,
    { label: 'Cancelar pedido', icon: 'x', disabled: true },
    { label: 'Eliminar', icon: 'trash-2', danger: true },
  ];

  protected onChoose(item: DropdownMenuItem): void {
    this.lastChoice.set(item.label);
  }

  protected onConfirm(): void {
    this.notifications.success('Confirmado. Nada se eliminó: esto es una vitrina.');
  }

  protected onCancel(): void {
    this.notifications.info('Cancelado.');
  }

  protected onNotificationSelected(item: NotificationItem): void {
    this.feed.markRead(item.id);
    this.notifications.info(item.title);
  }

  protected resetFeed(): void {
    this.feed.reset();
  }
}
