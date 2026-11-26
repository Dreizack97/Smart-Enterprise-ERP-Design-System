import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea: tamaño compacto predeterminado', () => {
  let fixture: ComponentFixture<Textarea>;
  let input: HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Textarea],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Textarea);
    fixture.componentRef.setInput('label', 'Comentarios');
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('textarea');
  });

  /** Captura texto mediante el evento nativo que utilizan los formularios. */
  function type(text: string): void {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('presenta el control compacto sin configuración adicional y conserva su etiqueta accesible', () => {
    expect(input.classList.contains('field-control--compact')).toBe(true);
    expect(input.value).toBe('');
    expect(fixture.nativeElement.querySelector(`label[for="${input.id}"]`)?.textContent).toContain(
      'Comentarios',
    );
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('permite alternar la altura sin perder el texto, el contador ni las filas explícitas', () => {
    fixture.componentRef.setInput('maxLength', 20);
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();
    const changes: string[] = [];
    fixture.componentInstance.value.subscribe((value) => changes.push(value));
    type('Primera\nSegunda');

    for (const compact of [false, true]) {
      fixture.componentRef.setInput('compact', compact);
      fixture.detectChanges();
      expect(input.classList.contains('field-control--compact')).toBe(compact);
      expect(input.value).toBe('Primera\nSegunda');
      expect(input.rows).toBe(5);
      expect(fixture.nativeElement.querySelector('.textarea__counter')?.textContent?.trim()).toBe(
        '15 / 20',
      );
    }
    expect(changes).toEqual(['Primera\nSegunda']);
  });

  it('conserva el límite nativo y avisa al acercarse al máximo de caracteres', () => {
    fixture.componentRef.setInput('maxLength', 10);
    fixture.detectChanges();
    type('123456789');
    expect(input.maxLength).toBe(10);
    expect(fixture.nativeElement.querySelector('.textarea__counter--near')).toBeNull();
    type('1234567890');
    expect(
      fixture.nativeElement.querySelector('.textarea__counter--near')?.textContent?.trim(),
    ).toBe('10 / 10');
  });

  it('conserva el error y su asociación accesible al desactivar el modo compacto', () => {
    type('Motivo pendiente');
    fixture.componentRef.setInput('error', 'Completa el motivo.');
    fixture.componentRef.setInput('compact', false);
    fixture.detectChanges();
    const errorId = input.getAttribute('aria-describedby');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(errorId).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`[id="${errorId}"]`)?.textContent).toContain(
      'Completa el motivo.',
    );
    expect(input.value).toBe('Motivo pendiente');

    fixture.componentRef.setInput('error', '');
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('mantiene legible el contenido externo cuando el campo está deshabilitado', () => {
    fixture.componentRef.setInput('value', 'Comentario confirmado\nSegunda línea');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.value).toBe('Comentario confirmado\nSegunda línea');
    fixture.componentRef.setInput('value', 'Comentario actualizado');
    fixture.detectChanges();
    expect(input.value).toBe('Comentario actualizado');
  });

  it('conserva los saltos de línea y el saneamiento de caracteres durante la captura', () => {
    fixture.componentRef.setInput('allowedChars', '[\\p{L}\\s]');
    fixture.detectChanges();
    type('Nota 123\nVálida!');
    expect(input.value).toBe('Nota \nVálida');
    expect(fixture.componentInstance.value()).toBe('Nota \nVálida');
  });
});
