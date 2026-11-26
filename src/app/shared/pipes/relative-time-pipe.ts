import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Por debajo de esto se dice «ahora», no «hace 0 minutos». */
const JUST_NOW = MINUTE;

/**
 * Un instante del pasado en lenguaje natural: «hace 5 minutos», «ayer».
 * Pasada una semana se muestra la fecha, que a esa distancia es más útil.
 *
 * Puro: el texto se calcula al cambiar el instante, no con el paso del reloj.
 * Sirve para listas que se vuelven a pintar al navegar, no para un reloj en vivo.
 */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);
  private readonly relative = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
  private readonly absolute = new Intl.DateTimeFormat(this.locale, {
    day: 'numeric',
    month: 'short',
  });

  transform(timestamp: number, now: number = Date.now()): string {
    const elapsed = Math.max(0, now - timestamp);
    if (elapsed < JUST_NOW) return this.relative.format(0, 'second');
    if (elapsed < HOUR) return this.relative.format(-Math.floor(elapsed / MINUTE), 'minute');
    if (elapsed < DAY) return this.relative.format(-Math.floor(elapsed / HOUR), 'hour');
    if (elapsed < WEEK) return this.relative.format(-Math.floor(elapsed / DAY), 'day');
    return this.absolute.format(timestamp);
  }
}
