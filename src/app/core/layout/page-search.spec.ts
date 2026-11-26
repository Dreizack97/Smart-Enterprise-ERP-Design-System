import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, DestroyRef, TemplateRef, inject, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageSearch } from './page-search';

@Component({ template: '<ng-template #panel><span>Resultados</span></ng-template>' })
class SearchHost {
  readonly destroyRef = inject(DestroyRef);
  readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
}

describe('PageSearch', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    });
  });

  it('inicia deshabilitado con textos predeterminados', () => {
    const search = TestBed.inject(PageSearch);

    expect(search.enabled()).toBe(false);
    expect(search.query()).toBe('');
    expect(search.placeholder()).toBe('Buscar...');
    expect(search.label()).toBe('Buscar');
  });

  it('se habilita al activar una vista y se limpia al destruirse', () => {
    const search = TestBed.inject(PageSearch);
    const fixture = TestBed.createComponent(SearchHost);

    search.activate(
      { placeholder: 'Buscar campo o sección...', label: 'Buscar en la página' },
      fixture.componentInstance.destroyRef,
    );
    search.setQuery('movimientos');

    expect(search.enabled()).toBe(true);
    expect(search.query()).toBe('movimientos');
    expect(search.placeholder()).toBe('Buscar campo o sección...');
    expect(search.label()).toBe('Buscar en la página');

    fixture.destroy();

    expect(search.enabled()).toBe(false);
    expect(search.query()).toBe('');
    expect(search.placeholder()).toBe('Buscar...');
  });

  it('evita que la destrucción de una vista previa apague el buscador de la nueva', () => {
    const search = TestBed.inject(PageSearch);
    const previous = TestBed.createComponent(SearchHost);
    const next = TestBed.createComponent(SearchHost);

    search.activate({ placeholder: 'Vista anterior' }, previous.componentInstance.destroyRef);
    search.activate({ placeholder: 'Vista nueva' }, next.componentInstance.destroyRef);
    previous.destroy();

    expect(search.enabled()).toBe(true);
    expect(search.placeholder()).toBe('Vista nueva');

    next.destroy();
    expect(search.enabled()).toBe(false);
    expect(search.panel()).toBeNull();
  });

  it('adjunta un panel de resultados, permite descartar la búsqueda y se limpia al destruirse', () => {
    const search = TestBed.inject(PageSearch);
    const fixture = TestBed.createComponent(SearchHost);
    fixture.detectChanges();

    search.activate({ placeholder: 'Buscar en expediente' }, fixture.componentInstance.destroyRef);
    search.attachPanel(fixture.componentInstance.panel(), fixture.componentInstance.destroyRef);
    search.setQuery('curp');
    const initialDismissVersion = search.dismissVersion();

    expect(search.panel()).toBe(fixture.componentInstance.panel());
    search.dismiss();
    expect(search.query()).toBe('');
    expect(search.dismissVersion()).toBe(initialDismissVersion + 1);

    fixture.destroy();
    expect(search.panel()).toBeNull();
  });
});
