import { Component, computed, input } from '@angular/core';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';

/**
 * Píldora de estado. Puramente presentacional: recibe el tono y el texto ya
 * resueltos.
 *
 * El vocabulario ("Activo", "Completada") pertenece a cada dominio, no al
 * sistema de diseño, así que llega como input en vez de vivir en un mapa
 * aquí.
 */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  /** El estado que se muestra, que decide el color. */
  readonly tone = input.required<StatusTone>();

  /** Texto mostrado. El color por sí solo nunca debe ser el único portador de significado. */
  readonly label = input.required<string>();

  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);
}
