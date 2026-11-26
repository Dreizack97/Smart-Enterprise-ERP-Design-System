import { Component, booleanAttribute, computed, input } from '@angular/core';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';
import { StatusIndicator } from '@shared/components/feedback/status-indicator/status-indicator';

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
  imports: [StatusIndicator],
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  /** El estado que se muestra, que decide el color. */
  readonly tone = input.required<StatusTone>();

  /** Texto mostrado. El color por sí solo nunca debe ser el único portador de significado. */
  readonly label = input.required<string>();

  /** Permite mostrar u ocultar el indicador tipo radar; por defecto pulsa en estados `success`. */
  readonly pulse = input<boolean | undefined, unknown>(undefined, {
    transform: (val: unknown) => (val === undefined ? undefined : booleanAttribute(val)),
  });

  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);
  protected readonly isPulsing = computed(() => this.pulse() ?? this.tone() === 'success');
}
