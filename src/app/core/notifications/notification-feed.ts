import { Service, computed, signal } from '@angular/core';
import { NotificationItem } from './notification.model';

/**
 * Entradas de ejemplo para el centro de notificaciones.
 *
 * Un sistema de diseño no tiene servidor, y una bandeja vacía no muestra nada
 * del diseño. Estas viven aquí y no en almacenamiento a propósito: recargar
 * la página restaura el estado sin leer, así que la demo es repetible.
 */
const SAMPLE_NOTIFICATIONS: readonly NotificationItem[] = [
  {
    id: 'n1',
    icon: 'user-plus',
    tone: 'blue',
    title: 'Nuevo cliente registrado',
    description: 'Ana Torres completó su alta en el portal.',
    time: 'hace 5 minutos',
    read: false,
  },
  {
    id: 'n2',
    icon: 'shopping-cart',
    tone: 'green',
    title: 'Pedido confirmado',
    description: 'El pedido PED-2481 pasó a preparación.',
    time: 'hace 22 minutos',
    read: false,
  },
  {
    id: 'n3',
    icon: 'triangle-alert',
    tone: 'yellow',
    title: 'Inventario bajo',
    description: 'Quedan 4 unidades de «Teclado mecánico RX».',
    time: 'hace 1 hora',
    read: false,
  },
  {
    id: 'n4',
    icon: 'circle-check',
    tone: 'green',
    title: 'Factura pagada',
    description: 'FAC-1190 se liquidó por transferencia.',
    time: 'hace 3 horas',
    read: true,
  },
  {
    id: 'n5',
    icon: 'circle-alert',
    tone: 'red',
    title: 'Pago rechazado',
    description: 'La tarjeta de Grupo Vega fue declinada.',
    time: 'ayer',
    read: true,
  },
];

/**
 * El centro de notificaciones: la bandeja que cuelga de la campana.
 *
 * Vive en `core` y no dentro de la barra superior a propósito. El estado de
 * lectura lo consultan tanto la campana (para el punto) como el panel (para
 * resaltar las entradas sin leer); dentro de un componente, cada uno guardaría
 * su propia copia.
 */
@Service()
export class NotificationFeed {
  private readonly entries = signal<readonly NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  readonly all = this.entries.asReadonly();

  readonly unreadCount = computed(() => this.entries().filter((entry) => !entry.read).length);

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  /** Marca una como leída. Idempotente: repetirlo no cambia nada. */
  markRead(id: string): void {
    this.update((entry) => (entry.id === id ? { ...entry, read: true } : entry));
  }

  markAllRead(): void {
    this.update((entry) => (entry.read ? entry : { ...entry, read: true }));
  }

  /** Restaura el estado de ejemplo, para que el showcase se pueda repetir. */
  reset(): void {
    this.entries.set(SAMPLE_NOTIFICATIONS);
  }

  private update(transform: (entry: NotificationItem) => NotificationItem): void {
    this.entries.update((entries) => entries.map(transform));
  }
}
