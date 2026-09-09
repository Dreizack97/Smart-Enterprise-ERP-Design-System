import {
  Component,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  injectTable,
  type Column,
  type ColumnDef,
  type RowData,
  type SortingState,
} from '@tanstack/angular-table';
import { IconName } from '@core/icons/lucide-icons';
import { Button } from '@shared/components/actions/button/button';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Icon } from '@shared/components/media/icon/icon';
import { DropdownMenu } from '@shared/components/overlays/dropdown-menu/dropdown-menu';
import { SortDirection, TableColumn, TableSort } from './data-table.model';
import { TableCell } from './table-cell';
import { DATA_TABLE_FEATURES, DataTableFeatures, compareInSpanish } from './data-table-features';

/**
 * Tabla de datos con ordenamiento y visibilidad de columnas.
 *
 * TanStack Table es dueño del modelo de filas y del estado; aquí no hay
 * comparador, ni máquina de tres estados, ni segunda copia de las columnas.
 * El marcado es nuestro: la accesibilidad de una tabla — `aria-sort` en el
 * `<th>`, el `<caption>`, el orden de foco — no es algo que resuelva una
 * librería headless, y el `data-label` de cada `<td>` es lo que permite que
 * la hoja de estilos pliegue cada fila en una tarjeta por debajo del punto
 * de quiebre móvil.
 *
 * La API pública — `columns`, `rows`, `initialSort`, `[appTableCell]`, los
 * slots de carga, error y vacío — es la misma que tenía antes de TanStack:
 * las pantallas no saben que hay una librería debajo, y cambiarla no las
 * tocaría.
 *
 * El tamaño de letra y el padding vienen de la propia hoja de estilos de la
 * tabla, no de un string de clases de utilidad en TypeScript. `cellClass` y
 * `headerClass` se AGREGAN a esa base en vez de reemplazarla: si la
 * reemplazaran, una columna que declarara una alineación perdería en
 * silencio su tamaño de letra en el camino.
 */
@Component({
  selector: 'app-data-table',
  imports: [Button, Checkbox, DropdownMenu, Icon, NgTemplateOutlet],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T extends RowData> {
  /** Columnas mostradas, en el orden en que se declaran. */
  readonly columns = input.required<readonly TableColumn<T>[]>();

  /** Filas a mostrar. La tabla las ordena, pero nunca las filtra ni las pagina. */
  readonly rows = input.required<readonly T[]>();

  /** Resumen para lectores de pantalla. Toda tabla de datos debería tener uno. */
  readonly caption = input('');

  /** Llave estable de fila. Sin una, se usa el índice. */
  readonly trackBy = input<(row: T, index: number) => string | number>((_row, index) => index);

  /**
   * El ordenamiento con el que la tabla abre. De ahí en adelante el
   * encabezado es dueño de él: el estado vive dentro de TanStack, no aquí.
   */
  readonly initialSort = input<TableSort | null>(null);

  /** Columnas ocultas al abrir, por id. Vacío las muestra todas. */
  readonly initialHiddenColumns = input<readonly string[]>([]);

  /** Muestra el menú "Columnas" sobre la tabla. */
  readonly columnMenu = input(false, { transform: booleanAttribute });

  /**
   * Una carga está en curso: se proyecta el slot `[loading]` en vez de la
   * tabla. Tiene prioridad sobre el estado vacío para que "sin datos" nunca
   * parpadee antes de tiempo.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /** La carga falló: se proyecta el slot `[error]`. Tiene prioridad sobre todo. */
  readonly error = input(false, { transform: booleanAttribute });

  /**
   * El ordenamiento en el que está el encabezado, o `null` cuando no hay
   * orden.
   *
   * Existe porque la tabla ordena **lo que se le da**, y una pantalla que
   * pagina le da una sola página. Sin esto, hacer clic en un encabezado
   * reordenaba las seis filas en pantalla y dejaba las otras doscientas
   * donde estaban — un ordenamiento que parece funcionar y no funciona.
   *
   * Con esto, una pantalla que pagina ordena el conjunto completo y luego
   * lo corta, y una pantalla que muestra todo simplemente puede ignorar la
   * salida.
   */
  readonly sortChange = output<TableSort | null>();

  private readonly cellTemplates = contentChildren<TableCell<T>>(TableCell);

  /**
   * Plantillas de celda declaradas con `*appTableCell`, indexadas por
   * columna. Se reconstruyen solo cuando las plantillas cambian, no en cada
   * pintado.
   */
  private readonly templates = computed(
    () => new Map(this.cellTemplates().map((cell) => [cell.appTableCell(), cell.template])),
  );

  /**
   * Traduce la definición del sistema a la de TanStack.
   *
   * `accessorFn` devuelve el texto en pantalla, que es con lo que la celda
   * pinta con `getValue()`. El ordenamiento no lo usa: cada columna trae su
   * propio `sortFn`, que lee `sortValue` cuando existe. Esa es la separación
   * que pedía el caso real — un monto formateado como "$1.250,00" ordena mal
   * como string — sin que la plantilla tenga que saber nada de eso.
   */
  private readonly columnDefs = computed<ColumnDef<DataTableFeatures, T>[]>(() =>
    this.columns().map((definition) => {
      const sortValue = (row: T) => definition.sortValue?.(row) ?? definition.cell?.(row) ?? '';

      return {
        id: definition.id,
        header: definition.header,
        accessorFn: (row: T) => definition.cell?.(row) ?? '',
        enableSorting: definition.sortable === true,
        enableHiding: definition.hideable !== false,
        sortFn: (rowA, rowB) =>
          compareInSpanish(sortValue(rowA.original), sortValue(rowB.original)),
        meta: {
          headerClass: definition.headerClass ?? '',
          cellClass: definition.cellClass ?? '',
          alignEnd: definition.align === 'end',
        },
      };
    }),
  );

  /**
   * La instancia de tabla de TanStack. El estado — qué columna ordena y
   * cuáles son visibles — vive adentro: esto solo le da un punto de partida.
   * Sin estado controlado, no hay nada que mantener sincronizado en dos
   * direcciones.
   *
   * `sortDescFirst: false` porque el sistema siempre empieza ascendente;
   * TanStack lo invierte por su cuenta en columnas numéricas.
   * `enableSortingRemoval` es lo que le da al encabezado sus tres estados —
   * ascendente, descendente, sin ordenar — sin escribirlos a mano.
   */
  protected readonly table = injectTable<DataTableFeatures, T>(() => ({
    features: DATA_TABLE_FEATURES,
    columns: this.columnDefs(),
    data: [...this.rows()],
    initialState: {
      sorting: this.startingSort(),
      columnVisibility: Object.fromEntries(
        this.initialHiddenColumns().map((id) => [id, false] as const),
      ),
    },
    enableSortingRemoval: true,
    sortDescFirst: false,
    getRowId: (row, index) => String(this.trackBy()(row, index)),
  }));

  /**
   * El ordenamiento en el que está el encabezado, leído a través de la API
   * por columna que la tabla ya usa para `aria-sort` — una sola fuente de
   * verdad, no dos.
   */
  private readonly currentSort = computed<TableSort | null>(() => {
    const sorted = this.headers().find((header) => header.column.getIsSorted() !== false);
    if (!sorted) {
      return null;
    }
    return {
      columnId: sorted.column.id,
      direction: sorted.column.getIsSorted() === 'desc' ? 'desc' : 'asc',
    };
  });

  constructor() {
    effect(() => {
      const sort = this.currentSort();
      // `untracked` alrededor del emit: un output es un efecto secundario, y
      // leer de vuelta la reacción del consumidor dentro de este efecto es
      // cómo empieza un bucle.
      untracked(() => this.sortChange.emit(sort));
    });
  }

  /** Encabezados visibles. Una sola fila: el sistema no agrupa columnas. */
  protected readonly headers = computed(() => this.table.getHeaderGroups()[0]?.headers ?? []);

  /** Filas ya ordenadas por TanStack. */
  protected readonly visibleRows = computed(() => this.table.getRowModel().rows);

  /** Las columnas que el menú "Columnas" ofrece alternar. */
  protected readonly toggleableColumns = computed(() =>
    this.table.getAllLeafColumns().filter((column) => column.getCanHide()),
  );

  protected ariaSort(column: Column<DataTableFeatures, T>): string | null {
    return column.getCanSort() ? SORT_ARIA[column.getIsSorted() || 'none'] : null;
  }

  protected sortIcon(column: Column<DataTableFeatures, T>): IconName {
    return SORT_ICON[column.getIsSorted() || 'none'];
  }

  /** El título de la columna tal como se declaró. También el `data-label`. */
  protected headerLabel(column: Column<DataTableFeatures, T>): string {
    return String(column.columnDef.header ?? column.id);
  }

  protected cellTemplate(columnId: string) {
    return this.templates().get(columnId) ?? null;
  }

  private startingSort(): SortingState {
    const sort = this.initialSort();
    return sort ? [{ id: sort.columnId, desc: sort.direction === 'desc' }] : [];
  }
}

const SORT_ARIA = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
} as const satisfies Record<SortDirection | 'none', string>;

const SORT_ICON = {
  asc: 'arrow-up',
  desc: 'arrow-down',
  none: 'arrow-up-down',
} as const satisfies Record<SortDirection | 'none', IconName>;
