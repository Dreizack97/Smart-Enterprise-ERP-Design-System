import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { Select, SelectOption } from './select';

/** Comprueba el valor nativo y las emisiones del control cuando cambia su lista de opciones. */
@Component({
  selector: 'app-select-test-host',
  imports: [Select],
  template: `
    <app-select
      label="Sección"
      [(value)]="value"
      [options]="options()"
      placeholder="Selecciona una sección"
      (valueChange)="changes.push($event)"
    />
  `,
})
class SelectTestHost {
  readonly value = signal('second');
  readonly changes: string[] = [];
  readonly options = signal<readonly SelectOption[]>([
    { value: 'first', label: 'Primera' },
    { value: 'second', label: 'Segunda' },
  ]);
}

describe('Select: sincronización del valor y las opciones', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it('refleja desde el primer render un valor distinto al de la primera opción', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('second');
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('Segunda');
    expect(fixture.componentInstance.value()).toBe('second');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('selecciona el valor inicial dentro de su grupo', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    fixture.componentInstance.options.set([
      { value: 'all', label: 'Todos' },
      { value: 'first', label: 'Primera', group: 'Área A' },
      { value: 'second', label: 'Segunda', group: 'Área B' },
    ]);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('second');
    expect(select.selectedOptions[0]?.parentElement?.tagName).toBe('OPTGROUP');
    expect(select.selectedOptions[0]?.parentElement?.getAttribute('label')).toBe('Área B');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('conserva el valor cuando las opciones llegan después del control', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    const host = fixture.componentInstance;
    const options = host.options();
    host.options.set([]);
    await fixture.whenStable();
    expect(host.value()).toBe('second');
    host.options.set(options);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('second');
    expect(host.changes).toEqual([]);
  });

  it('mantiene la selección al reemplazar, reagrupar y reordenar las opciones', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    await fixture.whenStable();
    fixture.componentInstance.options.set([
      { value: 'second', label: 'Segunda actualizada', group: 'Vigentes' },
      { value: 'first', label: 'Primera actualizada', group: 'Vigentes' },
    ]);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('second');
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('Segunda actualizada');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('restaura el placeholder cuando el formulario limpia el valor', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    fixture.componentInstance.value.set('');
    await fixture.whenStable();
    expect(select.value).toBe('');
    expect(select.selectedOptions[0]?.textContent?.trim()).toBe('Selecciona una sección');
    expect(select.selectedOptions[0]?.disabled).toBe(true);
    fixture.componentInstance.value.set('second');
    await fixture.whenStable();
    expect(select.value).toBe('second');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('emite el cambio del usuario una sola vez y lo conserva al recargar las opciones', async () => {
    const fixture = TestBed.createComponent(SelectTestHost);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'first';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('first');
    expect(fixture.componentInstance.changes).toEqual(['first']);
    fixture.componentInstance.options.update((options) => [...options].reverse());
    await fixture.whenStable();
    expect(select.value).toBe('first');
    expect(fixture.componentInstance.changes).toEqual(['first']);
  });
});
