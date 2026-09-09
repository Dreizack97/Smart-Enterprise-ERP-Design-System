/** Dirección de ordenamiento de una columna. */
export type SortDirection = 'asc' | 'desc';

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
   * plantilla siempre gana. Exigirlo significaba escribir formateadores que
   * nunca corren y que, con el tiempo, dejan de coincidir con lo que
   * realmente hay en pantalla. Toda columna debe traer uno de los dos.
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

  /** Habilita el botón de ordenar en el encabezado. Ausente significa no ordenable. */
  readonly sortable?: boolean;

  /**
   * Si la columna se puede ocultar desde el menú "Columnas".
   *
   * Toda columna es ocultable por defecto. Se pone en `false` en las que no
   * tienen sentido sin ella — la columna de acciones, la que identifica a
   * cada fila: ocultar esas deja a la tabla sin forma de actuar o sin forma
   * de leerse.
   */
  readonly hideable?: boolean;

  /**
   * Clases AGREGADAS a las propias de la tabla, no las reemplazan. Solo lo
   * que le pertenece a la columna: un monto monoespaciado, una columna
   * secundaria apagada. El padding, el tamaño de letra y la ALINEACIÓN vienen
   * de `app-data-table` — ver `align`.
   */
  readonly headerClass?: string;
  readonly cellClass?: string;

  /**
   * Desde qué borde se lee la columna. Los montos y conteos quieren `end`.
   *
   * Una propiedad declarada y no un `text-right` en `cellClass`, por dos
   * razones. Primero, un string de utilidad no podría ganar: `.table__header`
   * declara `text-align: start` — un `<th>` lo centra el agente de usuario,
   * así que la tabla tiene que decir lo contrario — y una clase de afuera
   * pierde contra eso. Segundo, y más importante, la alineación tiene que
   * aplicarse al encabezado Y a la celda juntos, y el control de ordenar
   * dentro del encabezado tiene que seguirla: tres lugares que deben
   * coincidir, que es exactamente para lo que sirve una propiedad de columna
   * y no un string de clase de forma libre.
   */
  readonly align?: 'start' | 'end';
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
