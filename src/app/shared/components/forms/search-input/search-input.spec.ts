import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { Modal } from '@shared/components/overlays/modal/modal';
import { beforeEach, describe, expect, it } from 'vitest';
import { SearchInput } from './search-input';

/** Reproduce la búsqueda dentro de un modal para comprobar la propagación real de Escape. */
@Component({
  selector: 'app-search-modal-test-host',
  imports: [Modal, SearchInput],
  template:
    '<app-modal [(open)]="open" title="Usuarios"><app-search-input label="Buscar usuarios" [(value)]="query" /></app-modal>',
})
class SearchModalTestHost {
  readonly open = signal(true);
  readonly query = signal('ana');
}

describe('SearchInput: ayudas de teclado', () => {
  let fixture: ComponentFixture<SearchInput>;
  let input: HTMLInputElement;
  let changes: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInput],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchInput);
    fixture.componentRef.setInput('label', 'Buscar usuarios');
    changes = [];
    fixture.componentInstance.value.subscribe((value) => changes.push(value));
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  /** Devuelve las teclas que puede leer el usuario en la ayuda visible. */
  function keys(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('kbd'),
      (key: Element) => key.textContent?.trim() ?? '',
    );
  }

  /** Envía la misma tecla cancelable que recibe el campo durante una interacción nativa. */
  function escape(): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  it('enfoca y selecciona el texto existente sin modificar la búsqueda', () => {
    fixture.componentRef.setInput('value', 'maria.lopez');
    fixture.detectChanges();
    expect(fixture.componentInstance.focus()).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe('maria.lopez'.length);
    expect(changes).toEqual([]);
    // El icono también es una etiqueta clicable, pero está oculto a la accesibilidad.
    const accessibleLabels = Array.from(input.labels ?? []).filter(
      (label) => label.getAttribute('aria-hidden') !== 'true',
    );
    expect(accessibleLabels).toHaveLength(1);
    expect(accessibleLabels[0].textContent?.trim()).toBe('Buscar usuarios');
  });

  it('informa que no pudo enfocar un campo retirado del documento', () => {
    input.remove();
    expect(fixture.componentInstance.focus()).toBe(false);
  });

  it.each(['field', 'chip'] as const)(
    'limpia con Escape y cede la siguiente pulsación al contenedor en la variante %s',
    (variant) => {
      fixture.componentRef.setInput('variant', variant);
      fixture.componentRef.setInput('value', 'ana');
      fixture.detectChanges();
      let propagated = 0;
      fixture.nativeElement.addEventListener('keydown', () => propagated++);
      input.focus();

      expect(escape().defaultPrevented).toBe(true);
      expect(input.value).toBe('');
      expect(document.activeElement).toBe(input);
      expect(changes).toEqual(['']);
      expect(propagated).toBe(0);

      expect(escape().defaultPrevented).toBe(false);
      expect(document.activeElement).not.toBe(input);
      expect(changes).toEqual(['']);
      expect(propagated).toBe(1);
    },
  );

  it('prioriza la ayuda explícita y recupera la alternativa del contenedor al retirarla', () => {
    expect(keys()).toEqual([]);
    fixture.componentInstance.setContainerShortcut(['Ctrl', 'B']);
    fixture.detectChanges();
    expect(keys()).toEqual(['Ctrl', 'B']);
    fixture.componentRef.setInput('shortcut', ['Alt', 'F']);
    fixture.detectChanges();
    expect(keys()).toEqual(['Alt', 'F']);
    fixture.componentInstance.setContainerShortcut(['Ctrl', 'K']);
    fixture.detectChanges();
    expect(keys()).toEqual(['Alt', 'F']);
    fixture.componentRef.setInput('shortcut', []);
    fixture.detectChanges();
    expect(keys()).toEqual(['Ctrl', 'K']);
    fixture.componentInstance.setContainerShortcut([]);
    fixture.detectChanges();
    expect(keys()).toEqual([]);
    expect(changes).toEqual([]);
  });

  it('muestra carga, limpieza o ayuda según el estado y limpia mediante el botón una sola vez', () => {
    fixture.componentRef.setInput('shortcut', ['Ctrl', 'K']);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search__spinner')).not.toBeNull();
    expect(keys()).toEqual([]);
    fixture.componentRef.setInput('value', 'maria');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.search__clear')).toBeNull();
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    expect(keys()).toEqual([]);
    (fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(changes).toEqual(['']);
    expect(input.value).toBe('');
    expect(keys()).toEqual(['Ctrl', 'K']);
  });

  it('conserva el foco ajeno y bloquea limpieza, Escape y captura al deshabilitarse', () => {
    fixture.componentRef.setInput('value', 'consulta confirmada');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const other = document.createElement('button');
    fixture.nativeElement.append(other);
    other.focus();
    const clear = fixture.nativeElement.querySelector('.search__clear') as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(clear.disabled).toBe(true);
    expect(fixture.componentInstance.focus()).toBe(false);
    expect(document.activeElement).toBe(other);
    clear.click();
    expect(escape().defaultPrevented).toBe(false);
    input.value = 'edición pendiente';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('consulta confirmada');
    expect(input.value).toBe('consulta confirmada');
    expect(changes).toEqual([]);
  });

  it('oculta la ayuda de teclado mientras el campo está deshabilitado', () => {
    fixture.componentRef.setInput('shortcut', ['Ctrl', 'K']);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(keys()).toEqual([]);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(keys()).toEqual(['Ctrl', 'K']);
  });

  it('publica la captura habilitada y refleja las actualizaciones externas', () => {
    input.value = 'producción';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('producción');
    expect(changes).toEqual(['producción']);
    fixture.componentRef.setInput('value', 'calidad');
    fixture.detectChanges();
    expect(input.value).toBe('calidad');
    expect(changes).toEqual(['producción']);
  });
});

describe('SearchInput dentro de Modal', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchModalTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it('conserva el modal al limpiar la búsqueda y permite cerrarlo con el siguiente Escape', async () => {
    const fixture = TestBed.createComponent(SearchModalTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    const first = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    input.dispatchEvent(first);
    fixture.detectChanges();
    expect(first.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.query()).toBe('');
    expect(fixture.componentInstance.open()).toBe(true);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
