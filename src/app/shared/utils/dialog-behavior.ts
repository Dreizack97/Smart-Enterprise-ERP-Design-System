import {
  DOCUMENT,
  DestroyRef,
  ElementRef,
  ModelSignal,
  Signal,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { ScrollLock } from '@core/services/scroll-lock';

/** A qué tiene que poder llegar una superficie modal. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface DialogInputs {
  /** Si la superficie se está mostrando. Se escribe cuando se cierra sola. */
  readonly open: ModelSignal<boolean>;

  /** El elemento que contiene el contenido del diálogo y recibe el foco. */
  readonly panel: Signal<ElementRef<HTMLElement> | undefined>;

  /** Un diálogo destructivo o un formulario a medio llenar no debe cerrarse por accidente. */
  readonly dismissible: Signal<boolean>;

  /**
   * Qué control recibe el foco al abrirse. Por defecto, el primero.
   *
   * Una confirmación destructiva lo sobrescribe para enfocar la opción
   * **segura**: caer sobre «Eliminar» significa que un Enter accidental
   * borra justo aquello sobre lo que el diálogo existe para preguntar.
   */
  readonly initialFocus?: () => HTMLElement | null | undefined;
}

export interface DialogBehavior {
  /** Cierra, si la superficie permite descartarse. Conectar a Escape y a ✕. */
  readonly requestClose: () => void;

  /** Cierra ante un clic que empezó y terminó en el fondo (backdrop). */
  readonly onOverlayClick: (event: MouseEvent) => void;

  /** Mantiene el Tab dentro del panel. Conectar al `(keydown)` del panel. */
  readonly onTab: (event: KeyboardEvent) => void;
}

/**
 * Todo lo que una superficie modal tiene que hacer además de verse a sí
 * misma.
 *
 * `modal`, `confirm-dialog` y `drawer` difieren en forma, en de dónde vienen
 * y para qué son — y coinciden por completo en las cuatro cosas que las
 * hacen usables: atrapar el foco, sostener el bloqueo de scroll, responder a
 * Escape, y devolver el foco a lo que sea que las abrió. Esa lista no es una
 * coincidencia para re-derivarse por componente; equivocarse sutilmente en
 * cualquiera de las cuatro produce un diálogo que se ve perfecto y deja
 * varado a un usuario de teclado en la página de atrás.
 *
 * Se extrajo cuando llegó `drawer`, en vez de copiarse dentro de él — el
 * mismo razonamiento que convirtió a `popover` en `anchored-position` un
 * lote antes. Extraerlo encontró de inmediato un hueco: `confirm-dialog`
 * tenía el bloqueo y la devolución del foco pero **ninguna trampa de foco en
 * absoluto**, así que Tab caminaba directo hacia afuera de un diálogo
 * `aria-modal` y hacia la página que este cubría.
 *
 * Lo que el helper NO posee es qué significa cada superficie.
 * `confirm-dialog` conserva sus propias rutas de cierre, porque cerrarlo
 * tiene que decir si fue aceptado o cancelado, y esa es una pregunta sobre
 * el diálogo, no sobre los diálogos en general.
 *
 * Debe llamarse en un contexto de inyección.
 */
export function useDialog(inputs: DialogInputs): DialogBehavior {
  const document = inject(DOCUMENT);
  const scrollLock = inject(ScrollLock);

  let previouslyFocused: HTMLElement | null = null;
  let holdsLock = false;

  const focusableElements = (): HTMLElement[] => {
    const root = inputs.panel()?.nativeElement;
    if (!root) {
      return [];
    }
    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => !element.hasAttribute('disabled') && element.offsetParent !== null,
    );
  };

  /** Idempotente: una superficie nunca toma ni libera el bloqueo dos veces. */
  const setLock = (locked: boolean): void => {
    if (locked === holdsLock) {
      return;
    }
    holdsLock = locked;
    if (locked) {
      scrollLock.lock();
    } else {
      scrollLock.release();
    }
  };

  const captureFocus = (): void => {
    previouslyFocused = document.activeElement as HTMLElement | null;
    // El panel apenas se hizo visible; esperar un frame evita que `focus()`
    // caiga sobre algo que todavía no se ha pintado.
    document.defaultView?.requestAnimationFrame(() => {
      const preferred = inputs.initialFocus?.();
      const focusables = focusableElements();
      (preferred ?? focusables[0] ?? inputs.panel()?.nativeElement)?.focus();
    });
  };

  const restoreFocus = (): void => {
    previouslyFocused?.focus();
    previouslyFocused = null;
  };

  effect(() => {
    const isOpen = inputs.open();
    untracked(() => {
      setLock(isOpen);
      if (isOpen) {
        captureFocus();
      } else {
        restoreFocus();
      }
    });
  });

  // Sin esto, una superficie destruida mientras está abierta dejaría la página congelada.
  inject(DestroyRef).onDestroy(() => setLock(false));

  return {
    requestClose: () => {
      if (inputs.dismissible()) {
        inputs.open.set(false);
      }
    },

    onOverlayClick: (event: MouseEvent) => {
      if (event.target === event.currentTarget && inputs.dismissible()) {
        inputs.open.set(false);
      }
    },

    /**
     * Hace ciclar el foco dentro del panel: sin esto, tabular saca el foco
     * hacia el contenido de atrás, que para un lector de pantalla sigue ahí.
     */
    onTab: (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusables = focusableElements();
      if (focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
  };
}
