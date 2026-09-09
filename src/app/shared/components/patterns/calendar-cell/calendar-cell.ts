import { Component, booleanAttribute, input, numberAttribute } from '@angular/core';

/**
 * Un día en la cuadrícula de un mes.
 *
 * La cuadrícula no dibuja `gap`: la separación son los propios bordes de las
 * celdas, que es por lo que a una celda hay que decirle cuándo termina una
 * fila — si no, el borde derecho se duplica contra el contenedor.
 *
 * Renombrado desde `calendar-day` para que la familia se lea como un
 * conjunto junto con `schedule-card` y `schedule-chip`, y para que el nombre
 * diga qué es (una celda de cuadrícula) y no qué llega a contener.
 */
@Component({
  selector: 'app-calendar-cell',
  templateUrl: './calendar-cell.html',
  styleUrl: './calendar-cell.css',
  host: {
    class: 'calendar-cell',
    '[class.calendar-cell--last-in-row]': 'lastInRow()',
    '[class.calendar-cell--muted]': 'muted()',
  },
})
export class CalendarCell {
  /** Número de día mostrado en la celda. */
  readonly day = input.required<number, unknown>({ transform: numberAttribute });

  /** Un día de un mes adyacente: se muestra, pero atenuado. */
  readonly muted = input(false, { transform: booleanAttribute });

  /** Quita el borde derecho para que la última celda de una semana no lo duplique. */
  readonly lastInRow = input(false, { transform: booleanAttribute });

  /** Marca la celda como hoy. */
  readonly today = input(false, { transform: booleanAttribute });
}
