import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { LayoutStore } from '@core/layout/layout-store';
import { SIDEBAR_SUBMENUS_KEY } from '@core/layout/layout.model';
import { BrowserStorage } from '@core/storage/browser-storage';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Modal } from '@shared/components/overlays/modal/modal';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavSection } from './navigation.model';
import { Sidebar } from './sidebar';

/** Proporciona un destino mínimo para ejercitar el menú con navegación real. */
@Component({ selector: 'app-sidebar-route-test-page', template: '' })
class SidebarRouteTestPage {}

/** Reproduce el buscador del menú y un Modal real que conserva su panel cuando está cerrado. */
@Component({
  selector: 'app-sidebar-shortcut-test-host',
  imports: [Sidebar, Modal],
  template: `
    <button id="page-action" type="button">Acción de página</button>
    <app-sidebar
      [sections]="sections"
      [rail]="rail()"
      (searchRequested)="requests.set(requests() + 1)"
    />
    <app-modal title="Detalle" [(open)]="modalOpen">
      <button id="modal-action" type="button">Acción del modal</button>
    </app-modal>
  `,
})
class SidebarShortcutTestHost {
  readonly sections: readonly NavSection[] = [
    { items: [{ id: 'inicio', label: 'Inicio', route: '/inicio' }] },
  ];
  readonly rail = signal(false);
  readonly requests = signal(0);
  readonly modalOpen = signal(false);
}

/** Reproduce grupos anidados, ramas de otras secciones y un enlace directo de primer nivel. */
const SECTIONS: readonly NavSection[] = [
  {
    items: [
      { id: 'inicio', label: 'Inicio', route: '/inicio' },
      {
        id: 'personal',
        label: 'Personal',
        children: [
          {
            id: 'empleados',
            label: 'Empleados',
            children: [
              { id: 'lista', label: 'Ver empleados', route: '/personal/empleados/lista' },
              { id: 'historial', label: 'Historial', route: '/personal/empleados/historial' },
            ],
          },
          { id: 'asistencia', label: 'Asistencia', route: '/personal/asistencia' },
        ],
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'empresa',
        label: 'Empresa',
        children: [
          {
            id: 'departamentos',
            label: 'Departamentos',
            children: [
              { id: 'organigrama', label: 'Organigrama', route: '/empresa/departamentos' },
            ],
          },
        ],
      },
    ],
  },
];

describe('Sidebar: navegación y cierre de ramas completas', () => {
  let router: Router;
  let layout: LayoutStore;
  let initialOpenIds: readonly string[];

  beforeEach(async () => {
    initialOpenIds = [];
    TestBed.configureTestingModule({
      imports: [Sidebar],
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
    router = TestBed.inject(Router);
    router.resetConfig([{ path: '**', component: SidebarRouteTestPage }]);
    await router.navigateByUrl('/sin-seleccion');
  });

  /** Monta el sidebar completo con las preferencias iniciales y deja finalizar sus efectos. */
  async function render(openIds: readonly string[] = []): Promise<ComponentFixture<Sidebar>> {
    initialOpenIds = openIds;
    layout = TestBed.inject(LayoutStore);
    const fixture = TestBed.createComponent(Sidebar);
    fixture.componentRef.setInput('sections', SECTIONS);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  /** Activa el control accesible de un grupo usando el identificador de su panel. */
  async function toggle(fixture: ComponentFixture<Sidebar>, id: string): Promise<void> {
    const button = fixture.nativeElement.querySelector(
      `button[aria-controls="submenu-${id}"]`,
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();
    button.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** Captura una búsqueda mediante el campo real del sidebar y espera a que se filtre el árbol. */
  async function search(
    fixture: ComponentFixture<Sidebar>,
    term: string,
  ): Promise<HTMLInputElement> {
    const input = fixture.nativeElement.querySelector('app-search-input input') as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    return input;
  }

  it('cierra la rama hermana con todos sus descendientes aunque pertenezca a otra sección', async () => {
    const fixture = await render();
    await toggle(fixture, 'personal');
    await toggle(fixture, 'empleados');
    expect(layout.openSubmenus()).toEqual(new Set(['personal', 'empleados']));
    await toggle(fixture, 'empresa');
    expect(layout.openSubmenus()).toEqual(new Set(['empresa']));
    expect(
      fixture.nativeElement
        .querySelector('[aria-controls="submenu-personal"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('pliega los descendientes junto con su padre y no los reabre al expandirlo otra vez', async () => {
    const fixture = await render(['personal', 'empleados']);
    await toggle(fixture, 'personal');
    expect(layout.openSubmenus().size).toBe(0);
    await toggle(fixture, 'personal');
    expect(layout.openSubmenus()).toEqual(new Set(['personal']));
    expect(
      fixture.nativeElement
        .querySelector('[aria-controls="submenu-empleados"]')
        ?.getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('revela el trayecto de una ficha y cierra otras ramas al llegar por URL directa', async () => {
    await router.navigateByUrl('/personal/empleados/lista/42');
    const fixture = await render(['empresa', 'departamentos']);
    expect(layout.openSubmenus()).toEqual(new Set(['personal', 'empleados']));
    const current = fixture.nativeElement.querySelectorAll(
      'a[aria-current="page"]',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('Ver empleados');
  });

  it('actualiza las ramas abiertas al pasar de una ficha a otra sección', async () => {
    const fixture = await render();
    await router.navigateByUrl('/personal/empleados/lista/42');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(layout.openSubmenus()).toEqual(new Set(['personal', 'empleados']));
    await router.navigateByUrl('/empresa/departamentos/9');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(layout.openSubmenus()).toEqual(new Set(['empresa', 'departamentos']));
    expect(fixture.nativeElement.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe(
      'Organigrama',
    );
  });

  it('cierra las ramas abiertas al navegar a un enlace directo de primer nivel', async () => {
    const fixture = await render(['personal', 'empleados', 'empresa', 'departamentos']);
    await router.navigateByUrl('/inicio');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(layout.openSubmenus().size).toBe(0);
    expect(fixture.nativeElement.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe(
      'Inicio',
    );
  });

  it('conserva el padre al navegar a un enlace hermano y pliega los grupos que ya no forman el trayecto', async () => {
    const fixture = await render();
    await router.navigateByUrl('/personal/empleados/lista/42');
    fixture.detectChanges();
    await fixture.whenStable();
    await router.navigateByUrl('/personal/asistencia');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(layout.openSubmenus()).toEqual(new Set(['personal']));
    expect(fixture.nativeElement.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe(
      'Asistencia',
    );
  });

  it('filtra y restaura el menú sin modificar las ramas guardadas por el usuario', async () => {
    const fixture = await render(['personal', 'empleados']);
    const previous = layout.openSubmenus();
    const storage = TestBed.inject(BrowserStorage);
    const input = fixture.nativeElement.querySelector('app-search-input input') as HTMLInputElement;
    input.value = 'Organigrama';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[aria-controls="submenu-personal"]')).toBeNull();
    expect(layout.openSubmenus()).toBe(previous);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[aria-controls="submenu-personal"]'),
    ).not.toBeNull();
    expect(layout.openSubmenus()).toBe(previous);
    expect(storage.write).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'Inicio', route: '/inicio' },
    { label: 'Organigrama', route: '/empresa/departamentos' },
  ])('restaura el menú completo al navegar desde el resultado $label', async ({ label, route }) => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    const input = await search(fixture, label);
    expect(root.querySelector('[aria-controls="submenu-personal"]')).toBeNull();
    layout.toggleDrawer();
    const link = root.querySelector(`a[href="${route}"]`) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    link.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toBe(route);
    expect(input.value).toBe('');
    expect(root.querySelector('[aria-controls="submenu-personal"]')).not.toBeNull();
    expect(root.querySelector('[aria-controls="submenu-empresa"]')).not.toBeNull();
    expect(layout.sidebarOpen()).toBe(false);
  });

  it('conserva la búsqueda al pulsar un grupo sin elegir un enlace', async () => {
    const fixture = await render();
    const input = await search(fixture, 'Empresa');
    await toggle(fixture, 'empresa');
    expect(input.value).toBe('Empresa');
    expect(router.url).toBe('/sin-seleccion');
    expect(fixture.nativeElement.querySelector('[aria-controls="submenu-personal"]')).toBeNull();
  });

  it('limpia el filtro al elegir el enlace que ya corresponde a la página actual', async () => {
    await router.navigateByUrl('/empresa/departamentos');
    const fixture = await render();
    const input = await search(fixture, 'Organigrama');
    const link = fixture.nativeElement.querySelector(
      'a[href="/empresa/departamentos"]',
    ) as HTMLAnchorElement;
    link.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toBe('/empresa/departamentos');
    expect(input.value).toBe('');
    expect(
      fixture.nativeElement.querySelector('[aria-controls="submenu-personal"]'),
    ).not.toBeNull();
  });
});

describe('Sidebar: alcance del atajo de búsqueda', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarShortcutTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        {
          provide: BrowserStorage,
          useValue: { read: (_key: string, fallback: unknown) => fallback, write: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  /** Emite el atajo como un evento real para comprobar los listeners del documento. */
  function shortcut(
    target: EventTarget,
    modifier: 'ctrl' | 'meta' = 'ctrl',
    handled = false,
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: modifier === 'ctrl',
      metaKey: modifier === 'meta',
      bubbles: true,
      cancelable: true,
    });
    if (handled) event.preventDefault();
    target.dispatchEvent(event);
    return event;
  }

  it.each(['ctrl', 'meta'] as const)(
    'enfoca y selecciona el buscador con %s+K aunque exista un modal cerrado en el DOM',
    async (modifier) => {
      const fixture = TestBed.createComponent(SidebarShortcutTestHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = fixture.nativeElement.querySelector(
        'app-search-input input',
      ) as HTMLInputElement;
      input.value = 'Inicio';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      const action = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
      action.focus();
      expect(shortcut(action, modifier).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe('Inicio');
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe('Inicio'.length);
      expect(
        fixture.nativeElement.querySelector('.modal-overlay:not(.is-open) [role="dialog"]'),
      ).not.toBeNull();
    },
  );

  it('solicita expandir el riel y espera a que el padre lo revele antes de enfocar el buscador', async () => {
    const fixture = TestBed.createComponent(SidebarShortcutTestHost);
    fixture.componentInstance.rail.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    action.focus();
    expect(shortcut(action).defaultPrevented).toBe(true);
    expect(fixture.componentInstance.requests()).toBe(1);
    expect(document.activeElement).toBe(action);
    fixture.componentInstance.rail.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('app-search-input input'),
    );
  });

  it('respeta un atajo que otro control ya atendió', async () => {
    const fixture = TestBed.createComponent(SidebarShortcutTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    action.focus();
    shortcut(action, 'ctrl', true);
    expect(document.activeElement).toBe(action);
    expect(fixture.componentInstance.requests()).toBe(0);
  });

  it('mantiene el foco dentro del Modal real abierto y deja disponible el atajo', async () => {
    const fixture = TestBed.createComponent(SidebarShortcutTestHost);
    fixture.componentInstance.modalOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('#modal-action') as HTMLButtonElement;
    action.focus();
    expect(shortcut(action).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(action);
    expect(fixture.componentInstance.modalOpen()).toBe(true);
  });

  it('deja disponible el atajo cuando el buscador no puede recibir el foco', async () => {
    const fixture = TestBed.createComponent(SidebarShortcutTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const search = fixture.debugElement.query(By.directive(SearchInput))
      .componentInstance as SearchInput;
    vi.spyOn(search, 'focus').mockReturnValue(false);
    const action = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    action.focus();
    expect(shortcut(action).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(action);
  });
});
