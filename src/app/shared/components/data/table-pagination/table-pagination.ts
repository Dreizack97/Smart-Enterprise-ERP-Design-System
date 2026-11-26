import { Component, booleanAttribute, computed, input } from '@angular/core';
import { Select } from '@shared/components/forms/select/select';
import { Pagination } from '@shared/components/navigation/pagination/pagination';
import { TablePaginationState } from '../data-table/table-state';

/** Reúne cantidad de filas, resumen y navegación en un pie uniforme y adaptable. */
@Component({
  selector: 'app-table-pagination',
  imports: [Select, Pagination],
  templateUrl: './table-pagination.html',
  styleUrl: './table-pagination.css',
  host: { '[class.table-pagination--compact]': 'compact()' },
})
export class TablePagination {
  /** Estado de esta tabla; el pie no filtra datos ni realiza consultas. */
  readonly state = input.required<TablePaginationState>();
  /** Reduce el pie y la navegación en las tablas secundarias de modales. */
  readonly compact = input(false, { transform: booleanAttribute });
  protected readonly options = computed(() =>
    this.state().pageSizes.map((size) => ({ value: String(size), label: `${size} por página` })),
  );

  /** Valida la cantidad mediante el controlador, sin convertir valores vacíos en un tamaño cero. */
  protected changeSize(value: string): void {
    if (value.trim()) this.state().setPageSize(Number(value));
  }
}
