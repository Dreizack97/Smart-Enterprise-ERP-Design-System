import {
  columnVisibilityFeature,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/angular-table';

/**
 * Las únicas funciones de TanStack Table que el sistema registra.
 *
 * En v9 las funciones son opt-in y se declaran una por una: lo que no está
 * listado aquí no entra al bundle. Se registran dos porque son lo que
 * `app-data-table` expone en su API pública — ordenamiento y visibilidad de
 * columnas. El día que se necesite agrupación, filtrado o paginación dentro
 * de la tabla, se agrega aquí y solo aquí.
 */
export const DATA_TABLE_FEATURES = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  /**
   * Un slot de tipo, no de valor: TanStack lo borra en tiempo de ejecución.
   * Permite que cada columna cargue lo que la plantilla necesita de ella, en
   * vez de mantener un mapa paralelo de columnas junto a la tabla.
   */
  columnMeta: {} as {
    readonly headerClass: string;
    readonly cellClass: string;
    readonly alignEnd: boolean;
  },
});

/** El conjunto de funciones contra el que se tipan las columnas de `app-data-table`. */
export type DataTableFeatures = typeof DATA_TABLE_FEATURES;

/**
 * El comparador del sistema: en español, y consciente de números.
 *
 * No se usa ninguno de los propios de TanStack. `alphanumeric` compara con
 * reglas del inglés, y aquí "Ángela" tiene que quedar junto a "Angel", no al
 * final. La collation consciente de números pone "Pedido 9" antes de
 * "Pedido 10", no después.
 *
 * Se pasa directamente como el `sortFn` de cada columna en vez de
 * registrarse en `tableFeatures`, para que no arrastre los comparadores
 * integrados que nadie usa.
 */
export function compareInSpanish(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), 'es', { numeric: true });
}
