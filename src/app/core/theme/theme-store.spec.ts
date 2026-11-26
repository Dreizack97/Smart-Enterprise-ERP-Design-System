import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { BrowserStorage } from '@core/storage/browser-storage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeStore } from './theme-store';

describe('ThemeStore: transición de apariencia', () => {
  let attributes: [string, string][];
  let originalTransition: PropertyDescriptor | undefined;
  let systemReduced: boolean;
  let trigger: HTMLButtonElement | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    attributes = Array.from(document.documentElement.attributes, (attr) => [attr.name, attr.value]);
    originalTransition = Object.getOwnPropertyDescriptor(document, 'startViewTransition');
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    systemReduced = false;
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query.includes('reduced-motion') && systemReduced,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        {
          provide: BrowserStorage,
          useValue: {
            read: (_key: string, fallback: unknown) => fallback,
            write: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    trigger?.remove();
    trigger = undefined;
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalTransition)
      Object.defineProperty(document, 'startViewTransition', originalTransition);
    else Reflect.deleteProperty(document, 'startViewTransition');
    const root = document.documentElement;
    for (const attr of Array.from(root.attributes)) root.removeAttribute(attr.name);
    for (const [name, value] of attributes) root.setAttribute(name, value);
  });

  /** Controla cuándo termina cada transición sin depender del compositor del navegador. */
  function pendingTransition() {
    let finish: () => void = () => undefined;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    return { finished, finish: () => finish() };
  }

  /** Instala la API del navegador y aplica la actualización visual dentro de su callback. */
  function installTransition(finished: Promise<void>) {
    const start = vi.fn((update: () => void) => {
      update();
      return { finished };
    });
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      writable: true,
      value: start,
    });
    return start;
  }

  it('aplica el tema sin la API y conserva el plazo de la última actualización', () => {
    const store = TestBed.inject(ThemeStore);
    store.set('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    vi.advanceTimersByTime(400);
    store.set('light');
    vi.advanceTimersByTime(300);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.classList.contains('theme-anim')).toBe(true);
    vi.runAllTimers();
    expect(document.documentElement.classList.contains('theme-anim')).toBe(false);
  });

  it('origina la transición en el control activo y retira el estado al finalizar', async () => {
    const transition = pendingTransition();
    const start = installTransition(transition.finished);
    trigger = document.createElement('button');
    document.body.append(trigger);
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 40, 40, 20));
    trigger.focus();
    TestBed.inject(ThemeStore).set('dark');
    expect(start).toHaveBeenCalledOnce();
    expect(document.documentElement.style.getPropertyValue('--theme-x')).toBe('120px');
    expect(document.documentElement.style.getPropertyValue('--theme-y')).toBe('50px');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    transition.finish();
    await Promise.resolve();
    expect(document.documentElement.classList.contains('theme-anim')).toBe(false);
  });

  it.each(['sistema', 'aplicación'])(
    'aplica el tema sin iniciar la transición al reducir movimiento desde %s',
    (origin) => {
      const store = TestBed.inject(ThemeStore);
      if (origin === 'sistema') systemReduced = true;
      else store.setReducedMotion(true);
      const start = installTransition(Promise.resolve());
      store.set('dark');
      expect(start).not.toHaveBeenCalled();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    },
  );

  it('conserva la animación vigente cuando termina una transición anterior', async () => {
    const first = pendingTransition();
    const second = pendingTransition();
    installTransition(first.finished);
    const store = TestBed.inject(ThemeStore);
    store.set('dark');
    installTransition(second.finished);
    store.set('light');
    first.finish();
    await Promise.resolve();
    expect(document.documentElement.classList.contains('theme-anim')).toBe(true);
    second.finish();
    await Promise.resolve();
    expect(document.documentElement.classList.contains('theme-anim')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
