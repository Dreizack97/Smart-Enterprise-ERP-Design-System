import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { DatePicker } from './date-picker';

describe('DatePicker: validez de la captura', () => {
  let fixture: ComponentFixture<DatePicker>;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePicker],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DatePicker);
    fixture.componentRef.setInput('value', '2026-09-08');
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  /** Simula la escritura real para comprobar la captura antes de perder el foco. */
  function type(text: string): void {
    input.value = text;
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    fixture.detectChanges();
  }

  it('expone una fecha inicial confirmada sin invalidarla', () => {
    expect(input.value).toBe('08/09/2026');
    expect(fixture.componentInstance.invalid()).toBe(false);
  });

  it('detecta una captura incompleta antes del blur y conserva la fecha confirmada', () => {
    type('10/10/202');
    expect(input.value).toBe('10/10/202');
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
    expect(fixture.componentInstance.invalid()).toBe(true);
  });

  it('detecta una fecha imposible y conserva el texto al salir del campo', () => {
    type('31/02/2026');
    expect(fixture.componentInstance.invalid()).toBe(true);
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(input.value).toBe('31/02/2026');
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
    expect(fixture.componentInstance.invalid()).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('confirma una fecha completa válida sin esperar al blur', () => {
    type('29/02/2028');
    expect(fixture.componentInstance.value()).toBe('2028-02-29');
    expect(fixture.componentInstance.invalid()).toBe(false);
  });

  it('limpia el error al corregir el texto hacia la misma fecha confirmada', () => {
    type('31/02/2026');
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    type('08/09/2026');
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
    expect(fixture.componentInstance.invalid()).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('permite vaciar una fecha sin confundir la captura con la validación de obligatoriedad', () => {
    fixture.componentRef.setInput('required', true);
    type('');
    expect(fixture.componentInstance.value()).toBe('');
    expect(fixture.componentInstance.invalid()).toBe(false);
    expect(input.required).toBe(true);
  });

  it('sincroniza una nueva fecha externa después de una captura inválida', () => {
    type('31/02/2026');
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    fixture.componentRef.setInput('value', '2027-01-15');
    fixture.detectChanges();
    expect(input.value).toBe('15/01/2027');
    expect(fixture.componentInstance.invalid()).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('espera al blur para interpretar un año de dos cifras', () => {
    type('08/09/26');
    expect(fixture.componentInstance.invalid()).toBe(true);
    input.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(input.value).toBe('08/09/2026');
    expect(fixture.componentInstance.invalid()).toBe(false);
  });
});

describe('DatePicker: navegación por año, mes y día', () => {
  let fixture: ComponentFixture<DatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePicker],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DatePicker);
    fixture.componentRef.setInput('value', '2026-09-08');
    fixture.detectChanges();
  });

  /** Obtiene controles reales del calendario para ejercitar la navegación pública. */
  function element(selector: string): HTMLElement {
    const target = fixture.nativeElement.querySelector(selector) as HTMLElement | null;
    expect(target, selector).not.toBeNull();
    return target!;
  }

  /** Espera al renderizado para comprobar también el foco de la vista resultante. */
  async function click(target: HTMLElement): Promise<void> {
    target.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** Abre la exploración sin invocar métodos internos del componente. */
  async function openYears(value = '2026-09-08'): Promise<void> {
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('startView', 'years');
    fixture.detectChanges();
    await click(element('[aria-label="Abrir el calendario"]'));
  }

  /** Localiza un año o un mes por su texto visible. */
  function choice(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.picker__choices button'),
    ) as HTMLButtonElement[];
    const target = buttons.find((button) => button.textContent?.trim() === label);
    expect(target, label).toBeDefined();
    return target!;
  }

  it('conserva la apertura habitual por días y enfoca la fecha seleccionada', async () => {
    await click(element('[aria-label="Abrir el calendario"]'));
    expect(fixture.nativeElement.querySelector('app-date-grid')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.picker__choices')).toBeNull();
    expect(document.activeElement).toBe(element('[data-iso="2026-09-08"]'));
  });

  it('abre el bloque que contiene la fecha y enfoca el año seleccionado', async () => {
    await openYears();
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('2016–2027');
    expect(choice('2026').getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(choice('2026'));
    expect(fixture.nativeElement.querySelector('app-date-grid')).toBeNull();
  });

  it('confirma la fecha y emite el cambio únicamente después de elegir el día', async () => {
    const changes: string[] = [];
    fixture.componentInstance.value.subscribe((value) => changes.push(value));
    await openYears();
    await click(choice('2025'));
    expect(document.activeElement).toBe(choice('septiembre'));
    expect(choice('septiembre').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
    expect(changes).toEqual([]);

    await click(choice('febrero'));
    expect(fixture.nativeElement.querySelector('app-date-grid')).not.toBeNull();
    expect(document.activeElement).toBe(element('[data-iso="2025-02-01"]'));
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
    expect(changes).toEqual([]);

    await click(element('[data-iso="2025-02-14"]'));
    expect(fixture.componentInstance.value()).toBe('2025-02-14');
    expect(changes).toEqual(['2025-02-14']);
    expect(element('input').getAttribute('aria-invalid')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('permite regresar del mes al año sin confirmar la exploración', async () => {
    await openYears();
    await click(choice('2025'));
    await click(element('[aria-label="Volver a elegir año"]'));
    expect(document.activeElement).toBe(choice('2025'));
    expect(choice('2025').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
  });

  it('explora bloques en ambas direcciones y enfoca una opción disponible', async () => {
    await openYears();
    await click(element('[aria-label="Años siguientes"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('2028–2039');
    expect(document.activeElement).toBe(choice('2028'));
    expect(fixture.componentInstance.value()).toBe('2026-09-08');

    await click(element('[aria-label="Años anteriores"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('2016–2027');
    expect(document.activeElement).toBe(choice('2026'));
  });

  it('alcanza el último bloque parcial sin superar los años de cuatro cifras', async () => {
    await openYears('9990-09-08');
    await click(element('[aria-label="Años siguientes"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('9996–9999');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.picker__choices button'),
        (button: Element) => button.textContent?.trim(),
      ),
    ).toEqual(['9996', '9997', '9998', '9999']);
    expect((element('[aria-label="Años siguientes"]') as HTMLButtonElement).disabled).toBe(true);
    await click(element('[aria-label="Años siguientes"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('9996–9999');
    expect(fixture.componentInstance.value()).toBe('9990-09-08');

    await click(element('[aria-label="Años anteriores"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('9984–9995');
  });

  it('limita el primer bloque a los años que Date interpreta literalmente', async () => {
    await openYears('0108-09-08');
    await click(element('[aria-label="Años anteriores"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('100–107');
    expect(fixture.nativeElement.querySelectorAll('.picker__choices button')).toHaveLength(8);
    expect(document.activeElement).toBe(choice('100'));
    expect((element('[aria-label="Años anteriores"]') as HTMLButtonElement).disabled).toBe(true);
    await click(element('[aria-label="Años anteriores"]'));
    expect(element('[aria-live="polite"]').textContent?.trim()).toBe('100–107');
    expect(fixture.componentInstance.value()).toBe('0108-09-08');
  });

  it('abre correctamente el último bloque cuando la fecha confirmada pertenece a él', async () => {
    await openYears('9999-09-08');
    expect(document.activeElement).toBe(choice('9999'));
    expect((element('[aria-label="Años siguientes"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('descarta la exploración al cerrar con Escape y reabre desde la fecha confirmada', async () => {
    await openYears();
    await click(choice('2025'));
    fixture.nativeElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.componentInstance.value()).toBe('2026-09-08');

    await click(element('[aria-label="Abrir el calendario"]'));
    expect(document.activeElement).toBe(choice('2026'));
  });

  it('impide abrir el selector cuando el campo está deshabilitado', async () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('startView', 'years');
    fixture.detectChanges();
    await click(element('[aria-label="Abrir el calendario"]'));
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.componentInstance.value()).toBe('2026-09-08');
  });
});
