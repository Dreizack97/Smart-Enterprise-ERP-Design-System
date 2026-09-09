import {
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { placeAnchored, watchAnchor } from '@shared/utils/anchored-position';
import { IsoDate, formatTyped, fromIso, parseDate } from '@shared/utils/calendar';
import { absorbSeparatorBackspace, hasFullDate, maskDateField } from '@shared/utils/date-mask';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { DateGrid } from '@shared/components/forms/date-grid/date-grid';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Espacio entre el campo y el calendario. */
const POPUP_GAP = 4;

/**
 * Un día de calendario, elegido de un calendario.
 *
 * El valor es un `IsoDate` — `2026-09-08` — y no un `Date`, por la razón
 * explicada en `calendar.ts`: un `Date` es un instante en el tiempo y un
 * día de calendario no lo es, y la diferencia se manifiesta como un bug de
 * «un día de más o de menos» la primera vez que alguien al oeste de
 * Greenwich guarda una fecha.
 *
 * ## Escritura
 *
 * El campo acepta una fecha escrita, en **día/mes/año** — el orden en que
 * el español escribe las fechas. Ese orden es lo único de una fecha
 * escrita que no se puede inferir (`08/09/2026` es el 9 de agosto en
 * inglés), así que el componente lo declara en la pista en vez de
 * adivinarlo, y los separadores son flexibles porque qué tecla alcance
 * alguien no es información.
 *
 * El campo se enmascara conforme se escribe: entran dígitos y los
 * separadores aparecen por su cuenta, y se detiene al llegar a una fecha
 * completa. El razonamiento es el mismo que para el orden día-primero — la
 * forma de una fecha no es algo que quien la lee deba proveer, solo sus
 * números.
 *
 * Lo que no hace es aceptar una fecha que no entendió. Un texto que se
 * puede interpretar actualiza el valor y mueve el calendario hacia él; uno
 * que no, deja el valor intacto y lo dice bajo el campo, con lo escrito
 * todavía ahí para corregirse. Vaciar el campo borra la fecha, que es
 * cómo se desasigna una fecha.
 */
@Component({
  selector: 'app-date-picker',
  imports: [DateGrid, Field, Icon],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
  host: {
    '(keydown.escape)': 'close()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DatePicker {
  /** El día elegido, o vacío. */
  readonly value = model<IsoDate>('');

  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('dd/mm/aaaa');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly pickerId = input(nextElementId('date-picker'));

  /** Nombre accesible para un picker mostrado sin etiqueta visible. */
  readonly ariaLabel = input('');

  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  private readonly document = inject(DOCUMENT);
  private readonly anchor = viewChild<ElementRef<HTMLElement>>('anchor');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  private readonly control = useFormControl({
    id: this.pickerId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;

  protected readonly open = signal(false);

  /**
   * El mes que muestra el calendario.
   *
   * Estado propio, porque moverse entre meses es explorar y no elegir: el
   * valor no debe cambiar hasta que se presione un día. Abre en el mes del
   * valor actual, o en el mes en curso.
   */
  protected readonly month = signal(new Date());

  /** Lo que hay en el campo. No es el valor: el valor es un día de calendario. */
  protected readonly text = signal('');

  /** Se activa cuando el texto no se puede leer como fecha, se limpia en cuanto se puede. */
  protected readonly parseError = signal('');

  /**
   * El mensaje bajo el campo: primero un error de validación real, después
   * el propio.
   *
   * Un error de validación es sobre el valor y viene de afuera; un error
   * de interpretación es sobre el texto y le pertenece a este componente.
   * Cuando ambos son ciertos gana el de afuera, porque es el que el
   * formulario va a usar.
   */
  protected readonly combinedMessage = computed(() => this.message() || this.parseError());

  private unwatch: (() => void) | null = null;

  constructor() {
    // El campo sigue al valor, incluso cuando se fija desde afuera.
    effect(() => {
      const formatted = formatTyped(this.value());
      untracked(() => {
        this.text.set(formatted);
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
      const chosen = popup.querySelector<HTMLElement>(`[data-iso="${this.value()}"]`);
      (chosen ?? popup.querySelector<HTMLElement>('.cal__day[tabindex="0"]'))?.focus();
    });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (!this.open()) {
      this.month.set(fromIso(this.value()) ?? new Date());
    }
    this.open.update((showing) => !showing);
  }

  /**
   * Lee lo que se está escribiendo, sin interrumpir.
   *
   * El calendario sigue a una fecha en cuanto está completa, así que el mes
   * en pantalla coincide con el campo mientras todavía se está escribiendo.
   * Aquí no se protesta por nada: media fecha no es un error, es una fecha
   * que no está terminada.
   */
  protected onType(event: Event): void {
    const input = event.target as HTMLInputElement;

    // El texto pegado se lee antes de que la máscara lo toque. La máscara
    // agrupa dígitos como día/mes/año, así que un `2026-03-09` pegado se
    // convertiría en `20/26/0309` — una fecha distinta, en silencio.
    // Cualquier cosa que el analizador reconozca se toma tal cual y se
    // reescribe en el formato propio del campo.
    if ((event as InputEvent).inputType === 'insertFromPaste') {
      const pasted = parseDate(input.value);
      if (pasted) {
        this.parseError.set('');
        this.value.set(pasted);
        this.month.set(fromIso(pasted) ?? new Date());
        return;
      }
    }

    // Enmascarado antes de leerse: el campo solo llega a contener
    // `dd/mm/aaaa`, así que todo lo que viene después — la interpretación,
    // el valor, el mensaje — trabaja desde el mismo string que quien lee
    // puede ver.
    const typed = maskDateField(input);
    this.text.set(typed);

    if (!typed.trim()) {
      this.parseError.set('');
      this.value.set('');
      return;
    }

    // Solo una fecha COMPLETA se confirma mientras se escribe. Una parcial
    // se confirmaría de paso — `01/09/19` camino a `01/09/1997` — y
    // confirmar reescribe el campo a partir del valor, así que los dos
    // dígitos que todavía faltan llegarían a un campo que ya está lleno.
    if (!hasFullDate(typed)) {
      return;
    }

    const parsed = parseDate(typed);
    if (parsed) {
      this.parseError.set('');
      this.value.set(parsed);
      this.month.set(fromIso(parsed) ?? new Date());
    }
  }

  /** Deja que Backspace alcance el dígito detrás de un separador. */
  protected onKeydown(event: KeyboardEvent): void {
    absorbSeparatorBackspace(event);
  }

  /**
   * Salir es cuando el campo dice si entendió.
   *
   * El texto escrito se conserva en vez de revertirse: alguien que escribió
   * «31/02» tiene un error de dedo que corregir, y reemplazar su línea con
   * el valor anterior le quita tanto el error como la oportunidad de
   * corregirlo.
   */
  protected onLeave(): void {
    this.control.onBlur();
    const typed = this.text().trim();

    if (!typed) {
      this.parseError.set('');
      this.value.set('');
      return;
    }

    // Aquí, y solo aquí, se expande un año de dos cifras: `08/09/26`
    // significa 2026 para quien terminó de escribirlo, y no significa nada
    // en absoluto para quien todavía está escribiendo `1997`.
    const parsed = parseDate(typed);
    if (parsed) {
      this.parseError.set('');
      this.value.set(parsed);
      this.month.set(fromIso(parsed) ?? new Date());
      this.text.set(formatTyped(parsed));
      return;
    }
    this.parseError.set('No se entiende esa fecha. Escríbela como 31/12/2026.');
  }

  protected close(): void {
    this.open.set(false);
  }

  protected choose(iso: IsoDate): void {
    this.value.set(iso);
    this.parseError.set('');
    this.control.onBlur();
    this.close();
  }

  /** Cierra cuando un clic cae afuera, tal como hace cualquier otro overlay. */
  protected onDocumentClick(event: MouseEvent): void {
    const host = this.anchor()?.nativeElement.parentElement;
    const popup = this.popup()?.nativeElement;
    const target = event.target as Node;
    if (this.open() && !host?.contains(target) && !popup?.contains(target)) {
      this.close();
    }
  }
}
