/**
 * Coloca un elemento flotante contra un ancla, volteándose y ajustándose para
 * caber.
 *
 * Esta es la base compartida que el plan llama `popover`. Resultó **no** ser
 * un componente: lo que `dropdown-menu` y `tooltip` tienen en común no es un
 * panel —sus superficies, su semántica y el gesto que los abre difieren
 * todos— es la aritmética de «pon esta caja junto a esa otra, y haz algo
 * razonable cuando no quepa». Un componente habría forzado a que el tooltip
 * dejara de ser una directiva, y tiene que serlo para que `aria-describedby`
 * caiga sobre el control real y no sobre un envoltorio.
 *
 * ## Por qué posicionamiento fijo
 *
 * Un panel posicionado de forma absoluta se recorta contra el primer
 * ancestro con `overflow: hidden` —una tarjeta, el contenedor de una tabla,
 * el sidebar— y el panel no tiene forma de saberlo. El posicionamiento fijo
 * lo saca de ese flujo por completo; el costo es que la posición hay que
 * recalcularla mientras el viewport se mueve, de lo que se encarga
 * `watchAnchor`.
 *
 * Una advertencia que quien llama debe respetar: `transform`, `filter` y
 * `contain` en un ancestro convierten a ese ancestro en el bloque contenedor
 * de un descendiente `fixed`. Los botones del sistema se elevan con
 * `transform` al hacer hover, así que un panel anclado a un botón no puede
 * vivir dentro de él.
 */

/** De qué lado del ancla se abre el panel. */
export type OverlaySide = 'top' | 'bottom';

/** Con qué parte del ancla se alinea el panel. */
export type OverlayAlign = 'start' | 'center' | 'end';

/** Un lado más una alineación, por ejemplo `bottom-start`. */
export type OverlayPlacement = `${OverlaySide}-${OverlayAlign}`;

export interface AnchorOptions {
  /** El lugar preferido. Es una preferencia: se voltea cuando no cabe. */
  readonly placement: OverlayPlacement;

  /** Espacio libre entre el ancla y el panel. */
  readonly gap?: number;

  /** Espacio libre que se conserva respecto a los bordes del viewport. */
  readonly gutter?: number;

  /**
   * Le da al panel un `max-height` cuando el lado elegido queda corto de
   * espacio.
   *
   * Correcto para un menú, que puede hacer scroll. Incorrecto para un
   * tooltip: una burbuja con barra de scroll es peor que una burbuja que se
   * movió de lugar.
   */
  readonly clampHeight?: boolean;

  /** Por debajo de esto, un panel recortado queda demasiado corto para valer la pena mostrarlo ahí. */
  readonly minHeight?: number;
}

const DEFAULTS = { gap: 8, gutter: 8, clampHeight: false, minHeight: 120 } as const;

/**
 * Posiciona `panel` contra `anchor` y devuelve dónde terminó cayendo.
 *
 * El valor de retorno no es decorativo: quien llama lo necesita para apuntar
 * el `transform-origin` del panel —y, en un tooltip, su flecha— hacia el
 * ancla de la que vino. Un panel que se voltea hacia arriba mientras crece
 * hacia abajo se lee como un glitch.
 */
export function placeAnchored(
  panel: HTMLElement,
  anchor: HTMLElement,
  view: Window,
  options: AnchorOptions,
): OverlayPlacement {
  const { gap, gutter, clampHeight, minHeight } = { ...DEFAULTS, ...options };

  // Se mide sin restricciones: un max-height que quedó de la posición anterior
  // reduciría la lectura y el panel se iría arrastrando hacia el ancla.
  if (clampHeight) {
    panel.style.maxHeight = '';
  }

  const box = anchor.getBoundingClientRect();
  const width = panel.offsetWidth;
  const height = panel.offsetHeight;
  const viewportWidth = view.innerWidth;
  const viewportHeight = view.innerHeight;

  const [preferredSide, preferredAlign] = splitPlacement(options.placement);

  // --- Horizontal: el borde preferido, volteado solo si el otro cabe mejor.
  const lefts: Record<OverlayAlign, number> = {
    start: box.left,
    center: box.left + box.width / 2 - width / 2,
    end: box.right - width,
  };

  let align = preferredAlign;
  let left = lefts[align];

  if (align === 'start' && left + width > viewportWidth - gutter && lefts.end >= gutter) {
    align = 'end';
    left = lefts.end;
  } else if (align === 'end' && left < gutter && lefts.start + width <= viewportWidth - gutter) {
    align = 'start';
    left = lefts.start;
  }

  left = clamp(left, gutter, viewportWidth - width - gutter);

  // --- Vertical: el lado que tenga espacio, prefiriendo el solicitado.
  const roomBelow = viewportHeight - box.bottom - gap - gutter;
  const roomAbove = box.top - gap - gutter;
  let side = preferredSide;

  if (side === 'bottom' && height > roomBelow && roomAbove > roomBelow) {
    side = 'top';
  } else if (side === 'top' && height > roomAbove && roomBelow > roomAbove) {
    side = 'bottom';
  }

  const available = Math.max(minHeight, side === 'bottom' ? roomBelow : roomAbove);
  const top = side === 'bottom' ? box.bottom + gap : box.top - gap - Math.min(height, available);

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(clamp(top, gutter, viewportHeight - gutter))}px`;
  if (clampHeight) {
    panel.style.maxHeight = `${Math.round(available)}px`;
  }

  return `${side}-${align}`;
}

/**
 * Mantiene una posición sincronizada con el viewport mientras esté abierta.
 *
 * El scroll se escucha **en fase de captura**: un contenedor con scroll entre
 * el ancla y el documento no burbujea su evento de scroll, así que el panel
 * se iría alejando de un ancla que se movió debajo de él.
 *
 * Devuelve la función que lo detiene — quien llama es dueño del ciclo de
 * vida, porque solo quien llama sabe cuándo se cierra su overlay.
 */
export function watchAnchor(view: Window, reposition: () => void): () => void {
  view.addEventListener('scroll', reposition, { capture: true, passive: true });
  view.addEventListener('resize', reposition, { passive: true });

  return () => {
    view.removeEventListener('scroll', reposition, { capture: true });
    view.removeEventListener('resize', reposition);
  };
}

/**
 * El elemento que hay que medir y al que hay que devolver el foco.
 *
 * Un disparador suele ser un componente cuyo host es `display: contents`, y
 * un host así no tiene caja alguna: medirlo devuelve ceros y enfocarlo no
 * hace nada. El control real de adentro es lo que ambas operaciones
 * necesitan.
 */
export function resolveAnchor(candidate: HTMLElement): HTMLElement {
  if (candidate.getClientRects().length > 0) {
    return candidate;
  }
  return (
    candidate.querySelector<HTMLElement>('button, a[href], input, select, textarea, [tabindex]') ??
    candidate
  );
}

function splitPlacement(placement: OverlayPlacement): [OverlaySide, OverlayAlign] {
  const [side, align] = placement.split('-');
  return [side as OverlaySide, align as OverlayAlign];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(min, value), Math.max(min, max));
}
