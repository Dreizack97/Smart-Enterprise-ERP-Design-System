import { Component, input } from '@angular/core';
import { Tone } from '@shared/models/tone.model';

/**
 * Una entrada de una línea dentro de un contenedor denso, como una celda de
 * calendario.
 *
 * Generalizado a partir de `event-chip`, que solo se diferenciaba en el
 * nombre. El contenido se proyecta, así que el chip nunca formatea nada por
 * sí mismo; trunca al desbordarse porque la celda que lo contiene no tiene
 * ancho de sobra.
 */
@Component({
  selector: 'app-schedule-chip',
  templateUrl: './schedule-chip.html',
  styleUrl: './schedule-chip.css',
})
export class ScheduleChip {
  readonly tone = input<Tone>('blue');
}
