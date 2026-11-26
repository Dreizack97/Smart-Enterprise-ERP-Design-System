/** Dirección de ordenamiento de una columna. */
export type SortDirection = 'asc' | 'desc';

/** Estado del filtro rápido de registros activos/inactivos. */
export type TableStatusFilter = 'all' | 'active' | 'inactive';

/** Distribución de tarjetas móviles: estándar, campos apilados o título en una fila completa. */
export type MobileTableLayout = 'standard' | 'stacked' | 'title-first';

/**
 * Jerarquía de visibilidad responsiva en pantallas de escritorio y tablet:
 * - `1`: Esencial. Siempre visible en tabla.
 * - `2`: Secundaria. Se oculta automáticamente cuando el contenedor baja de 820px.
 * - `3`: Detalle. Se oculta automáticamente cuando el contenedor baja de 1050px.
 */
export type ColumnPriority = 1 | 2 | 3 | 4;

/**
 * Rol semántico de una columna dentro de la mini-tarjeta móvil (< 768px):
 * - `'code'`: Identificador corto o código en la esquina superior izquierda.
 * - `'primary'`: Nombre o título principal del registro en la cabecera.
 * - `'badge'`: Estatus o etiqueta destacada en la esquina superior derecha.
 * - `'actions'`: Controles interactivos fijos en la barra inferior de la mini-tarjeta.
 * - `'detail'`: Campo secundario que se pliega dentro del cajón expandible (chevron).
 * - 'none': Se omite por completo en la mini-tarjeta móvil (p. ej., estado redundante con un toggle).
 */
export type MobileColumnRole = 'code' | 'primary' | 'badge' | 'actions' | 'detail' | 'none';

/** Por qué columna está ordenada la tabla, y en qué dirección. */
export interface TableSort {
  /** Id de la columna activa, tal como se declara en `TableColumn.id`. */
  readonly columnId: string;
  readonly direction: SortDirection;
}

/**
 * La definición de una columna de `app-data-table`.
 *
 * @typeParam T Tipo de la fila que la tabla renderiza.
 */
export interface TableColumn<T> {
  /** Id estable; ata la columna a su plantilla y al estado de ordenamiento. */
  readonly id: string;

  /** Título visible, y también la etiqueta que cada celda emite en `data-label`. */
  readonly header: string;

  /**
   * Texto plano de la celda.
   *
   * Opcional porque una columna con `*appTableCell` nunca lo muestra: la
   * plantilla siempre gana. Toda columna debe traer uno de los dos.
   */
  readonly cell?: (row: T) => string;

  /**
   * El valor por el cual ordenar, cuando difiere del texto mostrado: un
   * monto formateado como "$1.250,00" ordena mal como string.
   *
   * Obligatorio en columnas ordenables que solo tienen plantilla, porque no
   * hay texto plano de respaldo.
   */
  readonly sortValue?: (row: T) => string | number;

  /** Habilita el botón de ordenar en el encabezado. Ausente significa no ordenable; las columnas de acciones nunca ordenan. */
  readonly sortable?: boolean;

  /**
   * Si la columna se puede ocultar desde el menú "Columnas".
   *
   * Toda columna es ocultable por defecto. Se pone en `false` en las que no
   * tienen sentido sin ella — la columna de acciones o la que identifica a cada fila.
   */
  readonly hideable?: boolean;

  /**
   * Habilita o desactiva la copia del texto definido en `cell`.
   * Las plantillas sin texto de respaldo no copian su valor de ordenamiento.
   */
  readonly copyable?: boolean;

  /**
   * Clases AGREGADAS a las propias de la tabla, no las reemplazan.
   */
  readonly headerClass?: string;
  readonly cellClass?: string;

  /**
   * Desde qué borde se lee la columna o si está centrada.
   * Las columnas con rol `actions` se centran automáticamente.
   */
  readonly align?: 'start' | 'center' | 'end';

  /**
   * Jerarquía de la columna para ocultar progresivamente cuando el ancho
   * disponible disminuye en pantallas medianas y evitar desbordamientos.
   * Por defecto es `1` (siempre visible).
   */
  readonly priority?: ColumnPriority;

  /**
   * Rol dentro de la mini-tarjeta móvil (< 768px). Si se omite, la tabla lo
   * infiere automáticamente a partir del `id` o posición de la columna.
   */
  readonly mobileRole?: MobileColumnRole;
}

/**
 * El contexto que recibe una plantilla de celda personalizada.
 *
 * La fila se expone dos veces para que funcionen tanto `let-row` como
 * `let-row="row"`.
 *
 * @typeParam T Tipo de la fila que la tabla renderiza.
 */
export interface TableCellContext<T> {
  readonly $implicit: T;
  readonly row: T;
}
