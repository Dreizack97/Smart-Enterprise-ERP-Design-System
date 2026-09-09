import { Component, input } from '@angular/core';
import { Tone } from '@shared/models/tone.model';

/**
 * Una fila para una entrada con fecha: un sello de fecha, un título, una
 * hora y una nota.
 *
 * Generalizada a partir del `event-card` original. La forma no cambió — lo
 * que cambió es que el sello ahora son dos strings libres (`stampTop`,
 * `stampBottom`) en vez de `month` + `day`. El original solo podía mostrar
 * un mes sobre un número de día; el mismo bloque se lee igual de bien como
 * un número de semana sobre un día, una sala sobre un horario, o una moneda
 * sobre un monto, y negarse a fijar "mes" a fuego no cuesta nada.
 */
@Component({
  selector: 'app-schedule-card',
  templateUrl: './schedule-card.html',
  styleUrl: './schedule-card.css',
})
export class ScheduleCard {
  /** Línea pequeña sobre la cifra del sello — un mes, un día de la semana, una sala. */
  readonly stampTop = input.required<string>();

  /** La cifra del sello — un número de día, un horario, un conteo. */
  readonly stampBottom = input.required<string, unknown>({
    transform: (value: unknown) => String(value ?? ''),
  });

  readonly title = input.required<string>();

  /** Rango de horario ya formateado. Vacío lo omite. */
  readonly time = input('');

  /** Una línea de contexto bajo el título. Vacío la omite. */
  readonly description = input('');

  /** Matiz del sello. */
  readonly tone = input<Tone>('blue');
}
