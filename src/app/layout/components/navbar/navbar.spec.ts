import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { ThemeStore } from '@core/theme/theme-store';
import { Modal } from '@shared/components/overlays/modal/modal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './navbar';

/** Aloja la barra superior junto a controles de página y un modal para ejercitar el atajo `/`. */
@Component({
  selector: 'app-navbar-shortcut-test-host',
  imports: [Modal, Navbar],
  template: `
    <app-navbar
      [showSearch]="showSearch()"
      [hasSearchPanel]="hasSearchPanel()"
      [searchShortcut]="searchShortcut()"
    >
      @if (hasSearchPanel()) {
        <div searchPanel>
          <button
            id="search-hit-option"
            type="button"
            (click)="selectedHits.set(selectedHits() + 1)"
          >
            Resultado
          </button>
        </div>
      }
    </app-navbar>
    <main>
      <button id="page-action" type="button">Acción</button>
      <input id="page-field" type="text" value="dato" />
    </main>
    <app-modal [(open)]="modalOpen" title="Confirmar"><p>Modal abierto</p></app-modal>
  `,
})
class NavbarShortcutTestHost {
  readonly showSearch = signal(true);
  readonly hasSearchPanel = signal(false);
  readonly searchShortcut = signal<readonly string[]>(['/']);
  readonly modalOpen = signal(false);
  readonly selectedHits = signal(0);
}

describe('Navbar: visibilidad opcional del buscador', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        {
          provide: ThemeStore,
          useValue: { isDark: () => false, toggleLabel: () => 'Modo oscuro', toggle: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  it('oculta el buscador por defecto y conserva los controles de navegación, tema y cuenta', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-search-input')).toBeNull();
    const drawer = vi.fn();
    const rail = vi.fn();
    fixture.componentInstance.drawerToggled.subscribe(drawer);
    fixture.componentInstance.railToggled.subscribe(rail);
    fixture.nativeElement.querySelector('[aria-label="Abrir navegación"]').click();
    fixture.nativeElement.querySelector('[aria-label="Contraer menú"]').click();
    fixture.nativeElement.querySelector('[aria-label="Modo oscuro"]').click();
    expect(drawer).toHaveBeenCalledOnce();
    expect(rail).toHaveBeenCalledOnce();
    expect(TestBed.inject(ThemeStore).toggle).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('[aria-label="Cuenta de Invitada"]')).not.toBeNull();
  });

  it('muestra el buscador al habilitarlo y emite el texto capturado', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.componentRef.setInput('showSearch', true);
    fixture.detectChanges();
    const changed = vi.fn();
    fixture.componentInstance.searchChanged.subscribe(changed);
    const input = fixture.nativeElement.querySelector('app-search-input input') as HTMLInputElement;
    input.value = 'empleados';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledExactlyOnceWith('empleados');
    expect(input.value).toBe('empleados');
  });

  it('conserva la consulta al ocultar y volver a mostrar el buscador sin emitir cambios adicionales', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.componentRef.setInput('showSearch', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('app-search-input input') as HTMLInputElement;
    input.value = 'almacenes';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changed = vi.fn();
    fixture.componentInstance.searchChanged.subscribe(changed);
    fixture.componentRef.setInput('showSearch', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-search-input')).toBeNull();
    fixture.componentRef.setInput('showSearch', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-search-input input')?.value).toBe('almacenes');
    expect(changed).not.toHaveBeenCalled();
  });

  it('interpreta los atributos booleanos al habilitar y deshabilitar el buscador', () => {
    const fixture = TestBed.createComponent(Navbar);
    fixture.componentRef.setInput('showSearch', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-search-input input')).not.toBeNull();
    fixture.componentRef.setInput('showSearch', 'false');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-search-input')).toBeNull();
  });
});

describe('Navbar: atajo de teclado para el buscador', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarShortcutTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        {
          provide: ThemeStore,
          useValue: { isDark: () => false, toggleLabel: () => 'Modo oscuro', toggle: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  function pressSlash(target: EventTarget, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      cancelable: true,
      ...init,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('muestra la ayuda `/` y enfoca el buscador desde un botón de la página', () => {
    const fixture = TestBed.createComponent(NavbarShortcutTestHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    const searchInput = fixture.nativeElement.querySelector(
      'app-navbar app-search-input input',
    ) as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('app-navbar kbd')?.textContent?.trim()).toBe('/');
    button.focus();
    const event = pressSlash(button);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(searchInput);
  });

  it('no intercepta `/` cuando el foco está en un campo editable o el atajo está vacío', () => {
    const fixture = TestBed.createComponent(NavbarShortcutTestHost);
    fixture.detectChanges();
    const field = fixture.nativeElement.querySelector('#page-field') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    field.focus();
    expect(pressSlash(field).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(field);

    fixture.componentInstance.searchShortcut.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-navbar kbd')).toBeNull();
    button.focus();
    expect(pressSlash(button).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('no intercepta `/` cuando hay un modal abierto ni con modificadores', () => {
    const fixture = TestBed.createComponent(NavbarShortcutTestHost);
    fixture.componentInstance.modalOpen.set(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    button.focus();
    expect(pressSlash(button).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(button);

    fixture.componentInstance.modalOpen.set(false);
    fixture.detectChanges();
    button.focus();
    expect(pressSlash(button, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('muestra el desplegable anclado con consulta activa, se cierra al pulsar fuera y Esc borra y saca el foco', () => {
    const fixture = TestBed.createComponent(NavbarShortcutTestHost);
    fixture.componentInstance.hasSearchPanel.set(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'app-navbar app-search-input input',
    ) as HTMLInputElement;
    const outsideButton = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('.navbar__search-popover')).toBeNull();

    input.focus();
    input.value = 'nss';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.navbar__search-popover')).not.toBeNull();

    outsideButton.focus();
    outsideButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.navbar__search-popover')).toBeNull();
    expect(input.value).toBe('nss');

    input.focus();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.navbar__search-popover')).not.toBeNull();

    const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(esc);
    fixture.detectChanges();
    expect(esc.defaultPrevented).toBe(true);
    expect(input.value).toBe('');
    expect(fixture.nativeElement.querySelector('.navbar__search-popover')).toBeNull();
    expect(document.activeElement).not.toBe(input);
  });
});
