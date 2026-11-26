import {
  Component,
  OnInit,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  functionalUpdate,
  injectTable,
  type Cell,
  type Column,
  type ColumnDef,
  type ColumnVisibilityState,
  type Row,
  type RowData,
  type SortingState,
} from '@tanstack/angular-table';
import { IconName } from '@core/icons/lucide-icons';
import { Button } from '@shared/components/actions/button/button';
import { CopyButton } from '@shared/components/actions/copy-button/copy-button';
import { EmptyState } from '@shared/components/feedback/empty-state/empty-state';
import { Icon } from '@shared/components/media/icon/icon';
import { ComponentDensity } from '@shared/models/density.model';
import {
  MobileColumnRole,
  MobileTableLayout,
  SortDirection,
  TableColumn,
  TableSort,
  TableStatusFilter,
} from './data-table.model';
import { TableCell } from './table-cell';
import { DataTableControls } from './data-table-controls';
import { DATA_TABLE_FEATURES, DataTableFeatures, compareInSpanish } from './data-table-features';

const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [role="switch"], [role="checkbox"], app-button, app-toggle-switch, app-checkbox';

/**
 * Tabla de datos con ordenamiento, jerarquía responsiva de columnas,
 * mini-tarjetas expandibles en móvil e interacción por fila.
 */
@Component({
  selector: 'app-data-table',
  imports: [Button, CopyButton, DataTableControls, EmptyState, Icon, NgTemplateOutlet],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css',
})
export class DataTable<T extends RowData> implements OnInit {
  /** Evita leer entradas obligatorias desde el padre antes de completar su asignación inicial. */
  private readonly inputsReady = signal(false);
  /** Columnas mostradas, en el orden en que se declaran. */
  readonly columns = input.required<readonly TableColumn<T>[]>();

  /** Coincidencias completas: se filtran por estado, se ordenan y solo entonces se paginan. */
  readonly rows = input.required<readonly T[]>();

  /**
   * Página actual (base 1) cuando la tabla pagina internamente. La paginación se
   * aplica DESPUÉS de ordenar, para que el orden abarque todas las filas y no
   * solo las visibles. Se ignora si `pageSize` es 0.
   */
  readonly page = input(1);

  /** Filas por página. 0 (por defecto) desactiva la paginación interna. */
  readonly pageSize = input(0);

  /** Nivel de densidad de celdas ('normal' o 'compact'). */
  readonly density = input<ComponentDensity>('normal');

  /** Conserva el diseño estándar; las variantes con título completo o campos apilados son explícitas. */
  readonly mobileLayout = input<MobileTableLayout>('standard');

  /** Resumen para lectores de pantalla. Toda tabla de datos debería tener uno. */
  readonly caption = input('');

  /** Llave estable de fila. Sin una, se usa el índice. */
  readonly trackBy = input<(row: T, index: number) => string | number>((_row, index) => index);

  /** El ordenamiento con el que la tabla abre. */
  readonly initialSort = input<TableSort | null>(null);

  /** Columnas ocultas al abrir, por id. Vacío las muestra todas. */
  readonly initialHiddenColumns = input<readonly string[]>([]);

  /** Muestra el menú "Columnas" sobre la tabla. */
  readonly columnMenu = input(false, { transform: booleanAttribute });

  /** Filtro activo para tablas cuyos registros tienen estado activo/inactivo. */
  readonly statusFilter = model<TableStatusFilter>('all');

  /**
   * Extractor opcional del estado activo de una fila. Si no se provee, la tabla
   * busca automáticamente la propiedad booleana `isActive` en las filas cuando
   * existe una columna de estado (`status`, `estatus`, `estado`, `isActive`).
   */
  readonly statusPredicate = input<((row: T) => boolean) | null>(null);

  /** Habilita el estilo interactivo (cursor y foco) sobre las filas completas. */
  readonly rowClickable = input(false, { transform: booleanAttribute });

  /** Clave devuelta por `trackBy` para resaltar una fila. La pantalla la retira asignando `null`. */
  readonly highlightedRowId = input<string | number | null>(null);

  /** Una carga está en curso: se proyecta el slot `[loading]` en vez de la tabla. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** La carga falló: se proyecta el slot `[error]`. Tiene prioridad sobre todo. */
  readonly error = input(false, { transform: booleanAttribute });

  /** El ordenamiento en el que está el encabezado, o `null` cuando no hay orden. */
  readonly sortChange = output<TableSort | null>();

  /** Se emite al hacer clic sobre una fila completa (ignorando botones/switches internos). */
  readonly rowClick = output<T>();

  /** Conjuntos de IDs de filas cuyas mini-tarjetas están expandidas en vista móvil. */
  protected readonly expandedRowIds = signal<ReadonlySet<string>>(new Set());

  /** Estado controlado de ordenamiento y visibilidad de columnas en TanStack. */
  protected readonly sortingState = signal<SortingState>([]);
  protected readonly columnVisibilityState = signal<ColumnVisibilityState>({});

  /** Mapa rápido de definiciones de columna por ID. */
  private readonly columnMap = computed(() => new Map(this.columns().map((col) => [col.id, col])));

  /** Determina si la tabla cuenta con columna o predicado de estatus para mostrar el filtro Activos/Inactivos. */
  protected readonly hasStatusColumn = computed(() => {
    if (this.statusPredicate() !== null) {
      return true;
    }
    return this.columns().some((col) => {
      const id = col.id.toLowerCase();
      return id === 'status' || id === 'estatus' || id === 'estado' || id === 'isactive';
    });
  });

  /** Conteos por estado para las píldoras del filtro rápido. */
  protected readonly statusCounts = computed(() => {
    const allRows = this.rows();
    if (!this.hasStatusColumn()) {
      return { all: allRows.length, active: 0, inactive: 0 };
    }
    let active = 0;
    let inactive = 0;
    for (const row of allRows) {
      if (this.isRowActive(row)) {
        active++;
      } else {
        inactive++;
      }
    }
    return { all: allRows.length, active, inactive };
  });

  /** Filas filtradas según el selector de estatus (`all` | `active` | `inactive`). */
  protected readonly filteredRows = computed<readonly T[]>(() => {
    const allRows = this.rows();
    const filter = this.statusFilter();
    if (!this.hasStatusColumn() || filter === 'all') {
      return allRows;
    }
    return allRows.filter((row) => {
      const active = this.isRowActive(row);
      return filter === 'active' ? active : !active;
    });
  });

  private readonly cellTemplates = contentChildren<TableCell<T>>(TableCell);

  private readonly templates = computed(
    () => new Map(this.cellTemplates().map((cell) => [cell.appTableCell(), cell.template])),
  );

  /**
   * Traduce la definición del sistema a la de TanStack e infiere los roles
   * móviles si el consumidor no los especificó explícitamente.
   */
  private readonly columnDefs = computed<ColumnDef<DataTableFeatures, T>[]>(() => {
    const cols = this.columns();
    let assignedPrimary = false;

    return cols.map((definition, index) => {
      const sortValue = (row: T) => definition.sortValue?.(row) ?? definition.cell?.(row) ?? '';
      const inferredRole = this.resolveMobileRole(definition, () => {
        const hadPrimary = assignedPrimary;
        assignedPrimary = true;
        return hadPrimary;
      });
      const inferredPriority =
        definition.priority ?? this.resolveDefaultPriority(inferredRole, index);

      return {
        id: definition.id,
        header: definition.header,
        accessorFn: (row: T) => definition.cell?.(row) ?? '',
        enableSorting: definition.sortable === true && inferredRole !== 'actions',
        enableHiding: definition.hideable !== false && inferredRole !== 'actions',
        sortFn: (rowA, rowB) =>
          compareInSpanish(sortValue(rowA.original), sortValue(rowB.original)),
        meta: {
          headerClass: definition.headerClass ?? '',
          cellClass: definition.cellClass ?? '',
          align: inferredRole === 'actions' ? 'center' : (definition.align ?? 'start'),
          priority: inferredPriority,
          mobileRole: inferredRole,
        },
      };
    });
  });

  protected readonly table = injectTable<DataTableFeatures, T>(() => ({
    features: DATA_TABLE_FEATURES,
    columns: this.columnDefs(),
    data: [...this.filteredRows()],
    state: {
      sorting: this.sortingState(),
      columnVisibility: this.columnVisibilityState(),
    },
    onSortingChange: (updater) => {
      this.sortingState.update((old) => functionalUpdate(updater, old));
    },
    onColumnVisibilityChange: (updater) => {
      this.columnVisibilityState.update((old) => functionalUpdate(updater, old));
    },
    enableSortingRemoval: true,
    sortDescFirst: false,
    getRowId: (row, index) => String(this.trackBy()(row, index)),
  }));

  /** Orden vigente compartido con el controlador para reiniciar la página al cambiarlo. */
  readonly currentSort = computed<TableSort | null>(() => {
    const activeSort = this.sortingState()[0];
    if (!activeSort) {
      return null;
    }
    return {
      columnId: activeSort.id,
      direction: activeSort.desc ? 'desc' : 'asc',
    };
  });

  constructor() {
    effect(() => {
      const initial = this.startingSort();
      untracked(() => this.sortingState.set(initial));
    });

    effect(() => {
      const hidden = this.initialHiddenColumns();
      untracked(() =>
        this.columnVisibilityState.set(
          Object.fromEntries(hidden.map((id) => [id, false] as const)),
        ),
      );
    });

    effect(() => {
      const sort = this.currentSort();
      untracked(() => this.sortChange.emit(sort));
    });
  }

  ngOnInit(): void {
    this.inputsReady.set(true);
  }

  /** Encabezados visibles. */
  protected readonly headers = computed(() => {
    this.columnVisibilityState();
    this.sortingState();
    return this.table.getHeaderGroups()[0]?.headers ?? [];
  });

  /** Columnas que admiten ordenamiento (para el selector cuando la cabecera oculta columnas o cambia a tarjetas). */
  protected readonly sortableColumns = computed(() => {
    this.columnVisibilityState();
    return this.table
      .getAllLeafColumns()
      .filter((column) => column.getCanSort() && column.getIsVisible());
  });

  /** Umbral de contenedor en que al menos una columna ordenable se oculta por prioridad. */
  protected readonly sortControlBreakpoint = computed<820 | 1000 | 1280 | null>(() => {
    const priorities = this.sortableColumns().map((column) => column.columnDef.meta?.priority ?? 1);
    if (priorities.includes(4)) return 1280;
    if (priorities.includes(3)) return 1000;
    if (priorities.includes(2)) return 820;
    return null;
  });

  private readonly processedRowModel = computed(() => {
    this.filteredRows();
    this.sortingState();
    this.columnVisibilityState();
    return this.table.getRowModel().rows;
  });

  /** Coincidencias sin recorte; vacías durante la creación, antes de disponer de las entradas. */
  readonly processedRows = computed<readonly T[]>(() =>
    this.inputsReady() ? this.processedRowModel().map((row) => row.original) : [],
  );

  /** Filas de la página actual; este es el único recorte en la paginación local. */
  protected readonly visibleRows = computed(() => {
    const rows = this.processedRowModel();
    const size = this.pageSize();
    if (size <= 0) {
      return rows;
    }
    const start = (Math.max(1, this.page()) - 1) * size;
    return rows.slice(start, start + size);
  });

  /** Las columnas que el menú "Columnas" ofrece alternar. */
  protected readonly toggleableColumns = computed(() => {
    this.columnVisibilityState();
    return this.table.getAllLeafColumns().filter((column) => column.getCanHide());
  });

  /** Datos de presentación para los controles, sin trasladarles el estado de TanStack. */
  protected readonly sortableControls = computed(() =>
    this.sortableColumns().map((column) => ({
      id: column.id,
      label: this.headerLabel(column),
      visible: column.getIsVisible(),
    })),
  );
  protected readonly toggleableControls = computed(() =>
    this.toggleableColumns().map((column) => ({
      id: column.id,
      label: this.headerLabel(column),
      visible: column.getIsVisible(),
    })),
  );

  protected ariaSort(column: Column<DataTableFeatures, T>): string | null {
    return column.getCanSort() ? SORT_ARIA[column.getIsSorted() || 'none'] : null;
  }

  protected sortIcon(column: Column<DataTableFeatures, T>): IconName {
    return SORT_ICON[column.getIsSorted() || 'none'];
  }

  protected headerLabel(column: Column<DataTableFeatures, T>): string {
    return String(column.columnDef.header ?? column.id);
  }

  protected cellTemplate(columnId: string) {
    return this.templates().get(columnId) ?? null;
  }

  /** Obtiene el texto definido para la celda, sin copiar su clave de ordenamiento. */
  protected copyableText(cell: Cell<DataTableFeatures, T>): string {
    const colDef = this.columnMap().get(cell.column.id);
    const text = String(colDef?.cell?.(cell.row.original) ?? '').trim();
    return text === '—' || text === '-' ? '' : text;
  }

  /** Determina si la celda debe mostrar el botón de copiar al pasar el cursor. */
  protected canCopyCell(cell: Cell<DataTableFeatures, T>): boolean {
    const colDef = this.columnMap().get(cell.column.id);
    if (!colDef || colDef.copyable === false) {
      return false;
    }

    const role = this.cellMobileRole(cell);
    if (
      colDef.copyable === undefined &&
      (role === 'actions' || role === 'badge' || role === 'none')
    ) {
      return false;
    }

    return this.copyableText(cell).length > 0;
  }

  /** Compara con la identidad de TanStack, sin inferir altas al cambiar los datos. */
  protected isRowHighlighted(rowId: string): boolean {
    const highlightedId = this.highlightedRowId();
    return highlightedId !== null && String(highlightedId) === rowId;
  }

  /** Alterna el ordenamiento desde el selector móvil. */
  protected onMobileSortColumnChange(columnId: string): void {
    if (!columnId) {
      this.table.resetSorting();
      return;
    }
    const col = this.table.getColumn(columnId);
    if (col) {
      const isDesc = this.currentSort()?.direction === 'desc';
      this.table.setSorting([{ id: columnId, desc: isDesc }]);
    }
  }

  /** Invierte la dirección del ordenamiento activo en móvil. */
  protected toggleMobileSortDirection(): void {
    const active = this.currentSort();
    if (!active) {
      const firstSortable = this.sortableColumns()[0];
      if (firstSortable) {
        this.table.setSorting([{ id: firstSortable.id, desc: false }]);
      }
      return;
    }
    this.table.setSorting([{ id: active.columnId, desc: active.direction === 'asc' }]);
  }

  /** Verifica si una fila móvil tiene columnas secundarias ('detail') para mostrar el chevron. */
  protected hasDetailCells(row: Row<DataTableFeatures, T>): boolean {
    return row
      .getVisibleCells()
      .some((cell) => cell.column.columnDef.meta?.mobileRole === 'detail');
  }

  /** Verifica si una fila está expandida en vista móvil. */
  protected isRowExpanded(rowId: string): boolean {
    return this.expandedRowIds().has(rowId);
  }

  /** Abre o cierra el cajón de detalles de una mini-tarjeta móvil. */
  protected toggleRowExpansion(rowId: string, event: Event): void {
    event.stopPropagation();
    this.expandedRowIds.update((current) => {
      const next = new Set(current);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  /** Maneja el clic en la fila ignorando clics sobre controles interactivos hijos. */
  protected onRowClick(row: T, event: MouseEvent): void {
    if (!this.rowClickable()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target?.closest(INTERACTIVE_SELECTOR)) {
      return;
    }
    this.rowClick.emit(row);
  }

  /** Maneja Enter o Espacio cuando la fila es interactiva. */
  protected onRowKeydown(row: T, event: KeyboardEvent): void {
    if (!this.rowClickable()) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && target.tagName !== 'TR' && target.closest(INTERACTIVE_SELECTOR)) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  protected cellMobileRole(cell: Cell<DataTableFeatures, T>): MobileColumnRole {
    return cell.column.columnDef.meta?.mobileRole ?? 'detail';
  }

  protected columnPriority(column: Column<DataTableFeatures, T>): number {
    return column.columnDef.meta?.priority ?? 1;
  }

  protected setStatusFilter(filter: TableStatusFilter): void {
    this.statusFilter.set(filter);
  }

  private isRowActive(row: T): boolean {
    const predicate = this.statusPredicate();
    if (predicate) {
      return predicate(row);
    }
    const candidate = row as Record<string, unknown>;
    if (typeof candidate['isActive'] === 'boolean') {
      return candidate['isActive'];
    }
    if (typeof candidate['active'] === 'boolean') {
      return candidate['active'];
    }
    return true;
  }

  private resolveDefaultPriority(role: MobileColumnRole, index: number): 1 | 2 | 3 {
    if (role === 'code' || role === 'primary' || role === 'actions') {
      return 1;
    }
    if (role === 'badge') {
      return 2;
    }
    return index <= 3 ? 2 : 3;
  }

  private resolveMobileRole(
    definition: TableColumn<T>,
    markPrimary: () => boolean,
  ): MobileColumnRole {
    if (definition.mobileRole) {
      if (definition.mobileRole === 'primary') {
        markPrimary();
      }
      return definition.mobileRole;
    }

    const id = definition.id.toLowerCase();
    if (id === 'actions' || id === 'action' || id === 'acciones') {
      return 'actions';
    }
    if (id === 'code' || id === 'codigo' || id === 'clave' || id === 'folio' || id === 'id') {
      return 'code';
    }
    if (id === 'status' || id === 'estatus' || id === 'estado' || id === 'isactive') {
      return 'badge';
    }
    if (!markPrimary()) {
      return 'primary';
    }
    return 'detail';
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
