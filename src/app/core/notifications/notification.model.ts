import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';

/**
 * Una entrada persistente del centro de notificaciones.
 *
 * No confundir con los toasts efímeros de `Notifications` (`core/services`):
 * esos aparecen y se van solos; estas se acumulan hasta que alguien las lee.
 * Comparten el vocabulario de tonos con `app-activity-item`, que es la misma
 * idea visual puesta en la página.
 */
export interface NotificationItem {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  readonly description: string;

  /** Momento en lenguaje natural, ya formateado: "hace 5 minutos". */
  readonly time: string;

  readonly read: boolean;

  /** Ruta interna a la que lleva la entrada. Sin ella, solo se marca como leída. */
  readonly route?: string;
}
