import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Modal } from '@shared/components/overlays/modal/modal';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TableToolbar } from './table-toolbar';

/** Reproduce una tabla y permite activar una segunda búsqueda sin invocar métodos internos de la barra. */
@Component({
  selector: 'app-toolbar-test-host',
  imports: [TableToolbar, SearchInput],
  template: `
    <button id="other" type="button">Otra acción</button>
    <div [attr.inert]="inert() ? '' : null" [attr.aria-hidden]="ariaHidden() ? 'true' : null">
      <app-table-toolbar label="Tabla principal" [selectedCount]="selected()">
        @if (showSearch()) {
          <app-search-input
            search
            inputId="primary-search"
            label="Buscar en la tabla principal"
            [(value)]="query"
            [disabled]="disabled()"
          />
        }
      </app-table-toolbar>
    </div>
    @if (second()) {
      <app-table-toolbar label="Tabla secundaria">
        <app-search-input
          search
          inputId="secondary-search"
          label="Buscar en la tabla secundaria"
          value="otra consulta"
        />
      </app-table-toolbar>
    }
  `,
})
class ToolbarTestHost {
  readonly query = signal('inventario');
  readonly selected = signal(0);
  readonly disabled = signal(false);
  readonly showSearch = signal(true);
  readonly second = signal(false);
  readonly inert = signal(false);
  readonly ariaHidden = signal(false);
}

/** Reproduce el Modal real del proyecto junto a una tabla de la página de fondo. */
@Component({
  selector: 'app-toolbar-modal-test-host',
  imports: [TableToolbar, SearchInput, Modal],
  template: `
    <button id="page-action" type="button">Acción de página</button>
    <app-table-toolbar label="Tabla de fondo">
      <app-search-input search inputId="background-search" label="Buscar en la página" />
    </app-table-toolbar>
    <app-modal title="Detalle" [(open)]="open">
      <button id="modal-action" type="button">Acción del modal</button>
      @if (showModalSearch()) {
        <app-table-toolbar label="Tabla del modal">
          <app-search-input search inputId="modal-search" label="Buscar en el modal" />
        </app-table-toolbar>
      }
    </app-modal>
  `,
})
class ToolbarModalTestHost {
  readonly open = signal(true);
  readonly showModalSearch = signal(false);
}

describe('TableToolbar: alcance del atajo de búsqueda', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarTestHost, ToolbarModalTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  /** Despacha el atajo a través del DOM para ejercitar los listeners registrados en el documento. */
  function shortcut(
    target: EventTarget,
    modifier: 'ctrl' | 'meta' = 'ctrl',
    handled = false,
  ): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: 'b',
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
    'enfoca y selecciona la búsqueda con %s+B sin modificar su contenido',
    (modifier) => {
      const fixture = TestBed.createComponent(ToolbarTestHost);
      fixture.detectChanges();
      const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
      const input = fixture.nativeElement.querySelector('#primary-search') as HTMLInputElement;
      other.focus();
      expect(shortcut(other, modifier).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe('inventario'.length);
      expect(fixture.componentInstance.query()).toBe('inventario');
    },
  );

  it('no intercepta el atajo mientras se muestran acciones de selección masiva', () => {
    const fixture = TestBed.createComponent(ToolbarTestHost);
    fixture.componentInstance.selected.set(3);
    fixture.detectChanges();
    const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
    other.focus();
    expect(shortcut(other).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  it('no intercepta el atajo cuando la barra no contiene un buscador', () => {
    const fixture = TestBed.createComponent(ToolbarTestHost);
    fixture.componentInstance.showSearch.set(false);
    fixture.detectChanges();
    const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
    other.focus();
    expect(shortcut(other).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  it('deja disponible el atajo si el buscador está deshabilitado y no puede recibir el foco', () => {
    const fixture = TestBed.createComponent(ToolbarTestHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
    other.focus();
    expect(shortcut(other).defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(other);
  });

  it('respeta un evento de teclado que otro control ya atendió', () => {
    const fixture = TestBed.createComponent(ToolbarTestHost);
    fixture.detectChanges();
    const field = fixture.debugElement.query(By.directive(SearchInput))
      .componentInstance as SearchInput;
    const focus = vi.spyOn(field, 'focus');
    const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
    other.focus();
    shortcut(other, 'ctrl', true);
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(other);
  });

  it('conserva el buscador activo cuando hay dos barras en la misma página', () => {
    const fixture = TestBed.createComponent(ToolbarTestHost);
    fixture.componentInstance.second.set(true);
    fixture.detectChanges();
    const primary = fixture.nativeElement.querySelector('#primary-search') as HTMLInputElement;
    primary.focus();
    shortcut(primary);
    expect(document.activeElement).toBe(primary);
  });

  it('mantiene el foco en el Modal real y no activa el buscador de la página de fondo', async () => {
    const fixture = TestBed.createComponent(ToolbarModalTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const field = fixture.debugElement.query(By.directive(SearchInput))
      .componentInstance as SearchInput;
    const focus = vi.spyOn(field, 'focus');
    const action = fixture.nativeElement.querySelector('#modal-action') as HTMLButtonElement;
    action.focus();
    shortcut(action);
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(action);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('permite buscar en la página cuando el modal está cerrado pero permanece en el DOM', async () => {
    const fixture = TestBed.createComponent(ToolbarModalTestHost);
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('#page-action') as HTMLButtonElement;
    const input = fixture.nativeElement.querySelector('#background-search') as HTMLInputElement;
    action.focus();
    expect(shortcut(action).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('enfoca el buscador del modal abierto sin activar la tabla de fondo', async () => {
    const fixture = TestBed.createComponent(ToolbarModalTestHost);
    fixture.componentInstance.showModalSearch.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const action = fixture.nativeElement.querySelector('#modal-action') as HTMLButtonElement;
    const input = fixture.nativeElement.querySelector('#modal-search') as HTMLInputElement;
    action.focus();
    expect(shortcut(action).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it.each(['inert', 'ariaHidden'] as const)(
    'no roba el foco desde un panel oculto con %s',
    (mode) => {
      const fixture = TestBed.createComponent(ToolbarTestHost);
      fixture.componentInstance[mode].set(true);
      fixture.detectChanges();
      const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
      other.focus();
      expect(shortcut(other).defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(other);
    },
  );

  it.each(['inert', 'ariaHidden'] as const)(
    'enfoca la tabla visible cuando la primera permanece oculta con %s',
    (mode) => {
      const fixture = TestBed.createComponent(ToolbarTestHost);
      fixture.componentInstance[mode].set(true);
      fixture.componentInstance.second.set(true);
      fixture.detectChanges();
      const other = fixture.nativeElement.querySelector('#other') as HTMLButtonElement;
      const visibleSearch = fixture.nativeElement.querySelector(
        '#secondary-search',
      ) as HTMLInputElement;
      other.focus();
      expect(shortcut(other).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(visibleSearch);
      expect(visibleSearch.selectionStart).toBe(0);
      expect(visibleSearch.selectionEnd).toBe(visibleSearch.value.length);
    },
  );
});
