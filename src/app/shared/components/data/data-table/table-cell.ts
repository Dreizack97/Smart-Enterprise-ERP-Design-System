import { Directive, TemplateRef, inject, input } from '@angular/core';
import { TableCellContext } from './data-table.model';

/**
 * Marca una plantilla como la celda personalizada de una columna.
 *
 * ```html
 * <ng-template appTableCell="status" [appTableCellOf]="clients" let-client>
 *   <app-status-badge tone="success" [label]="client.status" />
 * </ng-template>
 * ```
 *
 * Sin esto, la tabla solo podría mostrar texto plano, y casi toda tabla real
 * necesita al menos una columna de insignias o acciones.
 */
@Directive({
  selector: 'ng-template[appTableCell]',
})
export class TableCell<T = unknown> {
  /** Id de la columna cuya celda define esta plantilla. */
  readonly appTableCell = input.required<string>();

  /**
   * La misma colección que recibe la tabla. Sin uso en tiempo de ejecución:
   * existe para que TypeScript pueda inferir el tipo de la fila y `let-row`
   * llegue tipado. El mismo mecanismo que usa `ngForOf`.
   */
  readonly appTableCellOf = input<readonly T[]>([]);

  readonly template = inject<TemplateRef<TableCellContext<T>>>(TemplateRef);

  /** Deja que Angular infiera el tipo de `let-row` en la plantilla. */
  static ngTemplateContextGuard<T>(
    _directive: TableCell<T>,
    _context: unknown,
  ): _context is TableCellContext<T> {
    return true;
  }
}
