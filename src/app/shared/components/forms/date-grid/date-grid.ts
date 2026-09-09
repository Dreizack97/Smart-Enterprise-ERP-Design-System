import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  DaySlot,
  IsoDate,
  MONTH_NAMES,
  WEEKDAY_HEADINGS,
  fromIso,
  monthGrid,
  monthTitle,
  shiftDay,
  shiftMonth,
  toIso,
  todayIso,
} from '@shared/utils/calendar';
import { Icon } from '@shared/components/media/icon/icon';

/** Qué tan lejos llega la lista de años a cada lado del año que se muestra. */
const YEAR_REACH = 10;

/**
 * Un mes de días, dibujado como una cuadrícula de botones, con los
 * controles que mueven entre meses y años.
 *
 * Compartido por `date-picker` y `date-range-picker`, que difieren en lo que
 * *significa* un día elegido y coinciden por completo en cómo se dibuja un
 * mes. No es `calendar-cell`: esa es la casilla de una **agenda**, que
 * muestra un día y las entradas que tiene, y no es un control. Aquí cada
 * día es un botón que alguien presiona.
 *
 * ## Cómo moverse
 *
 * Tres formas de entrar, porque tres personas distintas van de prisa hacia
 * cosas distintas:
 *
 * - **las flechas**, para el mes siguiente o el anterior;
 * - **las dos listas**, para «marzo» y para «2024» — paginar veinte veces
 *   para llegar a una fecha de nacimiento no es navegación, es castigo;
 * - **el teclado**, sobre la propia cuadrícula.
 *
 * ## Por qué la navegación se escribe aquí y no se toma de `@angular/aria`
 *
 * Se tomó de ahí primero — `ngGrid` / `ngGridRow` / `ngGridCell`, de la
 * misma forma que `tabs`, `accordion` y `combobox` toman los suyos — y
 * después se midió, y dos huecos lo decidieron:
 *
 * 1. **La cuadrícula nunca mueve el foco.** En modo `roving` mueve el
 *    `tabindex` y ahí se detiene: no hay ni una llamada a `focus()` en toda
 *    la directiva. Medido, las flechas llevaron el tabindex del 7 al 8 al 15
 *    mientras el anillo de foco se quedaba en el 7. Ese hueco era barato de
 *    tender un puente sobre él.
 * 2. **A la cuadrícula no se le puede decir en qué celda empezar**, y no
 *    adopta una celda enfocada desde afuera. Un selector de fecha tiene que
 *    abrir sobre la fecha de la que trata; abrir sobre la primera casilla —
 *    un día en gris del mes anterior — es un control distinto. Medido:
 *    abierto sobre el 8 de septiembre, la primera flecha saltó al 31 de
 *    agosto, porque la cuadrícula seguía contando desde su propio índice 0.
 *    No hay API pública para moverla.
 *
 * Así que la **semántica** ARIA se queda — `grid` / `row` / `gridcell` es la
 * estructura correcta, y la librería es donde se aprendió eso — mientras que
 * la navegación es nuestra, porque el teclado de un calendario es sobre
 * fechas y el de la librería es sobre índices.
 */
@Component({
  selector: 'app-date-grid',
  imports: [Icon],
  templateUrl: './date-grid.html',
  styleUrl: './date-grid.css',
})
export class DateGrid {
  /** Cualquier día del mes que se muestra. Solo se leen su mes y su año. */
  readonly month = input.required<Date>();

  /** El día elegido, para un picker sencillo. */
  readonly selected = input<IsoDate | null>(null);

  /** Los extremos de un rango elegido, para un picker de rango. */
  readonly rangeStart = input<IsoDate | null>(null);
  readonly rangeEnd = input<IsoDate | null>(null);

  /** Nombra la cuadrícula, para que un lector de pantalla diga qué mes está leyendo. */
  readonly label = input('');

  readonly daySelected = output<IsoDate>();
  readonly monthChanged = output<Date>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /**
   * El día en el que está el teclado, que no es el día elegido.
   *
   * Gobierna un `tabindex` móvil: solo este día es tabulable, así que el
   * calendario cuesta una pulsación para pasar de largo en vez de
   * cuarenta y dos. Recae en la selección, luego en hoy, luego en el día 1
   * — para que el calendario abra donde ya está la atención de quien lee.
   */
  protected readonly focusedIso = signal<IsoDate | null>(null);

  protected readonly tabbableIso = computed(() => {
    const focused = this.focusedIso();
    if (focused && this.isInShownMonth(focused)) {
      return focused;
    }
    const selected = this.selected() ?? this.rangeStart();
    if (selected && this.isInShownMonth(selected)) {
      return selected;
    }
    const today = todayIso();
    if (this.isInShownMonth(today)) {
      return today;
    }
    return toIso(new Date(this.shownYear(), this.shownMonth(), 1));
  });

  protected readonly weekdays = WEEKDAY_HEADINGS;
  protected readonly months = MONTH_NAMES;
  protected readonly weeks = computed(() => monthGrid(this.month()));
  protected readonly title = computed(() => monthTitle(this.month()));
  protected readonly shownMonth = computed(() => this.month().getMonth());
  protected readonly shownYear = computed(() => this.month().getFullYear());

  /** Los años que la lista ofrece, incluyendo siempre el que se muestra. */
  protected readonly years = computed(() => {
    const centre = this.shownYear();
    return Array.from({ length: YEAR_REACH * 2 + 1 }, (_, index) => centre - YEAR_REACH + index);
  });

  /**
   * Si un día cae estrictamente entre los dos extremos de un rango.
   *
   * Estrictamente: los extremos se pintan como extremos, y un día que fuera
   * ambos recibiría dos tratamientos distintos a la vez.
   */
  protected inRange(slot: DaySlot): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || !end) {
      return false;
    }
    // Las fechas ISO comparan correctamente como texto, que es la mitad de
    // la razón por la que son la forma en que este sistema pasa fechas de un
    // lado a otro.
    return slot.iso > start && slot.iso < end;
  }

  protected isEnd(slot: DaySlot): boolean {
    return slot.iso === this.rangeStart() || slot.iso === this.rangeEnd();
  }

  protected isSelected(slot: DaySlot): boolean {
    return slot.iso === this.selected() || this.isEnd(slot);
  }

  protected step(offset: number): void {
    this.monthChanged.emit(shiftMonth(this.month(), offset));
  }

  protected pickMonth(value: string): void {
    this.monthChanged.emit(new Date(this.shownYear(), Number(value), 1));
  }

  protected pickYear(value: string): void {
    this.monthChanged.emit(new Date(Number(value), this.shownMonth(), 1));
  }

  /**
   * El teclado del calendario, tal como las prácticas ARIA lo describen
   * para una cuadrícula de fechas.
   *
   * Las flechas mueven un día, `Re Pág`/`Av Pág` un mes, `Shift+Re
   * Pág`/`Av Pág` un año, y `Inicio`/`Fin` los extremos de la semana.
   * Salirse del borde del mes trae el mes consigo: alguien que mantiene la
   * flecha derecha presionada más allá del 31 espera el 1, no un callejón
   * sin salida.
   */
  protected onKeydown(event: KeyboardEvent): void {
    const from = this.tabbableIso();
    const jump = KEY_STEPS[event.key];

    let next: IsoDate;
    if (jump !== undefined) {
      next = shiftDay(from, jump);
    } else if (event.key === 'Home') {
      next = shiftDay(from, -weekdayOf(from));
    } else if (event.key === 'End') {
      next = shiftDay(from, 6 - weekdayOf(from));
    } else if (event.key === 'PageUp') {
      next = this.samedayInMonth(from, event.shiftKey ? -12 : -1);
    } else if (event.key === 'PageDown') {
      next = this.samedayInMonth(from, event.shiftKey ? 12 : 1);
    } else {
      return;
    }

    event.preventDefault();
    this.focusedIso.set(next);
    this.followActiveCell();

    // Salirse del mes que se muestra trae el mes consigo.
    if (!this.isInShownMonth(next)) {
      const date = fromIso(next);
      if (date) {
        this.monthChanged.emit(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
  }

  /** Recuerda dónde está el teclado cuando se alcanza un día con el puntero. */
  protected onCellFocus(iso: IsoDate): void {
    this.focusedIso.set(iso);
  }

  /**
   * Mueve el foco al día en el que ahora está el teclado.
   *
   * Después del siguiente render, porque la celda puede no existir todavía:
   * salirse del borde del mes redibuja las cuarenta y dos.
   */
  private followActiveCell(): void {
    afterNextRender(
      () => {
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-iso="${this.tabbableIso()}"]`)
          ?.focus();
      },
      { injector: this.injector },
    );
  }

  /** El mismo número de día, a `offset` meses de distancia, acotado a la duración del mes. */
  private samedayInMonth(iso: IsoDate, offset: number): IsoDate {
    const date = fromIso(iso) ?? new Date();
    const target = new Date(date.getFullYear(), date.getMonth() + offset, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return toIso(
      new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay)),
    );
  }

  private isInShownMonth(iso: IsoDate): boolean {
    const date = fromIso(iso);
    return (
      !!date && date.getMonth() === this.shownMonth() && date.getFullYear() === this.shownYear()
    );
  }

  /** Elige un día desde el teclado: la celda es un gridcell, no un botón. */
  protected onCellKeydown(event: KeyboardEvent, iso: IsoDate): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.daySelected.emit(iso);
    }
  }
}

/** Las flechas, como número de días. */
const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

function weekdayOf(iso: IsoDate): number {
  return fromIso(iso)?.getDay() ?? 0;
}
