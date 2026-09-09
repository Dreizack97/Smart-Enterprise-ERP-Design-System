import { Component, input } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';
import { Icon } from '@shared/components/media/icon/icon';

/** Una entrada en un historial de actividad. */
@Component({
  selector: 'app-activity-item',
  imports: [Icon],
  templateUrl: './activity-item.html',
  styleUrl: './activity-item.css',
})
export class ActivityItem {
  /** Icono que categoriza la actividad. */
  readonly icon = input.required<IconName>();

  /** Resumen de lo que ocurrió. */
  readonly title = input.required<string>();

  /** Detalle bajo el título. Vacío lo omite. */
  readonly description = input('');

  /** Antigüedad, ya formateada, al estilo de "hace 5 min". Vacío la omite. */
  readonly time = input('');

  /** Matiz de la burbuja del icono, de la paleta de tonos compartida. */
  readonly tone = input<Tone>('blue');
}
