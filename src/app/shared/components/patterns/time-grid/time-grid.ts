import { Component, computed, input, output } from '@angular/core';
import { Tone } from '@shared/models/tone.model';

/** Columna de día o recurso en una cuadrícula horaria. */
export interface TimeGridColumn {
  readonly id: string;
  readonly label: string;
  readonly today?: boolean;
}

/** Cita o bloque horario colocado sobre una columna y hora de inicio. */
export interface TimeGridEntry {
  readonly id: string;
  readonly columnId: string;
  readonly hour: number;
  readonly title: string;
  readonly subtitle?: string;
  readonly tone: Tone;
}

/**
 * Cuadrícula horaria por columnas para vistas de agenda de día o semana.
 *
 * Coloca cada entrada en la intersección columna/hora utilizando la paleta
 * semántica de tonos (`.tone-soft`) y notifica la selección con `entrySelected`.
 */
@Component({
  selector: 'app-time-grid',
  templateUrl: './time-grid.html',
  styleUrl: './time-grid.css',
})
export class TimeGrid {
  readonly columns = input.required<readonly TimeGridColumn[]>();
  readonly entries = input<readonly TimeGridEntry[]>([]);
  readonly startHour = input(8);
  readonly endHour = input(17);

  readonly entrySelected = output<TimeGridEntry>();

  protected readonly hours = computed(() => {
    const start = Math.max(0, Math.min(23, this.startHour()));
    const end = Math.max(start, Math.min(23, this.endHour()));
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  protected formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  protected entriesAt(columnId: string, hour: number): readonly TimeGridEntry[] {
    return this.entries().filter((entry) => entry.columnId === columnId && entry.hour === hour);
  }
}
