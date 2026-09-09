import {
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import {
  OverlayAlign,
  OverlaySide,
  placeAnchored,
  resolveAnchor,
  watchAnchor,
} from '@shared/utils/anchored-position';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Dónde se sienta el panel.
 *
 * Un dropdown nunca se centra en su disparador — se alinea con uno u otro
 * borde — así que esto es el posicionamiento compartido acotado a las dos
 * alineaciones que aquí tienen sentido.
 */
export type DropdownPlacement = `${OverlaySide}-${Exclude<OverlayAlign, 'center'>}`;

/** Una acción de un `app-dropdown-menu` en su variante de menú. */
export interface DropdownMenuItem {
  readonly label: string;
  readonly icon?: IconName;

  /** Convierte la entrada en un enlace en vez de un botón. */
  readonly href?: string;

  /** Acciones destructivas: pintadas en el matiz de peligro y agrupadas al final. */
  readonly danger?: boolean;

  readonly disabled?: boolean;
}

/** Marca una línea divisoria entre grupos de acciones. */
export const MENU_SEPARATOR = 'separator' as const;

/** Una entrada de menú: una acción o un separador. */
export type DropdownMenuEntry = DropdownMenuItem | typeof MENU_SEPARATOR;

/**
 * `menu` para una lista de acciones; `panel` para contenido libre, como la
 * bandeja de notificaciones. La semántica de menú exige que todo lo de
 * adentro sea un `menuitem`, y una lista de avisos no lo es.
 *
 * Llamado `variant` y no `role` a propósito: un input llamado `role`
 * también sobreviviría como atributo literal en el host, y el árbol de
 * accesibilidad terminaría con un diálogo fantasma envolviendo al
 * disparador.
 */
export type DropdownVariant = 'menu' | 'panel';

/**
 * Un panel de dropdown anclado a su propio disparador.
 *
 * El disparador se proyecta en el slot `trigger`, dentro del componente. No
 * es un capricho: cerrar ante un clic fuera comprueba si el clic cayó dentro
 * del host, y con el botón afuera cada consumidor tendría que envolverlo a
 * mano en un contenedor posicionado y acertarle. Aquí el componente es el
 * ancla.
 *
 * Sirve a dos propósitos distintos según lo que reciba:
 * - `items`, y pinta una lista de acciones con desplazamiento por teclado;
 * - contenido proyectado, y solo aporta el panel, la posición y el
 *   comportamiento de cierre.
 *
 * El panel se oculta por clase, no se desmonta, para que su salida pueda
 * animar.
 *
 * ## Posicionamiento
 *
 * El panel se posiciona desde la caja del *disparador*, no la del host. El
 * host es un bloque: en una celda angosta es tan ancho como el botón, en una
 * ancha llena la columna, y anclarse a él producía dos bugs distintos de una
 * sola causa — un menú anclado a la derecha de un host de 96px se salía por
 * el borde izquierdo de la pantalla, y una bandeja anclada a la derecha de
 * un host de 519px se abría a 185px de la campana que era su dueña.
 *
 * `placement` es una preferencia, no una orden: cuando el lugar preferido no
 * cabe, el panel se voltea al opuesto, y si ninguno cabe se recorta al
 * viewport y se le da una altura con scroll. Eso es lo que hace que se
 * comporte bien tanto en un teléfono como junto a la fila de una tabla.
 */
@Component({
  selector: 'app-dropdown-menu',
  imports: [Icon],
  templateUrl: './dropdown-menu.html',
  styleUrl: './dropdown-menu.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class DropdownMenu {
  /**
   * Si el panel se está mostrando.
   *
   * Un `model()` porque el componente se cierra solo cuando se elige una
   * acción, cuando un clic cae afuera y con `Escape`.
   */
  readonly open = model(false);

  /** Acciones. Vacío cuando el panel solo lleva contenido proyectado. */
  readonly items = input<readonly DropdownMenuEntry[]>([]);

  /**
   * Ancho del panel, como longitud CSS.
   *
   * El original tomaba un string de clases de Tailwind, que dejaba a
   * cualquier llamador meterse a reestilizar el panel; esto solo fija lo
   * que dice que fija.
   */
  readonly width = input('');

  /** Semántica del panel, que decide su rol ARIA y el desplazamiento por teclado. */
  readonly variant = input<DropdownVariant>('menu');

  /**
   * Posición preferida, como lado más el borde del disparador con el que
   * alinearse.
   *
   * Una preferencia, no una orden: el panel se voltea cuando el lugar
   * preferido no cabe. Un solo input en vez de dos llamados `align` y
   * `side`, porque `align` es un atributo HTML presentacional heredado —
   * escrito de forma estática se queda en el host y los navegadores lo
   * aplican como `text-align`, que desplazaba en silencio al disparador
   * proyectado hacia el otro extremo del host. La misma trampa que el input
   * `variant` ya evita al no llamarse `role`.
   */
  readonly placement = input<DropdownPlacement>('bottom-start');

  /** Nombre accesible del menú, para cuando el disparador es solo un icono. */
  readonly label = input('');

  /**
   * La acción elegida.
   *
   * Un `output()` y no un `model()`, que es lo que usaba el original. Dos
   * razones, y la segunda es la que muerde:
   *
   * 1. Elegir una acción es un evento, no estado bidireccional. Un
   *    `model()` además nombra a su emisor `selectedChange`, así que el
   *    binding obvio `(selected)` se convierte en silencio en un listener
   *    de un evento del DOM que nunca se dispara.
   * 2. Un signal solo notifica cuando el valor cambia. Elegir la misma
   *    entrada dos veces seguidas escribe la misma referencia de objeto, así
   *    que la segunda elección no emitía absolutamente nada.
   */
  readonly selected = output<DropdownMenuItem>();

  /** Expone el separador a la plantilla, que compara entradas contra él. */
  protected readonly separator = MENU_SEPARATOR;

  protected readonly ariaRole = computed(() => (this.variant() === 'menu' ? 'menu' : 'dialog'));

  /** Dónde terminó cayendo el panel en realidad. Gobierna el `transform-origin`. */
  protected readonly resolvedPlacement = signal<DropdownPlacement>('bottom-start');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly entries = viewChildren<ElementRef<HTMLElement>>('menuEntry');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => {
      const isOpen = this.open();
      // Se lee aquí a propósito: cambiar la preferencia mientras el panel está
      // abierto debe moverlo.
      this.placement();
      if (isOpen) {
        this.reposition();
      }
      this.watchViewport(isOpen);
    });

    inject(DestroyRef).onDestroy(() => this.watchViewport(false));
  }

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  /**
   * Abre y, para un menú de acciones, deja el foco en la primera opción, que
   * es lo que espera alguien que lo abrió con Enter o con Espacio.
   *
   * El foco se difiere al siguiente tick porque un clic de mouse enfoca al
   * disparador después de que este manejador corre; hacerlo antes lo
   * perdería. Un panel de contenido (`dialog`) no roba el foco: no hay
   * lista de opciones adentro.
   */
  openMenu(): void {
    this.open.set(true);
    if (this.variant() !== 'menu') {
      return;
    }
    setTimeout(() => this.entries()[0]?.nativeElement.focus());
  }

  /**
   * Cierra y devuelve el foco al disparador.
   *
   * Sin esto, cerrar por teclado dejaría el foco sobre un elemento que
   * acaba de ocultarse, y tabular reiniciaría desde el principio del
   * documento.
   */
  close(returnFocus = false): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    if (returnFocus) {
      this.trigger()?.focus();
    }
  }

  protected isItem(entry: DropdownMenuEntry): entry is DropdownMenuItem {
    return entry !== MENU_SEPARATOR;
  }

  protected choose(item: DropdownMenuItem): void {
    if (item.disabled) {
      return;
    }
    this.selected.emit(item);
    this.close();
  }

  /**
   * Un menú abierto es modal en la práctica: cualquier clic afuera lo
   * cierra, incluido un clic sobre su propio disparador, que además lo
   * alterna.
   */
  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /**
   * `Escape` se escucha en el documento, no en el host: el foco pudo haber
   * terminado fuera del panel, y el dropdown se quedaría abierto sin forma
   * de cerrarlo desde el teclado.
   */
  protected onEscape(): void {
    this.close(true);
  }

  /**
   * La posición se resuelve a partir del elemento enfocado, no del índice
   * del bucle: ese índice también cuenta separadores, que no son
   * enfocables.
   */
  protected onKeydown(event: KeyboardEvent): void {
    const focusable = this.entries().map((entry) => entry.nativeElement);
    if (focusable.length === 0) {
      return;
    }

    const current = focusable.indexOf(event.target as HTMLElement);
    const last = focusable.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusable[(current + 1) % focusable.length].focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusable[(current - 1 + focusable.length) % focusable.length].focus();
        break;
      case 'Home':
        event.preventDefault();
        focusable[0].focus();
        break;
      case 'End':
        event.preventDefault();
        focusable[last].focus();
        break;
      default:
        break;
    }
  }

  /** El disparador proyectado, encontrado por el atributo que lo marca como tal. */
  private trigger(): HTMLElement | null {
    const marked = this.host.nativeElement.querySelector<HTMLElement>('[trigger]');
    return marked ? resolveAnchor(marked) : null;
  }

  /**
   * Coloca el panel contra el disparador.
   *
   * La aritmética — volteo, recorte, el margen del viewport — vive en
   * `anchored-position`, compartida con el tooltip. Lo que se queda aquí es
   * lo particular de un menú: se le permite crecer una barra de scroll en
   * vez de moverse, porque una lista de acciones se puede desplazar y una
   * pista no.
   */
  private reposition(): void {
    const view = this.document.defaultView;
    const trigger = this.trigger();
    if (!view || !trigger) {
      return;
    }

    const landed = placeAnchored(this.panel().nativeElement, trigger, view, {
      placement: this.placement(),
      clampHeight: true,
    });

    this.resolvedPlacement.set(landed as DropdownPlacement);
  }

  /** Detiene los listeners del viewport que instaló la primitiva. Nulo mientras está cerrado. */
  private unwatch: (() => void) | null = null;

  private watchViewport(active: boolean): void {
    this.unwatch?.();
    this.unwatch = null;

    const view = this.document.defaultView;
    if (active && view) {
      this.unwatch = watchAnchor(view, () => this.reposition());
    }
  }
}
