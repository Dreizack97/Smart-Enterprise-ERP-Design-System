import { Component, computed, input, numberAttribute } from '@angular/core';
import { STATUS_HUE, StatusTone } from '@shared/models/status-tone.model';

/** `bar` ocupa el ancho disponible; `ring` cabe dentro de una tarjeta de métrica. */
export type ProgressVariant = 'bar' | 'ring';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Progreso de una tarea con un final conocido.
 *
 * No es un indicador de "cargando" indeterminado: ese es `app-skeleton`, que
 * además reserva el espacio que ocupará el contenido.
 */
@Component({
  selector: 'app-progress',
  templateUrl: './progress.html',
  styleUrl: './progress.css',
})
export class Progress {
  /** Porcentaje completado. Acotado entre 0 y 100. */
  readonly value = input(0, { transform: numberAttribute });

  readonly variant = input<ProgressVariant>('bar');

  /** El estado que el progreso representa, que decide su color. */
  readonly tone = input<StatusTone>('info');

  /** Nombre accesible. Obligatorio: una barra sin etiqueta no dice qué avanza. */
  readonly label = input.required<string>();

  /** Escribe el porcentaje junto a la barra o dentro del anillo. */
  readonly showValue = input(true);

  protected readonly percentage = computed(() =>
    Math.min(100, Math.max(0, Math.round(this.value()))),
  );

  /** El matiz al que mapea el estado, entregado al grupo de tokens `.tone-*`. */
  protected readonly hue = computed(() => STATUS_HUE[this.tone()]);

  protected readonly radius = RADIUS;
  protected readonly circumference = CIRCUMFERENCE;

  protected readonly offset = computed(() => CIRCUMFERENCE * (1 - this.percentage() / 100));
}
