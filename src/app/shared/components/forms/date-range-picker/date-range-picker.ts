import {
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { placeAnchored, watchAnchor } from '@shared/utils/anchored-position';
import { IsoDate, formatTyped, fromIso, parseDate } from '@shared/utils/calendar';
import { absorbSeparatorBackspace, hasFullDate, maskDateField } from '@shared/utils/date-mask';
import { nextElementId } from '@shared/utils/element-id';
import { DateGrid } from '@shared/components/forms/date-grid/date-grid';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Espacio entre el campo y el calendario. */
const POPUP_GAP = 4;

/**
 * Un tramo entre dos días de calendario: el filtro con el que empieza todo
 * reporte de un ERP.
 *
 * Ambos extremos son `IsoDate`, y aplica el mismo razonamiento que en
 * `date-picker` sobre por qué no son `Date`.
 *
 * ## Escritura
 *
 * Dos campos, uno por extremo, en **día/mes/año**, enmascarados conforme se
 * escriben. Dos y no uno porque un rango son dos fechas: una sola caja que
 * dijera «01/09/2026 — 15/09/2026» tendría que interpretarse como un todo, y
 * corregir la segunda fecha significaría editar alrededor de un separador
 * que no es de uno tocar.
 *
 * ## Cómo se elige un rango
 *
 * Un calendario, dos pulsaciones. La primera pulsación empieza un rango
 * nuevo y borra el anterior, la segunda lo cierra — y si la segunda es
 * **anterior** a la primera, se intercambian en vez de rechazarse. Alguien
 * que elige el final del mes y después su inicio expresó un rango con toda
 * claridad, y un mensaje de error ahí sería el componente insistiendo en su
 * propio orden.
 *
 * El picker se queda abierto entre las dos pulsaciones, porque un rango a
 * medio elegir no es una respuesta: cerrar en la primera pulsación dejaría
 * un inicio sin fin y un filtro que no significa nada.
 */
@Component({
  selector: 'app-date-range-picker',
  imports: [DateGrid, Field, Icon],
  templateUrl: './date-range-picker.html',
  styleUrl: './date-range-picker.css',
  host: {
    '(keydown.escape)': 'close()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DateRangePicker {
  readonly start = model<IsoDate>('');
  readonly end = model<IsoDate>('');

  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('dd/mm/aaaa');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pickerId = input(nextElementId('date-range'));

  /** Nombre accesible para un picker mostrado sin etiqueta visible. */
  readonly ariaLabel = input('');

  private readonly document = inject(DOCUMENT);
  private readonly anchor = viewChild<ElementRef<HTMLElement>>('anchor');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  protected readonly open = signal(false);
  protected readonly month = signal(new Date());

  /** Verdadero una vez que se elige un inicio y el rango espera su fin. */
  protected readonly picking = signal(false);

  /** Lo que hay en cada campo. No son los valores: esos son días de calendario. */
  protected readonly startText = signal('');
  protected readonly endText = signal('');
  protected readonly parseError = signal('');

  private unwatch: (() => void) | null = null;

  constructor() {
    // Los campos siguen a los valores, incluso cuando se fijan desde afuera.
    effect(() => {
      const start = formatTyped(this.start());
      const end = formatTyped(this.end());
      untracked(() => {
        this.startText.set(start);
        this.endText.set(end);
        this.parseError.set('');
      });
    });

    afterRenderEffect(() => {
      const showing = this.open();
      const popup = this.popup()?.nativeElement;
      const anchor = this.anchor()?.nativeElement;
      const view = this.document.defaultView;

      this.unwatch?.();
      this.unwatch = null;

      if (!showing || !popup || !anchor || !view) {
        return;
      }

      const place = () =>
        placeAnchored(popup, anchor, view, { placement: 'bottom-start', gap: POPUP_GAP });
      place();
      this.unwatch = watchAnchor(view, place);

      // Abrir aterriza sobre el día que ya está elegido, no sobre la celda
      // que sea que resulte primera en la cuadrícula. El calendario se abre
      // para cambiar una fecha, así que la fecha que se está cambiando es
      // donde el teclado debe empezar.
      const chosen = popup.querySelector<HTMLElement>(`[data-iso="${this.start()}"]`);
      (chosen ?? popup.querySelector<HTMLElement>('.cal__day[tabindex="0"]'))?.focus();
    });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (!this.open()) {
      this.month.set(fromIso(this.start()) ?? new Date());
      this.picking.set(false);
    }
    this.open.update((showing) => !showing);
  }

  /** Lee uno de los dos campos conforme se escribe. */
  protected onType(which: 'start' | 'end', event: Event): void {
    const input = event.target as HTMLInputElement;
    const text = which === 'start' ? this.startText : this.endText;
    const value = which === 'start' ? this.start : this.end;

    // El texto pegado se lee antes de que la máscara lo toque: ver `date-picker`.
    if ((event as InputEvent).inputType === 'insertFromPaste') {
      const pasted = parseDate(input.value);
      if (pasted) {
        this.parseError.set('');
        value.set(pasted);
        this.month.set(fromIso(pasted) ?? new Date());
        return;
      }
    }

    const typed = maskDateField(input);
    text.set(typed);

    if (!typed.trim()) {
      value.set('');
      this.parseError.set('');
      return;
    }

    // Solo una fecha completa se confirma mientras se escribe: ver `date-picker`.
    if (!hasFullDate(typed)) {
      return;
    }

    const parsed = parseDate(typed);
    if (parsed) {
      this.parseError.set('');
      value.set(parsed);
      this.month.set(fromIso(parsed) ?? new Date());
    }
  }

  /** Deja que Backspace alcance el dígito detrás de un separador. */
  protected onKeydown(event: KeyboardEvent): void {
    absorbSeparatorBackspace(event);
  }

  /** Dice si el campo se entendió, una vez que quien lee lo abandona. */
  protected onLeave(which: 'start' | 'end'): void {
    const text = which === 'start' ? this.startText : this.endText;
    const value = which === 'start' ? this.start : this.end;
    const typed = text().trim();

    if (!typed) {
      this.parseError.set('');
      value.set('');
      return;
    }

    // Un año de dos cifras se expande aquí y en ningún otro lugar, por la
    // razón explicada en `date-picker`.
    const parsed = parseDate(typed);
    if (parsed) {
      this.parseError.set('');
      value.set(parsed);
      this.month.set(fromIso(parsed) ?? new Date());
      this.orderEnds();
      this.startText.set(formatTyped(this.start()));
      this.endText.set(formatTyped(this.end()));
      return;
    }
    this.parseError.set('No se entiende esa fecha. Escríbela como 31/12/2026.');
  }

  /**
   * Mantiene los dos extremos en orden, sea cual sea el que se acaba de
   * escribir.
   *
   * La misma regla que sigue el calendario: un rango escrito al revés es un
   * rango, no un error, así que los extremos se intercambian en vez de
   * rechazarse.
   *
   * **Al salir del campo, nunca mientras se escribe.** Corrido en cada
   * tecleo, leería la fecha a medio escribir contra el OTRO extremo
   * anterior e intercambiaría de paso: escribir un inicio de «20/10»
   * mientras el fin todavía decía «15/09» movía la fecha que se estaba
   * escribiendo a la otra casilla, a mitad de palabra. Un rango solo está
   * al revés una vez que ambos extremos son intencionales.
   */
  private orderEnds(): void {
    const start = this.start();
    const end = this.end();
    if (start && end && end < start) {
      this.start.set(end);
      this.end.set(start);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.picking.set(false);
  }

  protected choose(iso: IsoDate): void {
    if (!this.picking()) {
      this.start.set(iso);
      this.end.set('');
      this.picking.set(true);
      return;
    }

    // Elegido al revés: los dos extremos se intercambian, no se rechazan.
    const first = this.start();
    if (iso < first) {
      this.start.set(iso);
      this.end.set(first);
    } else {
      this.end.set(iso);
    }
    this.picking.set(false);
    this.close();
  }

  protected clear(): void {
    this.start.set('');
    this.end.set('');
    this.picking.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    const host = this.anchor()?.nativeElement.parentElement;
    const popup = this.popup()?.nativeElement;
    const target = event.target as Node;
    if (this.open() && !host?.contains(target) && !popup?.contains(target)) {
      this.close();
    }
  }
}
