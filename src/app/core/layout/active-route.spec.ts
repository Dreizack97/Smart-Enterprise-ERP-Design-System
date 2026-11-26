import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActiveRoute } from './active-route';

/** Proporciona un destino mínimo para comprobar la navegación con el Router real. */
@Component({ selector: 'app-active-route-test-page', template: '' })
class ActiveRouteTestPage {}

describe('ActiveRoute: enlaces principales y secciones de rutas hijas', () => {
  let router: Router;
  let harness: RouterTestingHarness;
  const employeeList = '/empleados/lista';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    router.resetConfig([
      { path: 'plantilla-anterior', redirectTo: 'empleados/lista', pathMatch: 'full' },
      { path: 'restringida', component: ActiveRouteTestPage, canActivate: [() => false] },
      { path: '**', component: ActiveRouteTestPage },
    ]);
    harness = await RouterTestingHarness.create();
  });

  it('reconoce la URL ya cargada cuando el servicio se construye después de navegar', async () => {
    await harness.navigateByUrl('/empleados/lista/42?tab=general#personales');
    const active = TestBed.inject(ActiveRoute);
    expect(active.url()).toBe('/empleados/lista/42?tab=general#personales');
    expect(active.fragment()).toBe('personales');
    expect(active.matchesSection(employeeList)).toBe(true);
  });

  it('mantiene la coincidencia exacta de la pantalla principal', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl(employeeList);
    expect(active.matches(employeeList)).toBe(true);
    expect(active.matchesSection(employeeList)).toBe(true);
    expect(active.matchesSection('/empleados/lista/42')).toBe(false);
    expect(active.fragment()).toBe('');
  });

  it.each(['/empleados/lista/42', '/empleados/lista/42/historial'])(
    'conserva activo el enlace principal al navegar a %s',
    async (url) => {
      const active = TestBed.inject(ActiveRoute);
      await harness.navigateByUrl(url);
      expect(active.matchesSection(employeeList)).toBe(true);
      expect(active.matchesSection('/catalogos')).toBe(false);
    },
  );

  it.each(['/empleados/listado', '/empleados/lista-anterior', '/otros/empleados/lista'])(
    'no confunde el enlace principal con un prefijo parecido: %s',
    async (url) => {
      const active = TestBed.inject(ActiveRoute);
      await harness.navigateByUrl(url);
      expect(active.matches(employeeList)).toBe(false);
      expect(active.matchesSection(employeeList)).toBe(false);
    },
  );

  it('ignora los parámetros de consulta y conserva la distinción del ancla en una ficha', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl('/empleados/lista/42?volver=%2Fcatalogos&activo=true#laborales');
    expect(active.matchesSection(employeeList)).toBe(true);
    expect(active.matchesSection(employeeList, 'laborales')).toBe(true);
    expect(active.matchesSection(employeeList, 'personales')).toBe(false);
    expect(active.matchesSection('/catalogos', 'laborales')).toBe(false);
  });

  it('marca únicamente la sección que coincide cuando varios enlaces comparten una pantalla', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl('/formularios#contacto');
    expect(active.matchesSection('/formularios', 'contacto')).toBe(true);
    expect(active.matchesSection('/formularios', 'identidad')).toBe(false);
    expect(active.matchesSection('/formularios')).toBe(true);
    await harness.navigateByUrl('/formularios');
    expect(active.matchesSection('/formularios', 'contacto')).toBe(false);
  });

  it('actualiza ruta y fragmento al navegar sin conservar activo el enlace anterior', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl('/empleados/lista/42#personales');
    expect(active.matchesSection(employeeList, 'personales')).toBe(true);
    await harness.navigateByUrl('/empleados/lista/42#laborales');
    expect(active.fragment()).toBe('laborales');
    expect(active.matchesSection(employeeList, 'personales')).toBe(false);
    expect(active.matchesSection(employeeList, 'laborales')).toBe(true);
    await harness.navigateByUrl('/catalogos');
    expect(active.matchesSection(employeeList)).toBe(false);
    expect(active.matchesSection('/catalogos')).toBe(true);
    expect(active.fragment()).toBe('');
  });

  it('evalúa el destino final de una redirección en lugar de la URL de entrada', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl('/plantilla-anterior');
    expect(active.url()).toBe(employeeList);
    expect(active.matchesSection(employeeList)).toBe(true);
    expect(active.matchesSection('/plantilla-anterior')).toBe(false);
  });

  it('conserva la ruta activa cuando un guard cancela la navegación', async () => {
    const active = TestBed.inject(ActiveRoute);
    await harness.navigateByUrl('/empleados/lista/42#personales');
    expect(await router.navigateByUrl('/restringida')).toBe(false);
    expect(active.url()).toBe('/empleados/lista/42#personales');
    expect(active.matchesSection(employeeList, 'personales')).toBe(true);
    expect(active.matchesSection('/restringida')).toBe(false);
  });
});
