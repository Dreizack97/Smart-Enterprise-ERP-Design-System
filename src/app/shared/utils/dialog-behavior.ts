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

/** Pila global de diálogos abiertos; solo el último en abrirse responde a Escape. */
const openDialogStack: symbol[] = [];

export interface DialogInputs {
  /** Si la superficie se está mostrando. Se escribe cuando se cierra sola. */
  readonly open: ModelSignal<boolean>;

  /** El elemento que contiene el contenido del diálogo y recibe el foco. */
  readonly panel: Signal<ElementRef<HTMLElement> | undefined>;

  /** Un diálogo destructivo o un formulario a medio llenar no debe cerrarse por accidente. */
  readonly dismissible: Signal<boolean>;

  /** Callback opcional invocado cuando se intenta cerrar el diálogo mientras `dismissible` es `false`. */
  readonly onDismissBlocked?: () => void;

  /** Acción ejecutada al presionar Escape cuando este diálogo está en la cima de la pila. */
  readonly onEscape?: () => void;

  /** Qué control recibe el foco al abrirse. Por defecto, el primero. */
  readonly initialFocus?: () => HTMLElement | null | undefined;
}

export interface DialogBehavior {
  /** Cierra, si la superficie permite descartarse. Conectar a ✕ y botones de cancelar. */
  readonly requestClose: () => void;

  /** Cierra ante un clic que empezó y terminó en el fondo (backdrop). */
  readonly onOverlayClick: (event: MouseEvent) => void;

  /** Mantiene el Tab dentro del panel. Conectar al `(keydown)` del panel. */
  readonly onTab: (event: KeyboardEvent) => void;
}

/** Coordina foco, bloqueo de scroll y Escape para la superficie superior de la pila. */
export function useDialog(inputs: DialogInputs): DialogBehavior {
  const document = inject(DOCUMENT);
  const scrollLock = inject(ScrollLock);
  const dialogId = Symbol('dialog');

  let previouslyFocused: HTMLElement | null = null;
  let holdsLock = false;
  let focusGeneration = 0;

  const focusableElements = (): HTMLElement[] => {
    const root = inputs.panel()?.nativeElement;
    if (!root) {
      return [];
    }
    return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => !element.hasAttribute('disabled') && element.offsetParent !== null,
    );
  };

  const pushToStack = (): void => {
    if (!openDialogStack.includes(dialogId)) {
      openDialogStack.push(dialogId);
    }
  };

  const removeFromStack = (): void => {
    const idx = openDialogStack.indexOf(dialogId);
    if (idx !== -1) {
      openDialogStack.splice(idx, 1);
    }
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
    const generation = ++focusGeneration;
    previouslyFocused = document.activeElement as HTMLElement | null;
    // Dos frames garantizan que la clase `.is-open` (visibility: visible) ya fue pintada en el DOM.
    document.defaultView?.requestAnimationFrame(() => {
      if (generation !== focusGeneration || !inputs.open()) return;
      document.defaultView?.requestAnimationFrame(() => {
        // Una apertura posterior o un cierre vuelven obsoleta esta solicitud de foco.
        if (
          generation !== focusGeneration ||
          !inputs.open() ||
          openDialogStack[openDialogStack.length - 1] !== dialogId
        )
          return;
        const preferred = inputs.initialFocus?.();
        const focusables = focusableElements();
        (preferred ?? focusables[0] ?? inputs.panel()?.nativeElement)?.focus();
      });
    });
  };

  const restoreFocus = (): void => {
    focusGeneration++;
    previouslyFocused?.focus();
    previouslyFocused = null;
  };

  const requestClose = (): void => {
    if (inputs.dismissible()) {
      inputs.open.set(false);
    } else {
      inputs.onDismissBlocked?.();
    }
  };

  const onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || event.defaultPrevented) {
      return;
    }
    if (openDialogStack[openDialogStack.length - 1] !== dialogId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (inputs.onEscape) {
      inputs.onEscape();
    } else {
      requestClose();
    }
  };

  document.addEventListener('keydown', onDocumentKeydown);

  effect(() => {
    const isOpen = inputs.open();
    untracked(() => {
      setLock(isOpen);
      if (isOpen) {
        pushToStack();
        captureFocus();
      } else {
        removeFromStack();
        restoreFocus();
      }
    });
  });

  inject(DestroyRef).onDestroy(() => {
    focusGeneration++;
    document.removeEventListener('keydown', onDocumentKeydown);
    removeFromStack();
    setLock(false);
  });

  return {
    requestClose,

    onOverlayClick: (event: MouseEvent) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      requestClose();
    },

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
