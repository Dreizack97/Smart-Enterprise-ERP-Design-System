/**
 * Distribuye un mes en semanas completas, y mueve fechas sin usar librería.
 *
 * Compartido por `date-picker`, `date-range-picker` y el patrón de calendario
 * del catálogo. Tres consumidores de una sola cuadrícula mensual son una
 * cuadrícula, no tres: el día que la semana empiece en lunes, tiene que
 * empezar en lunes en todas partes.
 *
 * ## Por qué las fechas viajan como strings `YYYY-MM-DD`
 *
 * Un `Date` es un instante en el tiempo, y un día de calendario no lo es: «8
 * de septiembre» no tiene hora ni zona horaria. Pasar objetos `Date` por ahí
 * invita al bug con el que todos se topan alguna vez — `new
 * Date('2026-09-08')` se interpreta como **medianoche UTC**, que al oeste de
 * Greenwich es el día 7, así que una fecha elegida en el picker se guarda y
 * se lee de vuelta un día antes. El string no tiene esa ambigüedad, ordena
 * correctamente como texto, y es de todos modos lo que espera una API.
 */

/** Un día de calendario, sin hora ni zona horaria: `2026-09-08`. */
export type IsoDate = string;

/** El día en que abre la semana, en términos de `Date.getDay()`: 0 domingo, 1 lunes. */
export const WEEK_START = 0;

export const DAYS_IN_WEEK = 7;

/**
 * Filas de semana que la cuadrícula de un mes siempre dibuja, sin importar lo
 * que ese mes necesite.
 *
 * Seis, porque seis es lo máximo que cualquier mes puede requerir. Dibujar
 * solo las filas que un mes usa hace que el calendario cambie de altura al
 * pasar de mes en mes — en 2026 eso es un salto de **cuatro filas en febrero
 * a seis en mayo**, así que el popup brinca, el campo debajo se mueve, y el
 * día al que apuntabas ya no está donde tu ojo lo dejó. Un marco fijo cuesta
 * una fila de días vecinos en febrero y compra un calendario que nunca se
 * mueve.
 */
export const WEEKS_IN_GRID = 6;

/** Indexado por `Date.getDay()`, para que el arreglo sea la fuente de verdad y no una copia. */
const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

/**
 * Los encabezados de columna en el orden en que la cuadrícula los muestra.
 *
 * Derivados rotando el arreglo canónico en vez de escribirse una segunda vez:
 * con dos listas mantenidas a mano, cambiar `WEEK_START` dejaría en silencio
 * a los encabezados apuntando a las columnas equivocadas.
 */
export const WEEKDAY_HEADINGS: readonly string[] = Array.from(
  { length: DAYS_IN_WEEK },
  (_, column) => WEEKDAY_NAMES[(column + WEEK_START) % DAYS_IN_WEEK],
);

/** Una casilla de la cuadrícula de un mes. */
export interface DaySlot {
  /** El día que representa, como fecha de calendario simple. */
  readonly iso: IsoDate;

  /** Su número, que es todo lo que la casilla muestra. */
  readonly day: number;

  /** Pertenece a un mes vecino: se muestra por forma, no para elegirse. */
  readonly muted: boolean;

  readonly today: boolean;
}

/** `2026-09-08` a partir de un `Date`, leído en hora local — nunca vía `toISOString`. */
export function toIso(date: Date): IsoDate {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Un `Date` local a medianoche a partir de `2026-09-08`.
 *
 * Construido a partir de los tres números en vez de parseado: `new
 * Date('2026-09-08')` es UTC por especificación, y ese es justo el bug de
 * «un día de más o de menos» que este módulo existe para evitar.
 */
export function fromIso(iso: IsoDate): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Hoy, como día de calendario. */
export function todayIso(): IsoDate {
  return toIso(new Date());
}

/**
 * Distribuye el mes que contiene a `reference` como **seis** semanas
 * completas.
 *
 * Los días al inicio y al final vienen de los meses vecinos y se marcan como
 * `muted`. Construidos con `new Date(year, month, dayNumber)` en vez de por
 * aritmética, que es lo que hace correcto el cálculo a través de meses de
 * distinta duración y años bisiestos — el constructor normaliza por sí solo
 * un día fuera de rango hacia el mes adyacente.
 *
 * Siempre seis filas: ver `WEEKS_IN_GRID` para saber por qué el marco es
 * fijo.
 */
export function monthGrid(reference: Date): readonly (readonly DaySlot[])[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstOfMonth = new Date(year, month, 1);

  const lead = (firstOfMonth.getDay() - WEEK_START + DAYS_IN_WEEK) % DAYS_IN_WEEK;
  const total = WEEKS_IN_GRID * DAYS_IN_WEEK;
  const today = todayIso();

  const slots: DaySlot[] = [];
  for (let offset = 0; offset < total; offset += 1) {
    const date = new Date(year, month, offset - lead + 1);
    const iso = toIso(date);
    slots.push({
      iso,
      day: date.getDate(),
      muted: date.getMonth() !== month,
      today: iso === today,
    });
  }

  const weeks: DaySlot[][] = [];
  for (let index = 0; index < slots.length; index += DAYS_IN_WEEK) {
    weeks.push(slots.slice(index, index + DAYS_IN_WEEK));
  }
  return weeks;
}

/** El mes que está a `offset` meses del que contiene a `reference`. */
export function shiftMonth(reference: Date, offset: number): Date {
  // El día 1, para que un desplazamiento desde el 31 no se salte un mes corto.
  return new Date(reference.getFullYear(), reference.getMonth() + offset, 1);
}

const MONTH_TITLE = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });

/** «Septiembre de 2026», con la mayúscula con la que se escribe un encabezado en español. */
export function monthTitle(reference: Date): string {
  const text = MONTH_TITLE.format(reference);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** El orden en que llegan los números al escribir una fecha aquí: día, mes, año. */
const TYPED_DATE = /^(\d{1,2})\s*[/\-. ]\s*(\d{1,2})\s*[/\-. ]\s*(\d{2,4})$/;

/** Una fecha ISO escrita completa, que vale la pena aceptar porque no es ambigua. */
const TYPED_ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** Los años de dos cifras caen en este siglo. `26` es 2026, no 1926. */
const CENTURY = 2000;

/**
 * Lee una fecha que alguien escribió, o devuelve `null`.
 *
 * **Día primero**, porque ese es el orden en que el español escribe y dice
 * las fechas: `08/09/2026` es el 8 de septiembre. Esto es lo único de una
 * fecha escrita que no se puede adivinar — el mismo string significa el 9 de
 * agosto en inglés — así que el componente declara el orden en vez de
 * inferirlo, y el campo lo dice en su pista.
 *
 * Los separadores son flexibles a propósito (`/`, `-`, `.` o un espacio),
 * porque qué tecla alcance alguien no es información. Lo que NO es flexible
 * es el resultado: un día que no existe se rechaza en vez de desbordarse, así
 * que `31/02/2026` es `null` y nunca «2 de marzo». `new Date(2026, 1, 31)`
 * devolvería felizmente esto último, que es como un error de dedo se
 * convierte en una fecha equivocada dentro de una base de datos.
 */
export function parseDate(text: string): IsoDate | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const iso = TYPED_ISO.exec(trimmed);
  if (iso) {
    return build(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  }

  const parts = TYPED_DATE.exec(trimmed);
  if (!parts) {
    return null;
  }

  const day = Number(parts[1]);
  const month = Number(parts[2]);
  const rawYear = Number(parts[3]);
  const year = parts[3].length <= 2 ? CENTURY + rawYear : rawYear;
  return build(year, month, day);
}

/** Una fecha ISO, o `null` cuando los tres números no nombran un día real. */
function build(year: number, month: number, day: number): IsoDate | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  // El constructor desborda un día imposible hacia el mes siguiente; si se
  // movió, el día no existía.
  if (date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toIso(date);
}

/** `08/09/2026` — la forma que el campo muestra y acepta. */
export function formatTyped(iso: IsoDate): string {
  const date = fromIso(iso);
  if (!date) {
    return '';
  }
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Los meses, para un picker que permite saltar directo a uno. */
export const MONTH_NAMES: readonly string[] = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2000, month, 1)),
);

/** El día que está a `offset` días de distancia, como día de calendario. */
export function shiftDay(iso: IsoDate, offset: number): IsoDate {
  const date = fromIso(iso) ?? new Date();
  date.setDate(date.getDate() + offset);
  return toIso(date);
}
