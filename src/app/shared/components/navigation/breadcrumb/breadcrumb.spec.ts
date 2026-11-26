import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

const items: readonly BreadcrumbItem[] = [
  { label: 'Inicio', route: '/inicio' },
  {
    label: 'Recursos humanos',
    route: '/recursos-humanos',
    children: [{ label: 'Empleados', route: '/empleados' }],
  },
  {
    label: 'Empleados',
    route: '/empleados',
    children: [
      { label: 'Ver empleados', route: '/empleados/ver', queryParams: { estado: 'activo' } },
    ],
  },
  { label: 'Expediente del empleado' },
];

/** Verifica que las migas no mantengan menús invisibles y que el menú abierto respete el viewport. */
describe('Breadcrumb: menús y límites del viewport', () => {
  let fixture: ComponentFixture<Breadcrumb>;
  let root: HTMLElement;

  async function enter(index: number): Promise<void> {
    root.querySelectorAll('.crumbs__node')[index].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    vi.stubGlobal('innerWidth', 360);
    vi.stubGlobal('innerHeight', 800);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 300,
      y: 20,
      left: 300,
      right: 348,
      top: 20,
      bottom: 40,
      width: 48,
      height: 20,
      toJSON: () => ({}),
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(208);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(100);
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Breadcrumb);
    root = fixture.nativeElement;
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mantiene la ruta visible sin montar los menús cerrados ni sus enlaces', () => {
    expect(root.textContent).toContain('Expediente del empleado');
    expect(root.querySelectorAll('.crumbs__node')).toHaveLength(4);
    expect(root.querySelector('[role="menu"]')).toBeNull();
    expect(root.querySelector('[role="menuitem"]')).toBeNull();
  });

  it('abre únicamente las opciones del nivel señalado y conserva ruta y parámetros', async () => {
    await enter(2);
    const links = root.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
    expect(root.querySelectorAll('[role="menu"]')).toHaveLength(1);
    expect(links).toHaveLength(1);
    expect(links[0].textContent?.trim()).toBe('Ver empleados');
    expect(links[0].getAttribute('href')).toBe('/empleados/ver?estado=activo');
    await enter(1);
    expect(root.querySelectorAll('[role="menu"]')).toHaveLength(1);
    expect(root.querySelector('[role="menuitem"]')?.textContent?.trim()).toBe('Empleados');
  });

  it('recoloca el menú junto al borde derecho y al reducir el viewport', async () => {
    await enter(2);
    const menu = root.querySelector<HTMLElement>('[role="menu"]')!;
    expect(Number.parseFloat(menu.style.left)).toBe(140);
    expect(Number.parseFloat(menu.style.left) + menu.offsetWidth).toBeLessThanOrEqual(352);
    vi.stubGlobal('innerWidth', 240);
    window.dispatchEvent(new Event('resize'));
    expect(Number.parseFloat(menu.style.left)).toBe(24);
    expect(Number.parseFloat(menu.style.left) + menu.offsetWidth).toBeLessThanOrEqual(232);
  });

  it('retira el menú al elegir una opción y al pasar a una miga sin opciones', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await enter(2);
    root.querySelector<HTMLAnchorElement>('[role="menuitem"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('[role="menu"]')).toBeNull();
    await enter(2);
    await enter(3);
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });

  it('conserva el menú cuando el puntero cruza del nodo hacia sus opciones', async () => {
    await enter(2);
    vi.useFakeTimers();
    root.querySelectorAll('.crumbs__node')[2].dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    root.querySelector('[role="menu"]')!.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).not.toBeNull();
  });

  it('retira el menú del DOM después de abandonar el nivel', async () => {
    await enter(2);
    vi.useFakeTimers();
    root.querySelectorAll('.crumbs__node')[2].dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(400);
    fixture.detectChanges();
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });

  it('abre el menú por teclado con focusin, expone aria-expanded y cierra con Escape', async () => {
    const trigger = root
      .querySelectorAll('.crumbs__node')[2]
      .querySelector<HTMLElement>('.crumbs__link')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('[role="menu"]')).not.toBeNull();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('[role="menu"]')).toBeNull();
  });
});
