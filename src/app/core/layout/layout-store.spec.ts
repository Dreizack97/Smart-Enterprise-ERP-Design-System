import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { BrowserStorage } from '@core/storage/browser-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutStore } from './layout-store';
import { SIDEBAR_SUBMENUS_KEY } from './layout.model';

describe('LayoutStore: apertura y cierre de ramas del menú', () => {
  let stored: Map<string, unknown>;
  let write: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stored = new Map();
    write = vi.fn((key: string, value: unknown) => {
      stored.set(key, value);
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        {
          provide: BrowserStorage,
          useValue: {
            read: (key: string, fallback: unknown) =>
              stored.has(key) ? stored.get(key) : fallback,
            write,
          },
        },
      ],
    });
  });

  /** Recupera un estado inicial como lo haría el store al reconstruirse desde las preferencias. */
  function createStore(openIds: readonly string[] = []): LayoutStore {
    stored.set(SIDEBAR_SUBMENUS_KEY, [...openIds]);
    return TestBed.inject(LayoutStore);
  }

  it('abre un grupo cerrando la rama hermana completa y conserva otras secciones', () => {
    const store = createStore(['empresa', 'departamentos', 'puestos', 'otra-seccion']);
    const previous = store.openSubmenus();
    store.toggleSubmenu(
      'personal',
      ['empresa', 'departamentos', 'puestos', 'personal', 'empleados'],
      ['personal', 'empleados'],
    );
    expect(store.openSubmenus()).toEqual(new Set(['otra-seccion', 'personal']));
    expect(previous).toEqual(new Set(['empresa', 'departamentos', 'puestos', 'otra-seccion']));
    expect(stored.get(SIDEBAR_SUBMENUS_KEY)).toEqual([...store.openSubmenus()]);
  });

  it('cierra todos los descendientes del grupo plegado sin cerrar otros grupos', () => {
    const store = createStore(['personal', 'empleados', 'ficha', 'empresa']);
    store.toggleSubmenu(
      'personal',
      ['empresa', 'personal', 'empleados', 'ficha'],
      ['personal', 'empleados', 'ficha'],
    );
    expect(store.openSubmenus()).toEqual(new Set(['empresa']));
    expect(stored.get(SIDEBAR_SUBMENUS_KEY)).toEqual(['empresa']);
  });

  it('conserva la llamada de dos argumentos para alternar un grupo sin descendientes', () => {
    const store = createStore(['empresa']);
    store.toggleSubmenu('personal', ['empresa', 'personal']);
    expect(store.isSubmenuOpen('empresa')).toBe(false);
    expect(store.isSubmenuOpen('personal')).toBe(true);
    store.toggleSubmenu('personal', ['empresa', 'personal']);
    expect(store.openSubmenus().size).toBe(0);
  });

  it('revela la rama activa y conserva sus descendientes mientras limpia las ramas hermanas', () => {
    const store = createStore(['empresa', 'departamentos', 'personal', 'ficha', 'otra-seccion']);
    store.openBranch(
      ['personal', 'empleados'],
      ['empresa', 'departamentos', 'personal', 'empleados', 'ficha'],
      ['personal', 'empleados', 'ficha'],
    );
    expect(store.openSubmenus()).toEqual(
      new Set(['personal', 'empleados', 'ficha', 'otra-seccion']),
    );
    expect(stored.get(SIDEBAR_SUBMENUS_KEY)).toEqual([...store.openSubmenus()]);
  });

  it('limpia las ramas rivales aunque el grupo activo ya esté abierto', () => {
    const store = createStore(['personal', 'empresa', 'departamentos']);
    store.openBranch(['personal'], ['personal', 'empresa', 'departamentos']);
    expect(store.openSubmenus()).toEqual(new Set(['personal']));
    expect(write).toHaveBeenCalledOnce();
  });

  it('permite cerrar las ramas hermanas al navegar a un enlace sin submenú', () => {
    const store = createStore(['empresa', 'departamentos', 'otra-seccion']);
    store.openBranch([], ['empresa', 'departamentos']);
    expect(store.openSubmenus()).toEqual(new Set(['otra-seccion']));
    expect(stored.get(SIDEBAR_SUBMENUS_KEY)).toEqual(['otra-seccion']);
  });

  it('conserva la referencia de estado y evita persistir cuando la rama ya está correctamente abierta', () => {
    const store = createStore(['personal', 'empleados', 'ficha']);
    const previous = store.openSubmenus();
    store.openBranch(
      ['personal', 'empleados'],
      ['empresa', 'departamentos', 'personal', 'empleados', 'ficha'],
      ['personal', 'empleados', 'ficha'],
    );
    expect(store.openSubmenus()).toBe(previous);
    expect(write).not.toHaveBeenCalled();
  });

  it('mantiene la apertura aditiva cuando no se indican ramas hermanas', () => {
    const store = createStore(['empresa']);
    store.openBranch(['personal', 'empleados']);
    expect(store.openSubmenus()).toEqual(new Set(['empresa', 'personal', 'empleados']));
    expect(stored.get(SIDEBAR_SUBMENUS_KEY)).toEqual([...store.openSubmenus()]);
  });

  it('restaura el estado persistido sin reabrir descendientes que ya se plegaron', () => {
    const store = createStore(['personal', 'empleados', 'ficha', 'empresa']);
    store.toggleSubmenu(
      'personal',
      ['personal', 'empleados', 'ficha', 'empresa'],
      ['personal', 'empleados', 'ficha'],
    );
    const restored = TestBed.runInInjectionContext(() => new LayoutStore());
    expect(restored.openSubmenus()).toEqual(new Set(['empresa']));
    expect(restored.isSubmenuOpen('empleados')).toBe(false);
    expect(restored.isSubmenuOpen('ficha')).toBe(false);
  });

  it('no convierte el estado interno del menú en una dependencia del efecto que revela la ruta', () => {
    const store = createStore();
    const routeGroup = signal('personal');
    let runs = 0;
    TestBed.runInInjectionContext(() => {
      effect(() => {
        runs++;
        store.openBranch([routeGroup()]);
      });
    });
    TestBed.tick();
    expect(runs).toBe(1);
    store.toggleSubmenu('empresa', []);
    TestBed.tick();
    expect(runs).toBe(1);
    routeGroup.set('configuracion');
    TestBed.tick();
    expect(runs).toBe(2);
    expect(store.isSubmenuOpen('configuracion')).toBe(true);
  });
});
