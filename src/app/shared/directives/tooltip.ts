import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';
import {
  OverlaySide,
  placeAnchored,
  resolveAnchor,
  watchAnchor,
} from '@shared/utils/anchored-position';

/** De qué lado del ancla aparece la burbuja. */
export type TooltipPlacement = OverlaySide;

/**
 * Texto de ayuda sobre el elemento que la porta.
 *
 * Es una directiva y no un componente a propósito: la descripción tiene que
 * caer sobre el control real, no sobre una caja envuelta alrededor, o el
 * lector de pantalla no la asocia con nada.
 *
 * Se abre tanto con foco como con hover — un texto que solo aparece bajo el
 * cursor no existe para alguien que navega con teclado — y se cierra con
 * Escape sin mover el foco, tal como exige WCAG 1.4.13.
 *
 * ## El ancla
 *
 * La directiva se puede aplicar sobre un elemento simple o sobre un
 * componente. El host de un componente suele ser `display: contents`
 * (`app-button` lo es, para que el botón participe directamente del layout de
 * su padre), y un host así no genera caja alguna: no puede ser un contexto de
 * posicionamiento y nunca recibe eventos de puntero propios. Aplicada ahí, la
 * versión anterior dejaba la burbuja a cientos de píxeles del control y nunca
 * se abría con hover.
 *
 * Por eso la directiva resuelve un *ancla*: el host cuando este renderiza una
 * caja, y si no, el elemento interactivo que tiene adentro. Tanto la burbuja
 * como `aria-describedby` se atan al ancla, que es el elemento al que una
 * persona realmente apunta y que un lector de pantalla realmente anuncia.
 *
 * ## Dónde vive la burbuja
 *
 * En el `body` del documento, posicionada con la misma primitiva que usa el
 * dropdown. Antes era hija del ancla, posicionada de forma absoluta, y eso
 * traía dos defectos que solo se notaban en los lugares donde los tooltips de
 * verdad aparecen:
 *
 * - **Recorte.** Cualquier ancestro con `overflow: hidden` —una tarjeta, el
 *   contenedor de una tabla, el riel del sidebar— cortaba la burbuja, y ni el
 *   ancla ni la burbuja tenían forma de saberlo.
 * - **Sin conciencia del borde.** Una pista sobre un control cerca del borde
 *   derecho de la ventana se salía de la pantalla, porque la regla anterior
 *   la centraba sobre el ancla y ahí se detenía.
 *
 * Moverla al `body` y a `position: fixed` corrige ambas cosas, y trae consigo
 * el volteo: una burbuja sin espacio arriba ahora se abre abajo. Tiene que
 * ser el `body` y no el ancla, porque los botones del sistema se elevan con
 * `transform` al hacer hover, y un ancestro transformado se convierte en el
 * bloque contenedor de un descendiente `fixed` — la burbuja habría quedado
 * posicionada contra el mismísimo botón del que intentaba escapar.
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    // `mouseover` / `mouseout` y no `mouseenter` / `mouseleave`: estos últimos
    // no burbujean, así que un host sin caja nunca los escucha desde el
    // control renderizado adentro.
    '(mouseover)': 'show()',
    '(mouseout)': 'onPointerOut($event)',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
  },
})
export class Tooltip {
  /** El texto de la burbuja. También nombra el selector de la directiva. */
  readonly appTooltip = input.required<string>();

  readonly tooltipPlacement = input<TooltipPlacement>('top');

  /** Id de la burbuja, referenciado por `aria-describedby`. */
  readonly tooltipId = input(nextElementId('tooltip'));

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly bubble = this.renderer.createElement('span') as HTMLElement;
  private anchor: HTMLElement | null = null;
  private unwatch: (() => void) | null = null;

  protected readonly visible = signal(false);

  constructor() {
    this.renderer.setAttribute(this.bubble, 'role', 'tooltip');
    this.renderer.setAttribute(this.bubble, 'class', 'app-tooltip');
    this.bubble.hidden = true;

    effect(() => {
      this.renderer.setAttribute(this.bubble, 'id', this.tooltipId());
      this.renderer.setProperty(this.bubble, 'textContent', this.appTooltip());

      const showing = this.visible();
      this.bubble.hidden = !showing;
      this.describe(showing);
      this.track(showing);
    });

    inject(DestroyRef).onDestroy(() => {
      this.track(false);
      this.bubble.remove();
    });
  }

  protected show(): void {
    this.attach();
    this.visible.set(true);
  }

  protected hide(): void {
    this.visible.set(false);
  }

  /**
   * `mouseout` se dispara cuando el puntero cruza entre descendientes de la
   * misma ancla. Sin esta guarda, la burbuja parpadearía cuando el puntero se
   * mueve de la etiqueta de un botón a su icono.
   */
  protected onPointerOut(event: MouseEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.anchor?.contains(next)) {
      this.hide();
    }
  }

  /**
   * Se resuelve en el primer uso, nunca en el constructor: cuando el host es
   * un componente, su vista todavía no se ha renderizado al momento de
   * construirse, y el control al que anclar no existe todavía.
   */
  private attach(): void {
    if (this.anchor) {
      return;
    }
    this.anchor = resolveAnchor(this.host);
    this.renderer.appendChild(this.document.body, this.bubble);
  }

  /** Posiciona la burbuja ahora, y la mantiene ahí mientras el viewport se mueve. */
  private track(showing: boolean): void {
    this.unwatch?.();
    this.unwatch = null;

    if (!showing) {
      return;
    }

    const view = this.document.defaultView;
    const anchor = this.anchor;
    if (!view || !anchor) {
      return;
    }

    const place = () => {
      const landed = placeAnchored(this.bubble, anchor, view, {
        placement: `${this.tooltipPlacement()}-center`,
        gap: TOOLTIP_GAP,
      });
      // La entrada asciende hacia el ancla, así que necesita saber hacia dónde
      // queda una vez que el volteo ya se decidió.
      this.renderer.setAttribute(this.bubble, 'data-placement', landed);
    };

    place();
    this.unwatch = watchAnchor(view, place);
  }

  private describe(showing: boolean): void {
    const target = this.anchor;
    if (!target) {
      return;
    }
    if (showing) {
      this.renderer.setAttribute(target, 'aria-describedby', this.tooltipId());
    } else {
      this.renderer.removeAttribute(target, 'aria-describedby');
    }
  }
}

/** Espacio libre entre el control y su burbuja. */
const TOOLTIP_GAP = 8;
