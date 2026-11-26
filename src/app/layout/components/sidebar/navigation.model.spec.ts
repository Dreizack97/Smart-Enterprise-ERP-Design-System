import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { LayoutStore } from '@core/layout/layout-store';
import { SIDEBAR_SUBMENUS_KEY } from '@core/layout/layout.model';
import { BrowserStorage } from '@core/storage/browser-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NavItem, subtreeIdsOf } from './navigation.model';

/** Representa cuatro niveles de navegación y una rama hermana independiente. */
const NAVIGATION: readonly NavItem[] = [
  {
    id: 'personal',
    label: 'Personal',
    children: [
      {
        id: 'empleados',
        label: 'Empleados',
        children: [
          {
            id: 'ficha',
            label: 'Ficha',
            children: [{ id: 'datos', label: 'Datos', route: '/empleados/lista/42' }],
          },
        ],
      },
      { id: 'asistencia', label: 'Asistencia', route: '/asistencia' },
    ],
  },
  {
    id: 'empresa',
    label: 'Empresa',
    children: [{ id: 'departamentos', label: 'Departamentos', route: '/empresa/departamentos' }],
  },
];

describe('Navegación: identificadores de ramas completas', () => {
  let initialOpenIds: readonly string[];

  beforeEach(() => {
    initialOpenIds = [];
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
              key === SIDEBAR_SUBMENUS_KEY ? initialOpenIds : fallback,
            write: vi.fn(),
          },
        },
      ],
    });
  });

  it('devuelve una lista vacía cuando no hay nodos', () => {
    expect(subtreeIdsOf([])).toEqual([]);
  });

  it('incluye enlaces sin hijos y grupos con una lista de hijos vacía', () => {
    expect(
      subtreeIdsOf([
        { id: 'inicio', label: 'Inicio', route: '/inicio' },
        { id: 'grupo', label: 'Grupo', children: [] },
      ]),
    ).toEqual(['inicio', 'grupo']);
  });

  it('incluye todos los niveles y conserva el orden de las ramas del menú', () => {
    expect(subtreeIdsOf(NAVIGATION)).toEqual([
      'personal',
      'empleados',
      'ficha',
      'datos',
      'asistencia',
      'empresa',
      'departamentos',
    ]);
  });

  it('acepta nodos inmutables y devuelve una lista independiente del árbol original', () => {
    const leaf = Object.freeze({ id: 'perfil', label: 'Perfil', route: '/cuenta/perfil' });
    const group = Object.freeze({ id: 'cuenta', label: 'Cuenta', children: Object.freeze([leaf]) });
    const tree = Object.freeze([group]);
    const result = subtreeIdsOf(tree);
    result.push('otro');
    expect(subtreeIdsOf(tree)).toEqual(['cuenta', 'perfil']);
    expect(tree[0]).toBe(group);
    expect(group.children[0]).toBe(leaf);
  });

  it('permite al store plegar una rama completa sin dejar abiertos descendientes ni cerrar otra rama', () => {
    initialOpenIds = ['personal', 'empleados', 'ficha', 'datos', 'empresa', 'departamentos'];
    const layout = TestBed.inject(LayoutStore);
    layout.toggleSubmenu('personal', subtreeIdsOf(NAVIGATION), subtreeIdsOf([NAVIGATION[0]]));
    expect(layout.openSubmenus()).toEqual(new Set(['empresa', 'departamentos']));
    expect(TestBed.inject(BrowserStorage).write).toHaveBeenCalledWith(SIDEBAR_SUBMENUS_KEY, [
      'empresa',
      'departamentos',
    ]);
  });
});
