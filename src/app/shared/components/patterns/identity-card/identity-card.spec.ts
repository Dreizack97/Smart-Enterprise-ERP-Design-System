import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { IdentityCard, IdentityFact } from './identity-card';

describe('IdentityCard', () => {
  let fixture: ComponentFixture<IdentityCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdentityCard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IdentityCard);
    fixture.componentRef.setInput('name', 'Usuario de prueba');
    fixture.detectChanges();
  });

  it('presenta completos el nombre y el identificador de la cuenta', () => {
    const name = 'María Fernanda López Martínez';
    const subtitle = '@maria.fernanda.lopez.martinez.administracion.regional';
    fixture.componentRef.setInput('name', name);
    fixture.componentRef.setInput('subtitle', subtitle);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3')?.textContent?.trim()).toBe(name);
    expect(fixture.nativeElement.querySelector('.identity__subtitle')?.textContent?.trim()).toBe(
      subtitle,
    );
  });

  it('conserva el texto completo y la asociación semántica de las etiquetas con valores extensos', () => {
    const facts: readonly IdentityFact[] = [
      { label: 'Roles', value: 'Administrador, Supervisor de producción, Responsable de calidad' },
      { label: 'Empleado', value: 'María Fernanda López Martínez' },
      {
        label: 'Depto.',
        value: 'CoordinacionRegionalDeAdministracionDeRecursosHumanosYDesarrolloOrganizacional',
      },
      { label: 'No. empleado', value: '000012345678901234567890' },
      { label: 'Verificación en dos pasos', value: 'Inactiva' },
    ];
    fixture.componentRef.setInput('facts', facts);
    fixture.detectChanges();
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('dl .identity__fact'),
    ) as HTMLElement[];
    expect(rows).toHaveLength(facts.length);
    expect(
      rows.map((row) => ({
        label: row.querySelector('dt')?.textContent?.trim(),
        value: row.querySelector('dd')?.textContent?.trim(),
      })),
    ).toEqual(facts);
  });

  it('actualiza los metadatos al cambiar de cuenta sin conservar datos anteriores', () => {
    fixture.componentRef.setInput('facts', [{ label: 'Depto.', value: 'Administración' }]);
    fixture.detectChanges();
    fixture.componentRef.setInput('name', 'Otra cuenta');
    fixture.componentRef.setInput('facts', [{ label: 'Roles', value: 'Consulta' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h3')?.textContent?.trim()).toBe('Otra cuenta');
    expect(fixture.nativeElement.querySelectorAll('dt')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('dt')?.textContent?.trim()).toBe('Roles');
    expect(fixture.nativeElement.querySelector('dd')?.textContent?.trim()).toBe('Consulta');
    expect(fixture.nativeElement.textContent).not.toContain('Administración');
  });

  it('omite los bloques opcionales cuando no hay subtítulo ni metadatos', () => {
    expect(fixture.nativeElement.querySelector('.identity__subtitle')).toBeNull();
    expect(fixture.nativeElement.querySelector('dl')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-avatar')).not.toBeNull();
  });
});
