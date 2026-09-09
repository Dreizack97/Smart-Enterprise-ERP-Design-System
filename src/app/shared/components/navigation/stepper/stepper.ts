import { Component, computed, input, numberAttribute } from '@angular/core';
import { Icon } from '@shared/components/media/icon/icon';

/** Un paso del flujo. */
export interface StepItem {
  readonly label: string;
  readonly description?: string;
}

/** Dónde queda un paso respecto al actual. */
export type StepState = 'done' | 'current' | 'pending';

/** Horizontal cabe en el encabezado de un asistente; vertical cabe en un panel lateral angosto. */
export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * Indicador de progreso para un flujo por pasos.
 *
 * Un indicador, no un control: no se puede saltar a un paso haciéndole clic.
 * Alguien completando un registro de varias partes necesita saber cuánto
 * falta, no otra forma de perderse.
 *
 * Se anuncia como una lista ordenada con el paso actual marcado
 * (`aria-current`), que es algo que un lector de pantalla ya sabe recorrer.
 */
@Component({
  selector: 'app-stepper',
  imports: [Icon],
  templateUrl: './stepper.html',
  styleUrl: './stepper.css',
})
export class Stepper {
  readonly steps = input.required<readonly StepItem[]>();

  /** Índice del paso en curso, empezando en 0. */
  readonly current = input(0, { transform: numberAttribute });

  readonly orientation = input<StepperOrientation>('horizontal');

  /** Nombre accesible del flujo. */
  readonly label = input('Progreso');

  protected readonly clampedIndex = computed(() =>
    Math.min(Math.max(0, this.current()), Math.max(0, this.steps().length - 1)),
  );

  protected readonly summary = computed(
    () => `Paso ${this.clampedIndex() + 1} de ${this.steps().length}`,
  );

  protected state(index: number): StepState {
    const current = this.clampedIndex();
    if (index < current) {
      return 'done';
    }
    return index === current ? 'current' : 'pending';
  }

  /** Un conector se recorre solo una vez que se ha alcanzado el paso al que lleva. */
  protected isTravelled(index: number): boolean {
    return index <= this.clampedIndex();
  }
}
