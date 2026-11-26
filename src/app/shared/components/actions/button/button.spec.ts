import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IconName, provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { BUTTON_VARIANTS, Button, ButtonVariant } from './button';

@Component({
  selector: 'app-button-test-host',
  imports: [Button],
  template: `
    <app-button
      [variant]="variant()"
      [loading]="loading()"
      [disabled]="disabled()"
      [success]="success()"
      [successLabel]="successLabel()"
      [ariaLabel]="ariaLabel()"
      [icon]="icon()"
      (pressed)="clicks.set(clicks() + 1)"
    >
      {{ label() }}
    </app-button>
  `,
})
class ButtonTestHost {
  readonly variant = signal<ButtonVariant>('primary');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly success = signal(false);
  readonly successLabel = signal('¡Guardado!');
  readonly clicks = signal(0);
  readonly label = signal('Guardar');
  readonly ariaLabel = signal('');
  readonly icon = signal<IconName | null>(null);
}

describe('Button: confirmación controlada', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it.each(BUTTON_VARIANTS)(
    'no declara éxito al terminar una carga sin confirmación: %s',
    (variant) => {
      const fixture = TestBed.createComponent(ButtonTestHost);
      const host = fixture.componentInstance;
      host.variant.set(variant);
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btn.classList.contains('btn--success')).toBe(false);

      host.loading.set(true);
      fixture.detectChanges();
      expect(btn.classList.contains('btn--loading')).toBe(true);

      host.loading.set(false);
      fixture.detectChanges();
      expect(btn.classList.contains('btn--success')).toBe(false);
      expect(btn.querySelector('.btn__success-label')).toBeNull();
      expect(btn.textContent).toContain('Guardar');
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
    },
  );

  it('muestra éxito solo al confirmarlo y permite retirarlo desde la pantalla', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    const host = fixture.componentInstance;
    host.success.set(true);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.classList.contains('btn--success')).toBe(true);
    expect(btn.disabled).toBe(true);
    expect(btn.querySelector('.btn__success-label')?.textContent?.trim()).toBe('¡Guardado!');
    expect(btn.querySelector('.btn__check')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('¡Guardado!');

    host.success.set(false);
    fixture.detectChanges();
    expect(btn.classList.contains('btn--success')).toBe(false);
    expect(btn.disabled).toBe(false);
    expect(btn.querySelector('.btn__label')?.classList.contains('sr-only')).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
  });

  it('prioriza el estado de carga sobre una confirmación explícita', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    fixture.componentInstance.success.set(true);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.querySelector('.btn__spinner')).not.toBeNull();
    expect(btn.querySelector('.btn__check')).toBeNull();
    expect(btn.classList.contains('btn--success')).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
  });

  it('conserva disabled al retirar una confirmación y no emite acciones inactivas', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    btn.click();
    expect(host.clicks()).toBe(1);
    host.success.set(true);
    fixture.detectChanges();
    btn.click();
    expect(host.clicks()).toBe(1);
    host.disabled.set(true);
    host.success.set(false);
    fixture.detectChanges();
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(host.clicks()).toBe(1);
    host.disabled.set(false);
    fixture.detectChanges();
    btn.click();
    expect(host.clicks()).toBe(2);
  });

  it('personaliza la confirmación sin cambiar el nombre accesible de la acción', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    fixture.componentInstance.successLabel.set('¡Actualizado!');
    fixture.componentInstance.ariaLabel.set('Guardar datos');
    fixture.componentInstance.success.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Guardar datos');
    expect(btn.querySelector('.btn__label')?.textContent?.trim()).toBe('Guardar');
    expect(btn.querySelector('.btn__label')?.classList.contains('sr-only')).toBe(true);
    expect(btn.querySelector('.btn__success-label')?.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe(
      '¡Actualizado!',
    );
  });

  it('mantiene el contenido original cuando se omite la etiqueta de confirmación', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    fixture.componentInstance.successLabel.set('');
    fixture.componentInstance.success.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.querySelector('.btn__success-label')).toBeNull();
    expect(btn.querySelector('.btn__label')?.classList.contains('sr-only')).toBe(false);
    expect(btn.textContent).toContain('Guardar');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe(
      'Operación completada',
    );
  });

  it('conserva el nombre del botón de solo icono al mostrar una confirmación textual', () => {
    const fixture = TestBed.createComponent(ButtonTestHost);
    fixture.componentInstance.label.set('');
    fixture.componentInstance.icon.set('check');
    fixture.componentInstance.ariaLabel.set('Confirmar datos');
    fixture.componentInstance.success.set(true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Confirmar datos');
    expect(btn.classList.contains('btn--success-text')).toBe(true);
    expect(btn.querySelector('.btn__success-label')?.textContent).toBe('¡Guardado!');
  });
});
