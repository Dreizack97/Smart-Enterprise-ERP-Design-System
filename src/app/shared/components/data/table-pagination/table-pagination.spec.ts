import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, computed, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataTable } from '../data-table/data-table';
import { TableColumn } from '../data-table/data-table.model';
import { createDataTablePagination, createTablePagination } from '../data-table/table-state';
import { TablePagination } from './table-pagination';

interface Item {
  readonly id: number;
  readonly name: string;
  readonly isActive: boolean;
}

/** Integra las tablas reales para probar filtros, orden y estados independientes. */
@Component({
  selector: 'app-tables-pagination-test-host',
  imports: [DataTable, TablePagination],
  template: `
    <app-data-table
      #first
      [page]="firstState.page()"
      [pageSize]="firstState.pageSize()"
      [rows]="filteredRows()"
      [columns]="columns"
    />
    <app-table-pagination [state]="firstState" />
    <app-data-table
      #second
      [rows]="rows()"
      [columns]="columns"
      [page]="secondState.page()"
      [pageSize]="secondState.pageSize()"
    />
    <app-table-pagination [state]="secondState" compact />
  `,
})
class TablesHost {
  readonly query = signal('');
  readonly rows = signal<readonly Item[]>(
    Array.from({ length: 27 }, (_, index) => ({
      id: index + 1,
      name: `Registro ${String(27 - index).padStart(2, '0')}`,
      isActive: index < 18,
    })),
  );
  readonly filteredRows = computed(() =>
    this.rows().filter((row) => row.name.includes(this.query())),
  );
  readonly columns: readonly TableColumn<Item>[] = [
    {
      id: 'name',
      header: 'Nombre',
      cell: (row) => row.name,
      sortable: true,
      mobileRole: 'primary',
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
      mobileRole: 'none',
    },
  ];
  readonly first = viewChild<DataTable<Item>>('first');
  readonly second = viewChild<DataTable<Item>>('second');
  readonly firstState = createDataTablePagination({
    table: this.first,
    rows: this.filteredRows,
    resetOn: this.query,
  });
  readonly secondState = createDataTablePagination({
    table: this.second,
    rows: this.rows,
    initialPageSize: 5,
    pageSizes: [5, 10, 25],
  });
}

describe('Pie compartido de tablas', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TablePagination],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }),
  );

  it('coordina selector, resumen y botones con una sola instancia de estado', () => {
    const state = createTablePagination({ totalItems: () => 27 });
    const fixture = TestBed.createComponent(TablePagination);
    fixture.componentRef.setInput('state', state);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Mostrando 1–10 de 27 registros');
    root.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')?.click();
    fixture.detectChanges();
    expect(state.page()).toBe(2);
    expect(root.textContent).toContain('Mostrando 11–20 de 27 registros');
    const select = root.querySelector('select') as HTMLSelectElement;
    select.value = '25';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(state.pageSize()).toBe(25);
    expect(state.page()).toBe(1);
    expect(root.textContent).toContain('Mostrando 1–25 de 27 registros');
  });

  it('conserva el resumen y selector sin navegación inútil cuando no hay resultados', () => {
    const fixture = TestBed.createComponent(TablePagination);
    fixture.componentRef.setInput('state', createTablePagination({ totalItems: () => 0 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin registros');
    expect(fixture.nativeElement.querySelector('select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('sincroniza actividad, búsqueda y orden con el resultado completo antes del recorte', async () => {
    const fixture = TestBed.createComponent(TablesHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const firstTable = root.querySelector('app-data-table') as HTMLElement;
    host.firstState.setPage(3);
    await fixture.whenStable();
    expect(firstTable.querySelectorAll('.table__row')).toHaveLength(7);
    firstTable.querySelectorAll<HTMLButtonElement>('.table__status-pill')[1].click();
    await fixture.whenStable();
    expect(host.firstState.page()).toBe(1);
    expect(host.firstState.totalItems()).toBe(18);
    expect(host.firstState.processedRows()).toHaveLength(18);
    host.firstState.setPage(2);
    const sort = firstTable.querySelector('select') as HTMLSelectElement;
    sort.value = 'name';
    sort.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(host.firstState.page()).toBe(1);
    expect(host.firstState.processedRows().map((row) => row.name)).toEqual(
      Array.from({ length: 18 }, (_, index) => `Registro ${String(index + 10).padStart(2, '0')}`),
    );
    host.firstState.setPage(2);
    host.query.set('Registro 1');
    await fixture.whenStable();
    expect(host.firstState.page()).toBe(1);
    expect(host.firstState.totalItems()).toBe(10);
    expect(host.secondState.totalItems()).toBe(27);
    expect(host.secondState.pageSize()).toBe(5);
  });

  it('mantiene páginas independientes y permite volver al tamaño compacto después de quedar en una página', async () => {
    const fixture = TestBed.createComponent(TablesHost);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const footer = fixture.nativeElement.querySelectorAll('app-table-pagination')[1] as HTMLElement;
    expect(footer.classList.contains('table-pagination--compact')).toBe(true);
    footer.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!.click();
    await fixture.whenStable();
    expect(host.secondState.page()).toBe(2);
    expect(host.firstState.page()).toBe(1);
    const select = footer.querySelector('select') as HTMLSelectElement;
    select.value = '25';
    select.dispatchEvent(new Event('change'));
    host.rows.set(host.rows().slice(0, 12));
    await fixture.whenStable();
    expect(host.secondState.page()).toBe(1);
    expect(footer.querySelector('nav')).toBeNull();
    expect(footer.querySelector('select')).toBe(select);
    select.value = '5';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(host.secondState.pageCount()).toBe(3);
    expect(footer.textContent).toContain('1 / 3');
  });
});
