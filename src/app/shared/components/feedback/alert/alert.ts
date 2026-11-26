import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Un aviso que se queda en la página.
 *
 * Complementa a los toasts efímeros de `Notifications`: cuando el mensaje
 * describe el estado en el que la pantalla queda ("esta cuenta está en
 * revisión"), desaparecer después de cuatro segundos lo convierte en
 * información perdida.
 */
@Component({
  selector: 'app-alert',
  imports: [Icon],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class Alert {
  /**
   * Severidad del aviso. Decide icono, color y también el rol ARIA: solo
   * `danger` interrumpe a un lector de pantalla.
   */
  readonly tone = input<StatusTone>('info');

  /** Título en negrita sobre el contenido proyectado. Vacío lo omite. */
  readonly title = input('');

  /** Muestra el botón de cerrar y emite `dismissed` al presionarlo. */
  readonly dismissible = input(false, { transform: booleanAttribute });

  /** Ocultar el aviso es tarea del contenedor, no de este componente. */
  readonly dismissed = output<void>();

  protected readonly icon = computed<IconName>(() => ICONS[this.tone()]);

  /** El matiz al que mapea el estado, entregado al grupo de tokens `.tone-*`. */
  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);

  /**
   * `alert` interrumpe a un lector de pantalla; `status` no lo hace.
   *
   * Un error se gana la interrupción; una nota informativa que ha estado ahí
   * desde que cargó la página no.
   */
  protected readonly role = computed(() => (this.tone() === 'danger' ? 'alert' : 'status'));
}

/**
 * Un glifo por severidad.
 *
 * El original le daba el mismo `circle-alert` a `danger` e `info`, así que
 * un error y una nota al pie eran indistinguibles a primera vista — el color
 * cargaba con toda la diferencia, lo que falla a quien no puede separar los
 * dos matices.
 */
const ICONS: Record<StatusTone, IconName> = {
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
  neutral: 'info',
  info: 'info',
};
