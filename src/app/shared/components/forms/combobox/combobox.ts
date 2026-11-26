import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Combobox as AriaCombobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox as AriaListbox, Option } from '@angular/aria/listbox';
import { ControlError } from '@shared/models/form-control.model';
import { placeAnchored, watchAnchor } from '@shared/utils/anchored-position';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { normalise } from '@shared/utils/text';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Una entrada del catálogo detrás de un combobox. */
export interface ComboboxOption {
  readonly value: string;
  readonly label: string;

  /** Una segunda línea: el correo de un cliente, el código de un producto. */
  readonly hint?: string;

  readonly disabled?: boolean;
}

/** Espacio entre el campo y su lista. Más ajustado que el de un menú: se tocan. */
const POPUP_GAP = 4;

/**
 * Elegir una entrada de un catálogo demasiado largo para leerlo entero.
 *
 * Un `select` muestra todo y funciona hasta un par de decenas de opciones.
 * Pasado eso, la respuesta no es una lista más larga, es escribir parte del
 * nombre — que es un control distinto, con un teclado y una semántica
 * distintos.
 *
 * ## Lo que no hace
 *
 * **No acepta texto libre.** El valor que produce es el id de una entrada
 * real, así que un texto que no coincide con nada no es un valor: al salir,
 * el campo vuelve a mostrar lo que de verdad está seleccionado. Un ERP que
 * deja escribir «Industrias Vego» en un campo de cliente no guardó ningún
 * cliente.
 *
 * ## De dónde viene el comportamiento
 *
 * El teclado, la expansión y `aria-activedescendant` son de `ngCombobox` /
 * `ngListbox` de `@angular/aria`, de la misma forma que `tabs` y `accordion`
 * toman los suyos. Reconstruir eso a mano es donde estos controles se
 * rompen: las flechas son la parte fácil, y el hecho de que el campo
 * conserve el foco mientras la *lista* mueve su opción activa es la parte
 * en la que todos se equivocan.
 *
 * La lista se posiciona con `anchored-position`, compartida con
 * `dropdown-menu` y `tooltip`, y por la misma razón: un selector de
 * catálogo vive dentro de una tarjeta, una barra de herramientas o la celda
 * de una tabla, y todos esos recortan lo que se desborda.
 */
@Component({
  selector: 'app-combobox',
  imports: [AriaCombobox, AriaListbox, ComboboxPopup, ComboboxWidget, Field, Icon, Option],
  templateUrl: './combobox.html',
  styleUrl: './combobox.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'onEscape($event)',
    '(document:keydown.escape)': 'onEscape($event)',
  },
})
export class Combobox {
  /** Longitud mínima del texto antes de filtrar o solicitar resultados. */
  readonly minSearchLength = input(0);

  /** Espera en milisegundos antes de publicar el término escrito. */
  readonly debounceMs = input(0);

  /** Cantidad máxima de opciones mostradas cuando es mayor que cero. */
  readonly maxResults = input(0);

  /** Indica que el consumidor está consultando opciones remotas. */
  readonly loading = input(false);

  /** Emite el término normalizado al cumplirse la longitud mínima y la espera. */
  readonly searchRequested = output<string>();

  private readonly debouncedQuery = signal('');
  private readonly debouncing = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly searchMessage = computed(() => {
    if (this.query().trim().length < this.minSearchLength()) {
      return `Escribe al menos ${this.minSearchLength()} caracteres para buscar`;
    }

    if (this.loading() || this.debouncing()) return 'Buscando…';

    return this.emptyMessage();
  });

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.expanded()) {
      return;
    }
    const target = event.target as Node;
    const hostEl = this.host.nativeElement;
    const popupEl = this.popup()?.nativeElement;
    // Si el clic ocurrió fuera del control y fuera del desplegable
    if (!hostEl.contains(target) && !popupEl?.contains(target)) {
      this.close();
    }
  }

  protected onEscape(event: Event): void {
    if (this.expanded()) {
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  }

  private close(): void {
    this.expanded.set(false);
    this.removePopupFromBody();
  }

  private removePopupFromBody(): void {
    const popupEl = this.popup()?.nativeElement;
    if (popupEl && popupEl.parentElement === this.document.body) {
      popupEl.remove();
    }
  }

  readonly value = model('');

  readonly options = input<readonly ComboboxOption[]>([]);

  readonly label = input('');
  readonly hint = input('');
  readonly placeholder = input('Escribe para buscar…');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly comboboxId = input(nextElementId('combobox'));

  /** Nombre accesible para un combobox mostrado sin etiqueta visible. */
  readonly ariaLabel = input('');

  /** Lo que dice la lista cuando nada coincide. */
  readonly emptyMessage = input('Sin coincidencias');

  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  private readonly document = inject(DOCUMENT);
  private readonly anchor = viewChild<ElementRef<HTMLElement>>('anchor');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  private readonly control = useFormControl({
    id: this.comboboxId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  private readonly markTouched = this.control.onBlur;

  /** Lo que se escribe en el campo. No es el valor: el valor es un id. */
  protected readonly query = signal('');
  protected readonly expanded = signal(false);

  /**
   * Lo que la lista muestra como seleccionado, derivado y nunca escrito de
   * vuelta.
   *
   * El listbox toma un arreglo porque un listbox puede ser múltiple; este no
   * lo es, así que está vacío o guarda un id. **De una sola vía, a
   * propósito.** Ligado en ambas direcciones, el listbox se convierte en un
   * segundo dueño de la selección — y suelta su valor cada vez que la opción
   * seleccionada deja de renderizarse, que es exactamente lo que hace
   * filtrar. Escribir tres letras por eso borraba al cliente elegido:
   * medido, el campo pasaba de «Industrias Vega» a vacío con solo acotar la
   * lista.
   */
  protected readonly selectionArray = computed(() => (this.value() ? [this.value()] : []));

  protected readonly selected = computed(() =>
    this.options().find((option) => option.value === this.value()),
  );

  /**
   * Las entradas cuya etiqueta o pista contienen lo que se ha escrito.
   *
   * Mientras el campo muestra intacta la selección actual, se ofrece todo:
   * alguien que abre la lista para cambiar de opinión debe ver el catálogo,
   * no la única entrada que ya tiene.
   */
  protected readonly filtered = computed(() => {
    const typed = this.query().trim();

    if (this.disabled() || this.loading() || typed.length < this.minSearchLength()) {
      return [];
    }

    // Evita presentar resultados del texto anterior durante la espera.
    if (this.debounceMs() > 0 && typed !== this.debouncedQuery()) {
      return [];
    }

    const options = this.options();
    const needle = normalise(typed);

    const matches =
      !typed || typed === this.selected()?.label
        ? options
        : options.filter(
            (option) =>
              normalise(option.label).includes(needle) ||
              (option.hint ? normalise(option.hint).includes(needle) : false),
          );

    const limit = Math.max(0, Math.floor(this.maxResults()));
    return limit > 0 ? matches.slice(0, limit) : matches;
  });

  private unwatch: (() => void) | null = null;

  constructor() {
    // El campo muestra la etiqueta de la selección, y la sigue cuando el
    // valor se cambia desde afuera.
    effect(() => {
      const label = this.selected()?.label ?? '';
      untracked(() => this.query.set(label));
    });

    /**
     * Se posiciona después del render que crea la lista, nunca durante él.
     *
     * El popup no existe hasta que `expanded` es verdadero y Angular ya lo
     * dibujó, así que medirlo en un `computed` o en un `effect` normal lee
     * una caja que todavía no se ha dispuesto — la misma trampa que dejaba
     * el panel de un gráfico 28 px afuera en la fase 3.
     */
    afterRenderEffect(() => {
      const open = this.expanded();
      const popup = this.popup()?.nativeElement;
      const anchor = this.anchor()?.nativeElement;
      const view = this.document.defaultView;

      this.unwatch?.();
      this.unwatch = null;

      if (!open || !popup || !anchor || !view) {
        if (!open && popup && popup.parentElement === this.document.body) {
          popup.remove();
        }
        return;
      }

      const body = this.document.body;
      if (body && popup.parentElement !== body) {
        body.appendChild(popup);
      }

      const place = () => {
        const anchorRect = anchor.getBoundingClientRect();
        // Si el ancla ya no está visible (el modal se cerró o se ocultó)
        if (anchorRect.width === 0 && anchorRect.height === 0) {
          this.close();
          return;
        }
        popup.style.width = `${Math.round(anchorRect.width)}px`;
        placeAnchored(popup, anchor, view, {
          placement: 'bottom-start',
          gap: POPUP_GAP,
          clampHeight: true,
        });
      };

      place();
      const stopAnchor = watchAnchor(view, place);
      const resizeObserver = new ResizeObserver(() => place());
      resizeObserver.observe(popup);
      this.unwatch = () => {
        resizeObserver.disconnect();
        stopAnchor();
      };
    });

    // Aplica el retraso y emite el término cuando alcanza la longitud mínima.
    effect((onCleanup) => {
      const term = this.query().trim();
      const minimum = Math.max(0, this.minSearchLength());
      const delay = Math.max(0, this.debounceMs());

      if (this.disabled() || term.length < minimum) {
        this.debouncedQuery.set('');
        this.debouncing.set(false);
        return;
      }

      const publish = () => {
        this.debouncedQuery.set(term);
        this.debouncing.set(false);

        // El consumidor decide cómo obtener los datos; Combobox no conoce APIs.
        untracked(() => this.searchRequested.emit(term));
      };

      if (delay === 0) {
        publish();
        return;
      }

      this.debouncing.set(true);
      const timeout = setTimeout(publish, delay);
      onCleanup(() => clearTimeout(timeout));
    });

    inject(DestroyRef).onDestroy(() => {
      this.unwatch?.();
      this.popup()?.nativeElement.remove();
    });
  }

  /**
   * Escribir abre la lista.
   *
   * El texto en sí no se lee aquí: `ngCombobox` es dueño del valor del campo
   * y lo escribe de vuelta a través del binding bidireccional, así que
   * tomarlo también del evento sería un segundo escritor para un mismo
   * estado.
   */
  protected onInput(): void {
    this.expanded.set(true);
  }

  /** El id que se le da a cada opción, para poder mapear de vuelta a la activa. */
  protected optionId(value: string): string {
    return `${this.comboboxId()}-opt-${value}`;
  }

  /**
   * Enter elige lo que las flechas dejaron activo.
   *
   * En modo `explicit` el listbox selecciona con Espacio, que un combobox no
   * puede usar: el campo es un campo de texto y Espacio le pertenece al
   * texto. Enter es la tecla que las prácticas ARIA nombran para esto, y
   * nada más la reclama aquí.
   */
  protected onEnter(event: Event): void {
    // Se lee del propio `aria-activedescendant` del campo en vez de la
    // instancia del listbox. Es el mismo dato — la directiva lo publica ahí
    // para la tecnología asistiva — y es la copia que demostrablemente
    // existe: el listbox vive dentro de la plantilla diferida del popup, y
    // un `viewChild` para él regresaba `undefined` en el momento en que
    // Enter lo necesitaba.
    const active = (event.target as HTMLElement).getAttribute('aria-activedescendant');
    if (!active) {
      return;
    }
    this.choose(this.filtered().find((entry) => this.optionId(entry.value) === active));
  }

  /**
   * Confirma una elección. El único lugar donde se escribe el valor.
   *
   * Las dos vías de entrada — Enter y un clic — terminan aquí, así que hay
   * una sola respuesta a «qué pasa cuando se elige una entrada» en vez de
   * dos que tienen que coincidir.
   */
  protected choose(option: ComboboxOption | undefined): void {
    if (!option || option.disabled) {
      return;
    }
    this.value.set(option.value);
    this.expanded.set(false);
  }

  /**
   * Salir devuelve lo que en realidad está seleccionado.
   *
   * Un texto a medio escribir que se queda en un campo que produce un id es
   * una mentira sobre el estado: se lee como si «Industrias Veg» estuviera
   * elegido cuando no lo está nada.
   */
  protected onBlur(): void {
    this.markTouched();
    this.query.set(this.selected()?.label ?? '');
  }

  /** Conserva el foco del texto hasta que el clic confirma una opción. */
  protected preserveInputFocus(event: MouseEvent): void {
    if (event.button === 0) {
      event.preventDefault();
    }
  }

  /** Alterna el desplegable y devuelve el foco al campo para seguir escribiendo. */
  protected toggle(): void {
    if (this.disabled()) return;

    this.anchor()
      ?.nativeElement.querySelector<HTMLInputElement>('input')
      ?.focus({ preventScroll: true });

    this.expanded.update((open) => !open);
  }
}
