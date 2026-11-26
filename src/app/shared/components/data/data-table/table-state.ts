import { computed, linkedSignal, signal, type Signal, type WritableSignal } from '@angular/core';
import { normalise } from '@shared/utils/text';
import type { DataTable } from './data-table';
import type { RowData } from '@tanstack/angular-table';

/** Cantidades disponibles en las tablas normales del ERP. */
export const TABLE_PAGE_SIZES = [10, 15, 25, 50] as const;

/** Configuración de paginación; admite totales locales o proporcionados por una API. */
export interface TablePaginationOptions {
  readonly totalItems: () => number;
  readonly initialPageSize?: number;
  readonly pageSizes?: readonly number[];
  readonly itemLabel?: string;
  readonly singularLabel?: string;
  readonly emptySummary?: string;
  readonly resetOn?: () => unknown;
}

/** Contrato del pie compartido, independiente de los campos y permisos de cada pantalla. */
export interface TablePaginationState {
  readonly page: WritableSignal<number>;
  readonly pageSize: Signal<number>;
  readonly pageSizes: readonly number[];
  readonly totalItems: Signal<number>;
  readonly pageCount: Signal<number>;
  readonly paginationSummary: Signal<string>;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (size: number) => void;
}

/** Coordina tamaños, límites y resumen sin recortar ni ordenar filas. No requiere inyección. */
export function createTablePagination(options: TablePaginationOptions): TablePaginationState {
  const allowed = [
    ...new Set(
      (options.pageSizes ?? TABLE_PAGE_SIZES).filter((size) => Number.isInteger(size) && size > 0),
    ),
  ];
  const pageSizes = allowed.length ? allowed : [...TABLE_PAGE_SIZES];
  const initial = options.initialPageSize ?? 10;
  const size = signal(pageSizes.includes(initial) ? initial : pageSizes[0]);
  const totalItems = computed(() => {
    const total = options.totalItems();
    return Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  });
  const pageCount = computed(() => Math.max(1, Math.ceil(totalItems() / size())));
  const resetKey = computed(() => options.resetOn?.());
  const page = linkedSignal<{ count: number; size: number; reset: unknown }, number>({
    source: () => ({ count: pageCount(), size: size(), reset: resetKey() }),
    computation: (current, previous) => {
      const reset =
        !previous ||
        current.size !== previous.source.size ||
        current.reset !== previous.source.reset;
      return Math.min(current.count, Math.max(1, reset ? 1 : previous.value));
    },
  });
  const paginationSummary = computed(() => {
    const total = totalItems();
    if (!total) return options.emptySummary ?? 'Sin registros';
    const current = Math.min(pageCount(), Math.max(1, page()));
    const start = (current - 1) * size() + 1;
    const end = Math.min(current * size(), total);
    const label =
      total === 1 ? (options.singularLabel ?? 'registro') : (options.itemLabel ?? 'registros');
    return `Mostrando ${start}–${end} de ${total} ${label}`;
  });
  return {
    page,
    pageSize: size.asReadonly(),
    pageSizes,
    totalItems,
    pageCount,
    paginationSummary,
    setPage: (value) => {
      if (Number.isInteger(value)) page.set(Math.min(pageCount(), Math.max(1, value)));
    },
    setPageSize: (value) => {
      if (pageSizes.includes(value)) size.set(value);
    },
  };
}

/** Conecta una tabla con los filtros de negocio que conserva su pantalla. */
export interface DataTablePaginationOptions<T extends RowData> extends Omit<
  TablePaginationOptions,
  'totalItems'
> {
  readonly table: () => DataTable<T> | undefined;
  readonly rows: () => readonly T[];
}

/** Agrega las coincidencias ordenadas al contrato de paginación para exportarlas completas. */
export interface DataTablePaginationState<T> extends TablePaginationState {
  readonly processedRows: Signal<readonly T[]>;
}

/** Sincroniza automáticamente totales, actividad y orden sin duplicar el filtrado de DataTable. */
export function createDataTablePagination<T extends RowData>(
  options: DataTablePaginationOptions<T>,
): DataTablePaginationState<T> {
  const processedRows = computed(() => options.table()?.processedRows() ?? options.rows());
  const externalReset = computed(() => options.resetOn?.());
  const state = createTablePagination({
    ...options,
    totalItems: () => processedRows().length,
    resetOn: () => ({
      external: externalReset(),
      status: options.table()?.statusFilter(),
      sort: options.table()?.currentSort(),
    }),
  });
  return { ...state, processedRows };
}

/** Configura la búsqueda local y conecta el resultado real de DataTable con la paginación. */
export interface TableStateOptions<T> extends Omit<TablePaginationOptions, 'totalItems'> {
  readonly rows: Signal<readonly T[]>;
  readonly searchText: (row: T) => string;
  readonly processedRows?: () => readonly T[] | undefined;
}

/** Estado por instancia para búsqueda, paginación y exportación de coincidencias completas. */
export interface TableState<T> extends TablePaginationState {
  readonly searchQuery: WritableSignal<string>;
  readonly filteredRows: Signal<readonly T[]>;
  readonly processedRows: Signal<readonly T[]>;
  readonly applySearchFilter: (query: string) => void;
}

/** Filtra por texto sin acentos; DataTable conserva el ordenamiento y el único recorte de página. */
export function createTableState<T>(options: TableStateOptions<T>): TableState<T> {
  const searchQuery = signal('');
  const filteredRows = computed(() => {
    const query = normalise(searchQuery().trim());
    return query
      ? options.rows().filter((row) => normalise(options.searchText(row)).includes(query))
      : options.rows();
  });
  const processedRows = computed(() => options.processedRows?.() ?? filteredRows());
  const externalReset = computed(() => options.resetOn?.());
  const pagination = createTablePagination({
    ...options,
    totalItems: () => processedRows().length,
    resetOn: () => ({ query: searchQuery(), external: externalReset() }),
  });
  return {
    ...pagination,
    searchQuery,
    filteredRows,
    processedRows,
    applySearchFilter: (query) => searchQuery.set(query),
  };
}
