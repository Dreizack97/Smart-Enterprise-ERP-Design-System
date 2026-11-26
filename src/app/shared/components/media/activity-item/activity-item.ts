import { Component, input } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Icon } from '@shared/components/media/icon/icon';

/** Píldora de contexto bajo el título (dispositivo, actor o IP). */
export interface ActivityPill {
  readonly icon?: IconName;
  readonly label: string;
  readonly mono?: boolean;
}

/** Una entrada en un historial de actividad, lista de sesiones o bloque de acción. */
@Component({
  selector: 'app-activity-item',
  imports: [Icon, Badge],
  templateUrl: './activity-item.html',
  styleUrl: './activity-item.css',
  host: {
    '[attr.title]': 'null',
  },
})
export class ActivityItem {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly time = input('');
  readonly secondaryTime = input('');
  readonly tone = input<Tone>('blue');
  readonly badgeLabel = input<string | null>('');
  readonly badgeTone = input<Tone>('neutral');
  readonly pills = input<readonly ActivityPill[]>([]);
}
