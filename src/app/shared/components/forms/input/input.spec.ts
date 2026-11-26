import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { provideRouter } from '@angular/router';
import { IconName, provideAppIcons } from '@core/icons/lucide-icons';
import { ControlError } from '@shared/models/form-control.model';
import { beforeEach, describe, expect, it } from 'vitest';
import { Input, InputType } from './input';

/** Simula la confirmación y los errores enviados por una pantalla al control compartido. */
@Component({
  selector: 'app-input-test-host',
  imports: [Input],
  template: `
    <app-input
      label="Campo"
      [(value)]="value"
      [type]="type()"
      [maxlength]="maxlength()"
      [minlength]="minlength()"
      [allowedChars]="allowedChars()"
      [error]="error()"
      [errors]="errors()"
      [touched]="touched()"
      [disabled]="disabled()"
      [showValidCheck]="showValidCheck()"
      [uppercase]="uppercase()"
      [icon]="icon()"
    />
  `,
})
class InputTestHost {
  readonly value = signal('');
  readonly type = signal<InputType>('text');
  readonly maxlength = signal<number | null>(null);
  readonly minlength = signal<number | null>(null);
  readonly allowedChars = signal('');
  readonly error = signal('');
  readonly errors = signal<readonly ControlError[]>([]);
  readonly touched = signal(false);
  readonly disabled = signal(false);
  readonly showValidCheck = signal(false);
  readonly uppercase = signal(false);
  readonly icon = signal<IconName | null>(null);
}

/** Comprueba la integración con la validación declarativa real de Signal Forms. */
@Component({
  selector: 'app-input-form-test-host',
  imports: [Input, FormField],
  template: `
    <app-input
      label="Código"
      [formField]="codeForm.code"
      [showValidCheck]="codeForm.code().valid() && !codeForm.code().pending()"
    />
  `,
})
class InputFormTestHost {
  readonly data = signal({ code: '' });
  readonly codeForm = form(this.data, (path) => {
    required(path.code, { message: 'Escribe el código.' });
    minLength(path.code, 2, { message: 'Escribe al menos dos caracteres.' });
  });
}

describe('Input: confirmación de validez controlada', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputTestHost, InputFormTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it.each([
    { value: 'LOPA900101HMNLPA01', type: 'text', min: null, max: 18 },
    { value: 'LOPA900101AB1', type: 'text', min: null, max: 13 },
    { value: '12345678901', type: 'text', min: null, max: 11 },
    { value: '1234', type: 'text', min: null, max: 4 },
    { value: 'Ana', type: 'text', min: 2, max: null },
    { value: 'ana@empresa.com', type: 'email', min: null, max: null },
    { value: '5512345678', type: 'tel', min: null, max: null },
  ] as const)('no deduce validez por tipo o longitud: $value', ({ value, type, min, max }) => {
    const fixture = TestBed.createComponent(InputTestHost);
    const host = fixture.componentInstance;
    host.value.set(value);
    host.type.set(type);
    host.minlength.set(min);
    host.maxlength.set(max);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('input')
        .classList.contains('field-control--with-valid-check'),
    ).toBe(false);
  });

  it('muestra y retira la confirmación únicamente cuando la pantalla lo indica', () => {
    const fixture = TestBed.createComponent(InputTestHost);
    const host = fixture.componentInstance;
    host.value.set('Valor revisado');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    host.showValidCheck.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).not.toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('input')
        .classList.contains('field-control--with-valid-check'),
    ).toBe(true);
    host.showValidCheck.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    expect(host.value()).toBe('Valor revisado');
  });

  it.each(['', '   ', '\t\n'])(
    'omite el indicador en un valor vacío aunque se solicite: %j',
    (value) => {
      const fixture = TestBed.createComponent(InputTestHost);
      fixture.componentInstance.showValidCheck.set(true);
      fixture.componentInstance.value.set(value);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    },
  );

  it('prioriza errores manuales y declarativos, incluso sin mensaje o antes del blur', () => {
    const fixture = TestBed.createComponent(InputTestHost);
    const host = fixture.componentInstance;
    host.value.set('Valor revisado');
    host.showValidCheck.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).not.toBeNull();
    host.error.set('Valor duplicado');
    fixture.detectChanges();
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    expect(nativeInput.getAttribute('aria-invalid')).toBe('true');
    expect(
      document.getElementById(nativeInput.getAttribute('aria-describedby')!)?.textContent,
    ).toContain('Valor duplicado');
    host.error.set('');
    host.errors.set([{ kind: 'server' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    host.errors.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).not.toBeNull();
  });

  it('oculta el indicador mientras el campo está deshabilitado y conserva su valor', () => {
    const fixture = TestBed.createComponent(InputTestHost);
    const host = fixture.componentInstance;
    host.value.set('Valor revisado');
    host.showValidCheck.set(true);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').disabled).toBe(true);
    host.disabled.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.input-valid-check')).not.toBeNull();
    expect(host.value()).toBe('Valor revisado');
  });

  it('conserva la etiqueta y el icono inicial mientras muestra un check decorativo al final', () => {
    const fixture = TestBed.createComponent(InputTestHost);
    fixture.componentInstance.value.set('Valor revisado');
    fixture.componentInstance.icon.set('user');
    fixture.componentInstance.showValidCheck.set(true);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const nativeInput = root.querySelector('input')!;
    expect(root.querySelector('label')?.htmlFor).toBe(nativeInput.id);
    expect(root.querySelector('label')?.textContent).toContain('Campo');
    expect(root.querySelector('.field-affix--start app-icon')).not.toBeNull();
    expect(
      root.querySelector('.field-affix--end.input-valid-check')?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(root.querySelectorAll('input')).toHaveLength(1);
    expect(nativeInput.getAttribute('aria-invalid')).toBeNull();
  });

  it('conserva la captura, el saneamiento y los límites nativos sin mostrar éxito automático', () => {
    const fixture = TestBed.createComponent(InputTestHost);
    const host = fixture.componentInstance;
    host.uppercase.set(true);
    host.allowedChars.set('[A-Z0-9]');
    host.minlength.set(2);
    host.maxlength.set(8);
    fixture.detectChanges();
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    nativeInput.value = 'ab-12';
    nativeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.value()).toBe('AB12');
    expect(nativeInput.value).toBe('AB12');
    expect(nativeInput.minLength).toBe(2);
    expect(nativeInput.maxLength).toBe(8);
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
  });

  it('recibe la validez de Signal Forms y retira el check cuando el usuario vuelve a un valor inválido', async () => {
    const fixture = TestBed.createComponent(InputFormTestHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    nativeInput.value = 'AB';
    nativeInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.data().code).toBe('AB');
    expect(host.codeForm.code().valid()).toBe(true);
    expect(fixture.nativeElement.querySelector('.input-valid-check')).not.toBeNull();
    nativeInput.value = 'A';
    nativeInput.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(host.codeForm.code().valid()).toBe(false);
    expect(fixture.nativeElement.querySelector('.input-valid-check')).toBeNull();
    nativeInput.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.codeForm.code().touched()).toBe(true);
    expect(nativeInput.getAttribute('aria-invalid')).toBe('true');
  });
});
