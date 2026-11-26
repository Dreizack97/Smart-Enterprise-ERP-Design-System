import { Component, booleanAttribute, computed, input } from '@angular/core';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';

/** Presenta el indicador decorativo de estado que comparten badges, filtros y catálogos. */
@Component({
  selector: 'app-status-indicator',
  templateUrl: './status-indicator.html',
  styleUrl: './status-indicator.css',
  host: { 'aria-hidden': 'true', '[attr.data-tone]': 'hue()' },
})
export class StatusIndicator {
  /** Determina el color semántico sin depender de los estilos del consumidor. */
  readonly tone = input<StatusTone>('neutral');

  /** Habilita el pulso únicamente cuando el consumidor conoce un estado disponible. */
  readonly pulse = input(false, { transform: booleanAttribute });

  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);
}
