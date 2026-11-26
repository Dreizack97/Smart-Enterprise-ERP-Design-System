import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageHeader } from './page-header';

/** Reproduce un título dinámico proyectado junto con las migas y acciones de una pantalla. */
@Component({
  selector: 'app-page-header-projection-test-host',
  imports: [PageHeader],
  template: `
    <app-page-header [subtitle]="subtitle()">
      <span title id="projected-title">{{ heading() }}</span>
      <nav breadcrumb id="breadcrumb" aria-label="Ruta">Inicio / Empleados</nav>
      <button actions id="save" type="button" (click)="saved.set(saved() + 1)">Guardar</button>
    </app-page-header>
  `,
})
class PageHeaderProjectionTestHost {
  readonly heading = signal('Buenos días');
  readonly subtitle = signal('Administración de cuentas');
  readonly saved = signal(0);
}

/** Comprueba la compatibilidad del slot de acciones con el atributo HTML nativo de ayuda. */
@Component({
  selector: 'app-page-header-tooltip-test-host',
  imports: [PageHeader],
  template:
    '<app-page-header title="Empleados"><button actions id="help" type="button" title="Mostrar ayuda">Ayuda</button></app-page-header>',
})
class PageHeaderTooltipTestHost {}

describe('PageHeader: título y proyección de contenido', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeader, PageHeaderProjectionTestHost, PageHeaderTooltipTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it('conserva el título de texto de las pantallas existentes dentro de un único h1', () => {
    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('title', 'Empleados');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Empleados');
    expect(fixture.nativeElement.querySelector('.header__subtitle')).toBeNull();
  });

  it('actualiza el título de texto sin conservar el valor anterior ni duplicar el encabezado', () => {
    const fixture = TestBed.createComponent(PageHeader);
    fixture.componentRef.setInput('title', 'Empleados');
    fixture.detectChanges();
    fixture.componentRef.setInput('title', 'Clientes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Clientes');
  });

  it('admite un título proyectado sin exigir el input de texto', () => {
    const fixture = TestBed.createComponent(PageHeaderProjectionTestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('h1 #projected-title')?.textContent?.trim()).toBe(
      'Buenos días',
    );
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Buenos días');
  });

  it('refleja los cambios del título proyectado conservando su nodo', () => {
    const fixture = TestBed.createComponent(PageHeaderProjectionTestHost);
    fixture.detectChanges();
    const projected = fixture.nativeElement.querySelector('#projected-title');
    fixture.componentInstance.heading.set('Buenas tardes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#projected-title')).toBe(projected);
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Buenas tardes');
  });

  it('mantiene separados el título, el subtítulo, las migas y las acciones funcionales', () => {
    const fixture = TestBed.createComponent(PageHeaderProjectionTestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__breadcrumb #breadcrumb')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.header__subtitle')?.textContent?.trim()).toBe(
      'Administración de cuentas',
    );
    const save = fixture.nativeElement.querySelector('.header__actions #save') as HTMLButtonElement;
    expect(save).not.toBeNull();
    save.click();
    expect(fixture.componentInstance.saved()).toBe(1);
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Buenos días');
  });

  it('mantiene en acciones un botón que usa el atributo title como ayuda nativa', () => {
    const fixture = TestBed.createComponent(PageHeaderTooltipTestHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.header__actions #help')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('h1 #help')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Empleados');
  });
});
