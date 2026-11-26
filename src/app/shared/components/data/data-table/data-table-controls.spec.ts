import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTableControls } from './data-table-controls';

describe('DataTableControls: indicador de actividad', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [DataTableControls],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }),
  );

  it('comparte el pulso activo y conserva la selección como botón accesible', () => {
    const fixture = TestBed.createComponent(DataTableControls);
    fixture.componentRef.setInput('hasStatusColumn', true);
    fixture.componentRef.setInput('statusCounts', { all: 3, active: 2, inactive: 1 });
    fixture.componentRef.setInput('statusFilter', 'active');
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.table__status-pill',
    ) as NodeListOf<HTMLButtonElement>;
    const changed = vi.spyOn(fixture.componentInstance.statusChanged, 'emit');

    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].querySelector('.indicator__wave')).not.toBeNull();
    expect(buttons[2].querySelector('.indicator__wave')).toBeNull();
    buttons[2].click();
    expect(changed).toHaveBeenCalledExactlyOnceWith('inactive');
  });

  it('no comunica actividad ni permite filtrar cuando la API no informa el estado', () => {
    const fixture = TestBed.createComponent(DataTableControls);
    fixture.componentRef.setInput('hasStatusColumn', true);
    fixture.componentRef.setInput('statusUnavailable', true);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.table__status-pill',
    ) as NodeListOf<HTMLButtonElement>;
    const changed = vi.spyOn(fixture.componentInstance.statusChanged, 'emit');

    expect(buttons[1].disabled).toBe(true);
    expect(buttons[2].disabled).toBe(true);
    expect(buttons[1].textContent).toContain('—');
    expect(buttons[1].querySelector('app-status-indicator')?.getAttribute('data-tone')).toBe(
      'neutral',
    );
    expect(fixture.nativeElement.querySelector('.indicator__wave')).toBeNull();
    buttons[1].click();
    expect(changed).not.toHaveBeenCalled();
  });

  it('conserva los controles de ordenamiento y umbral de contenedor para resoluciones intermedias', () => {
    const fixture = TestBed.createComponent(DataTableControls);
    fixture.componentRef.setInput('hasStatusColumn', true);
    fixture.componentRef.setInput('columnMenu', true);
    fixture.componentRef.setInput('sortBreakpoint', 820);
    fixture.componentRef.setInput('sortableColumns', [
      { id: 'name', label: 'Nombre', visible: true },
      { id: 'sku', label: 'SKU', visible: true },
    ]);
    fixture.detectChanges();

    const toolbar = fixture.nativeElement.querySelector('.table__toolbar') as HTMLElement;
    const select = fixture.nativeElement.querySelector(
      '.table__mobile-sort-select',
    ) as HTMLSelectElement;
    const dirBtn = fixture.nativeElement.querySelector(
      '.table__mobile-sort-dir',
    ) as HTMLButtonElement;

    expect(toolbar.getAttribute('data-sort-breakpoint')).toBe('820');
    expect(select).not.toBeNull();
    expect(dirBtn).not.toBeNull();
    expect([...select.options].map((option) => option.value)).toEqual(['', 'name', 'sku']);
  });
});
