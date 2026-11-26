import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTablePagination, createTableState, TABLE_PAGE_SIZES } from './table-state';

describe('Estado compartido de tablas', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }),
  );

  it('calcula rangos de 10 filas sin recortar la colección de entrada', () => {
    const rows = signal(Array.from({ length: 27 }, (_, id) => ({ id })));
    const table = createTableState({ rows, searchText: (row) => String(row.id) });
    expect(table.pageSize()).toBe(10);
    expect(table.pageSizes).toEqual(TABLE_PAGE_SIZES);
    expect(table.pageCount()).toBe(3);
    table.setPage(2);
    expect(table.paginationSummary()).toBe('Mostrando 11–20 de 27 registros');
    expect(table.filteredRows()).toHaveLength(27);
    expect(table.processedRows()).toHaveLength(27);
  });

  it('busca sin acentos ni mayúsculas y reinicia a la primera página', () => {
    const rows = signal([
      'Categoría Básica',
      ...Array.from({ length: 24 }, (_, index) => `Otra ${index}`),
    ]);
    const table = createTableState({ rows, searchText: (row) => row });
    table.setPage(3);
    table.applySearchFilter('  CATEGORIA BASICA ');
    expect(table.page()).toBe(1);
    expect(table.processedRows()).toEqual(['Categoría Básica']);
    expect(table.paginationSummary()).toBe('Mostrando 1–1 de 1 registro');
  });

  it('ajusta la página al reducir filas sin volver siempre al principio', () => {
    const total = signal(28);
    const table = createTablePagination({ totalItems: total });
    table.setPage(3);
    total.set(26);
    expect(table.page()).toBe(3);
    total.set(15);
    expect(table.page()).toBe(2);
    total.set(0);
    expect(table.page()).toBe(1);
    expect(table.pageCount()).toBe(1);
    expect(table.paginationSummary()).toBe('Sin registros');
  });

  it('valida tamaños y límites y reinicia solo cuando cambia el tamaño', () => {
    const table = createTablePagination({ totalItems: () => 87 });
    table.setPage(3);
    table.setPageSize(10);
    expect(table.page()).toBe(3);
    table.setPageSize(25);
    expect(table.page()).toBe(1);
    for (const value of [0, -1, NaN, Infinity, 2.5, 11]) table.setPageSize(value);
    expect(table.pageSize()).toBe(25);
    table.setPage(99);
    expect(table.page()).toBe(4);
    table.setPage(-1);
    expect(table.page()).toBe(1);
  });

  it('comparte las coincidencias de DataTable con los totales y la exportación', () => {
    const rows = signal(['Zeta', 'Alfa', 'Beta']);
    const result = signal<readonly string[] | undefined>(['Alfa', 'Zeta']);
    const filter = signal('active');
    const table = createTableState({
      rows,
      searchText: (row) => row,
      processedRows: result,
      resetOn: filter,
      initialPageSize: 1,
      pageSizes: [1, 2],
    });
    expect(table.totalItems()).toBe(2);
    expect(table.processedRows()).toEqual(['Alfa', 'Zeta']);
    table.setPage(2);
    filter.set('all');
    expect(table.page()).toBe(1);
    result.set(undefined);
    expect(table.totalItems()).toBe(3);
  });

  it('admite tablas compactas y totales del servidor sin exigir todas las filas', () => {
    const table = createTablePagination({
      totalItems: () => 101,
      initialPageSize: 5,
      pageSizes: [5, 10, 25],
      itemLabel: 'movimientos',
    });
    expect(table.pageSize()).toBe(5);
    expect(table.pageCount()).toBe(21);
    table.setPage(21);
    expect(table.paginationSummary()).toBe('Mostrando 101–101 de 101 movimientos');
  });
});
