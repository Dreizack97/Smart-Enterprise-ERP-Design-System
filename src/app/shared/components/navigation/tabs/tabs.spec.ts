import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppTabPanel } from '../tab-panel/tab-panel';
import { TabItem, Tabs } from './tabs';

/** Comprueba selección y paneles mediante las directivas reales de Angular ARIA. */
@Component({
  selector: 'app-tabs-test-host',
  imports: [Tabs, AppTabPanel],
  template: `
    <app-tabs [tabs]="tabs()" [(selected)]="selected" [disabled]="disabled()" label="Secciones">
      @for (tab of tabs(); track tab.value) {
        <app-tab-panel [value]="tab.value">Panel {{ tab.label }}</app-tab-panel>
      }
    </app-tabs>
  `,
})
class TabsTestHost {
  readonly selected = signal<string | undefined>('general');
  readonly disabled = signal(false);
  readonly tabs = signal<readonly TabItem[]>([
    { value: 'general', label: 'Datos generales' },
    { value: 'hierarchy', label: 'Árbol jerárquico' },
  ]);
}

interface TabBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Simula las notificaciones del navegador sin llamar métodos internos del componente. */
class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  readonly targets = new Set<Element>();
  readonly observe = vi.fn((element: Element) => this.targets.add(element));
  readonly disconnect = vi.fn(() => this.targets.clear());

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  notify(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}

describe('Tabs: indicador de selección', () => {
  let fixture: ComponentFixture<TabsTestHost>;
  let root: HTMLElement;
  let boxes: TabBox[];

  function box(element: HTMLElement): TabBox {
    const index = [...(element.parentElement?.children ?? [])].indexOf(element);
    return element.classList.contains('tab') && boxes[index]
      ? boxes[index]
      : { left: 0, top: 0, width: 0, height: 0 };
  }

  function list(): HTMLElement {
    return root.querySelector('[role="tablist"]')!;
  }

  function observer(): TestResizeObserver {
    return TestResizeObserver.instances.at(-1)!;
  }

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    boxes = [
      { left: 0, top: 0, width: 120, height: 44 },
      { left: 128, top: 0, width: 145, height: 44 },
    ];
    TestResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return box(this).left;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return box(this).top;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return box(this).width;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return box(this).height;
    });
    await TestBed.configureTestingModule({
      imports: [TabsTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TabsTestHost);
    root = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mide la selección inicial y conserva únicamente elementos li dentro de la lista', async () => {
    await render();
    expect([...list().children].map((child) => child.tagName)).toEqual(['LI', 'LI']);
    expect(list().classList.contains('tabs--indicator-ready')).toBe(true);
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('0px');
    expect(list().style.getPropertyValue('--tab-indicator-y')).toBe('44px');
    expect(list().style.getPropertyValue('--tab-indicator-size')).toBe('120px');
    expect(observer().targets.size).toBe(3);
    expect(observer().targets.has(list())).toBe(true);
    for (const tab of root.querySelectorAll('.tab')) expect(observer().targets.has(tab)).toBe(true);
  });

  it('sigue la selección externa y mantiene el emparejamiento accesible con su panel', async () => {
    await render();
    fixture.componentInstance.selected.set('hierarchy');
    await render();
    const active = list().querySelector<HTMLElement>('[aria-selected="true"]')!;
    expect(active.textContent).toContain('Árbol jerárquico');
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('128px');
    expect(list().style.getPropertyValue('--tab-indicator-size')).toBe('145px');
    const panel = root.querySelector<HTMLElement>(`[id="${active.getAttribute('aria-controls')}"]`);
    expect(panel?.getAttribute('aria-labelledby')).toBe(active.id);
    expect(panel?.hasAttribute('inert')).toBe(false);
  });

  it('selecciona por clic y actualiza la posición del indicador', async () => {
    await render();
    root.querySelectorAll<HTMLElement>('.tab')[1].click();
    await render();
    expect(fixture.componentInstance.selected()).toBe('hierarchy');
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('128px');
  });

  it('comparte la selección del selector móvil con la barra y el panel activo', async () => {
    await render();
    const select = root.querySelector<HTMLSelectElement>('.tabs__mobile select')!;
    expect(select.getAttribute('aria-label')).toBe('Secciones');
    expect(select.value).toBe('general');
    select.value = 'hierarchy';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await render();
    expect(fixture.componentInstance.selected()).toBe('hierarchy');
    const active = list().querySelector<HTMLElement>('[aria-selected="true"]')!;
    expect(active.textContent).toContain('Árbol jerárquico');
    expect(
      root
        .querySelector<HTMLElement>(`[id="${active.getAttribute('aria-controls')}"]`)
        ?.hasAttribute('inert'),
    ).toBe(false);
    fixture.componentInstance.selected.set('general');
    await render();
    expect(select.value).toBe('general');
  });

  it('incluye los conteos y respeta los destinos deshabilitados también en el selector móvil', async () => {
    fixture.componentInstance.tabs.update((tabs) =>
      tabs.map((tab, index) => ({ ...tab, badge: String(index + 1), disabled: index === 1 })),
    );
    await render();
    const select = root.querySelector<HTMLSelectElement>('.tabs__mobile select')!;
    expect([...select.options].map((option) => option.textContent?.trim())).toEqual([
      'Selecciona una sección',
      'Datos generales (1)',
      'Árbol jerárquico (2)',
    ]);
    expect(select.options[2].disabled).toBe(true);
    select.value = 'hierarchy';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await render();
    expect(fixture.componentInstance.selected()).toBe('general');
    fixture.componentInstance.disabled.set(true);
    await render();
    expect(select.disabled).toBe(true);
  });

  it('sigue la navegación por teclado sin reemplazar el comportamiento de Angular ARIA', async () => {
    await render();
    const tabs = root.querySelectorAll<HTMLElement>('.tab');
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    await render();
    expect(fixture.componentInstance.selected()).toBe('hierarchy');
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('128px');
    tabs[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    await render();
    expect(fixture.componentInstance.selected()).toBe('general');
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('0px');
  });

  it('sitúa la línea bajo la pestaña activa cuando esta ocupa otra fila', async () => {
    boxes[1] = { left: 0, top: 52, width: 145, height: 44 };
    fixture.componentInstance.selected.set('hierarchy');
    await render();
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('0px');
    expect(list().style.getPropertyValue('--tab-indicator-y')).toBe('96px');
  });

  it('recalcula la geometría al recibir una notificación de redimensionamiento', async () => {
    await render();
    boxes[0] = { left: 12, top: 48, width: 175, height: 44 };
    observer().notify();
    await render();
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('12px');
    expect(list().style.getPropertyValue('--tab-indicator-y')).toBe('92px');
    expect(list().style.getPropertyValue('--tab-indicator-size')).toBe('175px');
  });

  it('vuelve a medir después de actualizar el texto o la insignia sin cambiar la selección', async () => {
    await render();
    boxes[0].width = 190;
    fixture.componentInstance.tabs.update((tabs) =>
      tabs.map((tab, index) =>
        index === 0 ? { ...tab, label: 'Datos generales ampliados', badge: '10' } : tab,
      ),
    );
    await render();
    expect(list().textContent).toContain('Datos generales ampliados');
    expect(list().querySelector('.tab__badge')?.textContent).toBe('10');
    expect(fixture.componentInstance.selected()).toBe('general');
    expect(list().style.getPropertyValue('--tab-indicator-size')).toBe('190px');
  });

  it('renueva la observación al cambiar las pestañas y oculta la línea al quedar vacía la lista', async () => {
    await render();
    const previous = observer();
    fixture.componentInstance.tabs.update((tabs) => [
      ...tabs,
      { value: 'other', label: 'Otra sección' },
    ]);
    await render();
    expect(previous.disconnect).toHaveBeenCalled();
    expect(observer().targets.size).toBe(4);
    expect(observer().targets.has(root.querySelectorAll('.tab')[2])).toBe(true);
    const current = observer();
    fixture.componentInstance.tabs.set([]);
    await render();
    expect(current.disconnect).toHaveBeenCalled();
    expect(list().querySelector('.tab')).toBeNull();
    expect(list().classList.contains('tabs--indicator-ready')).toBe(false);
    expect(list().style.getPropertyValue('--tab-indicator-size')).toBe('0px');
  });

  it('no inventa una selección para un valor que Angular ARIA no tiene seleccionado', async () => {
    fixture.componentInstance.selected.set('inexistente');
    await render();
    expect(list().querySelector('[aria-selected="true"]')).toBeNull();
    expect(list().classList.contains('tabs--indicator-ready')).toBe(false);
  });

  it('conserva el respaldo estático mientras la geometría no es medible y se recupera al mostrarse', async () => {
    boxes[0].width = 0;
    await render();
    expect(list().classList.contains('tabs--indicator-ready')).toBe(false);
    expect(list().querySelector('[aria-selected="true"]')).not.toBeNull();
    boxes[0].width = 120;
    observer().notify();
    await render();
    expect(list().classList.contains('tabs--indicator-ready')).toBe(true);
  });

  it('conserva la selección y sus paneles cuando ResizeObserver no está disponible', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    await render();
    expect(list().classList.contains('tabs--indicator-ready')).toBe(false);
    root.querySelectorAll<HTMLElement>('.tab')[1].click();
    await render();
    expect(fixture.componentInstance.selected()).toBe('hierarchy');
    expect(list().querySelector('[aria-selected="true"]')?.textContent).toContain(
      'Árbol jerárquico',
    );
  });

  it('respeta las pestañas deshabilitadas y la deshabilitación de toda la barra', async () => {
    fixture.componentInstance.tabs.update((tabs) =>
      tabs.map((tab, index) => (index === 1 ? { ...tab, disabled: true } : tab)),
    );
    await render();
    root.querySelectorAll<HTMLElement>('.tab')[1].click();
    await render();
    expect(fixture.componentInstance.selected()).toBe('general');
    fixture.componentInstance.tabs.update((tabs) =>
      tabs.map((tab) => ({ ...tab, disabled: false })),
    );
    fixture.componentInstance.disabled.set(true);
    await render();
    root.querySelectorAll<HTMLElement>('.tab')[1].click();
    await render();
    expect(fixture.componentInstance.selected()).toBe('general');
    expect(list().style.getPropertyValue('--tab-indicator-x')).toBe('0px');
  });

  it('desconecta el observador y descarta notificaciones tardías tras destruir el componente', async () => {
    await render();
    const current = observer();
    const element = list();
    const width = element.style.getPropertyValue('--tab-indicator-size');
    fixture.destroy();
    expect(current.disconnect).toHaveBeenCalled();
    boxes[0].width = 500;
    expect(() => current.notify()).not.toThrow();
    expect(element.style.getPropertyValue('--tab-indicator-size')).toBe(width);
  });
});
