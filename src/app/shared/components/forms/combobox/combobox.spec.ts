import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Combobox } from './combobox';

describe('Combobox: selección y foco durante la búsqueda', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    // jsdom no calcula geometría; el ancla debe tener una caja visible para abrir la lista.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 10,
      y: 10,
      top: 10,
      bottom: 50,
      left: 10,
      right: 410,
      width: 400,
      height: 40,
      toJSON: () => ({}),
    });
    TestBed.configureTestingModule({
      imports: [Combobox],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Abre resultados mediante la entrada real y espera el debounce del control. */
  async function search() {
    const fixture = TestBed.createComponent(Combobox);
    fixture.componentRef.setInput('options', [
      { value: '52', label: 'Ana María López', hint: 'RFC registrado' },
    ]);
    fixture.componentRef.setInput('minSearchLength', 2);
    fixture.componentRef.setInput('debounceMs', 40);
    fixture.componentRef.setInput('maxResults', 20);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.value = 'Ana';
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: 'Ana', inputType: 'insertText' }),
    );
    await fixture.whenStable();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(document.querySelector('.combo__option')).not.toBeNull();
    });
    return { fixture, input };
  }

  it('confirma una sola vez el identificador al pulsar una opción sin perderla por blur', async () => {
    const { fixture, input } = await search();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    const option = document.querySelector('.combo__option') as HTMLElement;
    expect(option.querySelector('.combo__label')?.textContent).toBe('Ana María López');
    expect(option.querySelector('.combo__hint')?.textContent).toBe('RFC registrado');

    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    option.dispatchEvent(down);
    // Reproduce la pérdida de foco que haría el navegador si nadie cancela mousedown.
    if (!down.defaultPrevented) input.blur();
    await fixture.whenStable();
    option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    option.click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(input);
    expect(changes).toHaveBeenCalledExactlyOnceWith('52');
    expect(input.value).toBe('Ana María López');
    expect(document.querySelector('.combo__popup')).toBeNull();
  });

  it('conserva los espacios escritos antes y después del debounce sin confirmar una selección', async () => {
    const { fixture, input } = await search();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);

    input.value = 'Ana ';
    input.dispatchEvent(
      new InputEvent('input', { bubbles: true, data: ' ', inputType: 'insertText' }),
    );
    await fixture.whenStable();
    expect(input.value).toBe('Ana ');
    await new Promise((resolve) => setTimeout(resolve, 60));
    await fixture.whenStable();

    expect(input.value).toBe('Ana ');
    expect(changes).not.toHaveBeenCalled();
  });

  it('devuelve el foco al campo después de usar el chevron y permite escribir Espacio', async () => {
    const { fixture, input } = await search();
    const toggle = fixture.nativeElement.querySelector('.combo__toggle') as HTMLButtonElement;
    toggle.focus();
    toggle.click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(input);
    const space = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(false);
  });
});
