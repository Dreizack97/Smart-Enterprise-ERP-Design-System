import { Component, computed, inject, signal } from '@angular/core';
import { Notifications } from '@core/services/notification';
import { Button } from '@shared/components/actions/button/button';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { DataTable } from '@shared/components/data/data-table/data-table';
import { TableColumn, TableSort } from '@shared/components/data/data-table/data-table.model';
import { TableCell } from '@shared/components/data/data-table/table-cell';
import { TableToolbar } from '@shared/components/data/table-toolbar/table-toolbar';
import { EmptyState } from '@shared/components/feedback/empty-state/empty-state';
import { StatusBadge } from '@shared/components/feedback/status-badge/status-badge';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Select, SelectOption } from '@shared/components/forms/select/select';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { Pagination } from '@shared/components/navigation/pagination/pagination';
import {
  DropdownMenu,
  DropdownMenuEntry,
  DropdownMenuItem,
  MENU_SEPARATOR,
} from '@shared/components/overlays/dropdown-menu/dropdown-menu';
import { Drawer } from '@shared/components/overlays/drawer/drawer';
import { PageHeader } from '@layout/components/page-header/page-header';
import { StatusTone } from '@shared/models/status-tone.model';
import { normalise } from '@shared/utils/text';

interface Client {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly contact: string;
  readonly amount: number;
  readonly status: StatusTone;
  readonly statusLabel: string;
  readonly since: string;
}

const CURRENCY = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Cuántas filas muestra una página. La tabla nunca pagina; esta pantalla sí. */
const PAGE_SIZE = 6;

const CLIENTS: readonly Client[] = [
  {
    id: 1,
    name: 'Ángela Ruiz',
    city: 'Guadalajara',
    contact: 'angela@vega.mx',
    amount: 12500,
    status: 'success',
    statusLabel: 'Activa',
    since: 'feb 2024',
  },
  {
    id: 2,
    name: 'Angel Moreno',
    city: 'Monterrey',
    contact: 'angel@moreno.mx',
    amount: 980.5,
    status: 'warning',
    statusLabel: 'Pendiente',
    since: 'may 2024',
  },
  {
    id: 3,
    name: 'Bruno Díaz',
    city: 'León',
    contact: 'bruno@diaz.mx',
    amount: 320,
    status: 'neutral',
    statusLabel: 'Borrador',
    since: 'ene 2026',
  },
  {
    id: 4,
    name: 'Carmen Ibáñez',
    city: 'Ciudad de México',
    contact: 'carmen@ibanez.mx',
    amount: 45300,
    status: 'success',
    statusLabel: 'Activa',
    since: 'sep 2023',
  },
  {
    id: 5,
    name: 'Diego Salazar',
    city: 'Puebla',
    contact: 'diego@salazar.mx',
    amount: 7200,
    status: 'danger',
    statusLabel: 'Rechazada',
    since: 'mar 2025',
  },
  {
    id: 6,
    name: 'Elena Prado',
    city: 'Mérida',
    contact: 'elena@prado.mx',
    amount: 158000,
    status: 'info',
    statusLabel: 'En revisión',
    since: 'jul 2025',
  },
  {
    id: 7,
    name: 'Fernando Gil',
    city: 'Guadalajara',
    contact: 'fernando@gil.mx',
    amount: 26400,
    status: 'success',
    statusLabel: 'Activa',
    since: 'nov 2024',
  },
  {
    id: 8,
    name: 'Gabriela Ochoa',
    city: 'Monterrey',
    contact: 'gabriela@ochoa.mx',
    amount: 3150,
    status: 'warning',
    statusLabel: 'Pendiente',
    since: 'abr 2025',
  },
  {
    id: 9,
    name: 'Héctor Naranjo',
    city: 'Ciudad de México',
    contact: 'hector@naranjo.mx',
    amount: 89200,
    status: 'success',
    statusLabel: 'Activa',
    since: 'jun 2022',
  },
  {
    id: 10,
    name: 'Irene Cortés',
    city: 'Puebla',
    contact: 'irene@cortes.mx',
    amount: 540,
    status: 'neutral',
    statusLabel: 'Borrador',
    since: 'ago 2026',
  },
  {
    id: 11,
    name: 'Javier Lomas',
    city: 'León',
    contact: 'javier@lomas.mx',
    amount: 61800,
    status: 'info',
    statusLabel: 'En revisión',
    since: 'oct 2024',
  },
  {
    id: 12,
    name: 'Zoe Márquez',
    city: 'Mérida',
    contact: 'zoe@marquez.mx',
    amount: 14900,
    status: 'danger',
    statusLabel: 'Rechazada',
    since: 'dic 2025',
  },
];

/**
 * **Plantilla Listado** — una pantalla de listado completa ensamblada con
 * piezas del sistema.
 *
 * El filtrado y la paginación se hacen aquí, sobre un arreglo constante, y
 * esa ubicación es el punto y no un atajo: `app-data-table` ordena lo que
 * se le da y nunca filtra ni pagina. Mantener esas dos tareas afuera es lo
 * que permite que la misma tabla se sostenga sobre una consulta del lado
 * del servidor sin cambiar.
 *
 * Los dos componentes que esta plantilla esperaba llegaron y ya están en
 * su lugar: `table-toolbar` contiene la fila de filtros que antes se
 * componía a mano, y el detalle se abre en un `drawer` en vez de un modal
 * — que es justo el punto de un drawer, porque la fila de la que quien lee
 * partió se queda en pantalla junto a él.
 */
@Component({
  selector: 'app-clients',
  imports: [
    Avatar,
    Breadcrumb,
    Button,
    DataTable,
    Drawer,
    DropdownMenu,
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    SectionCard,
    Select,
    StatusBadge,
    TableCell,
    TableToolbar,
  ],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients {
  private readonly notifications = inject(Notifications);

  protected readonly query = signal('');
  protected readonly status = signal('');
  protected readonly city = signal('');
  protected readonly page = signal(1);
  protected readonly sort = signal<TableSort | null>({ columnId: 'name', direction: 'asc' });
  protected readonly detailOpen = signal(false);
  protected readonly selected = signal<Client | null>(null);

  protected readonly statusOptions: readonly SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'success', label: 'Activa' },
    { value: 'warning', label: 'Pendiente' },
    { value: 'info', label: 'En revisión' },
    { value: 'danger', label: 'Rechazada' },
    { value: 'neutral', label: 'Borrador' },
  ];

  protected readonly cityOptions: readonly SelectOption[] = [
    { value: '', label: 'Todas las ciudades' },
    ...[...new Set(CLIENTS.map((client) => client.city))]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((city) => ({ value: city, label: city })),
  ];

  protected readonly rowActions: readonly DropdownMenuEntry[] = [
    { label: 'Ver detalle', icon: 'eye' },
    { label: 'Editar', icon: 'pencil' },
    { label: 'Duplicar', icon: 'copy' },
    MENU_SEPARATOR,
    { label: 'Eliminar', icon: 'trash-2', danger: true },
  ];

  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Clientes' },
  ];

  protected readonly filtered = computed(() => {
    const needle = normalise(this.query().trim());
    const status = this.status();
    const city = this.city();

    return CLIENTS.filter((client) => {
      if (status && client.status !== status) {
        return false;
      }
      if (city && client.city !== city) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        normalise(client.name).includes(needle) ||
        normalise(client.contact).includes(needle) ||
        normalise(client.city).includes(needle)
      );
    });
  });

  /**
   * Ordenado aquí, antes del corte — y ese orden es todo el punto.
   *
   * `app-data-table` ordena lo que se le entrega, que en una pantalla
   * paginada es una sola página: hacer clic en un encabezado habría
   * reordenado las seis filas en pantalla y dejado las otras seis donde
   * estaban. La tabla reporta el estado de su encabezado a través de
   * `sortChange`, esta pantalla ordena el conjunto completo, y la página
   * que devuelve ya está en el orden correcto.
   */
  private readonly sorted = computed(() => {
    const sort = this.sort();
    const rows = [...this.filtered()];
    if (!sort) {
      return rows;
    }
    const direction = sort.direction === 'desc' ? -1 : 1;
    return rows.sort((a, b) => direction * compare(a, b, sort.columnId));
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)),
  );

  /**
   * Las filas de la página actual.
   *
   * El número de página se acota al leerse en vez de reiniciarse por un
   * efecto: un filtro que deja tres resultados mientras quien lee está en
   * la página 4 debe mostrar la página 1, y escribir eso de vuelta en el
   * signal desde un efecto es cómo empieza un bucle de detección de
   * cambios.
   */
  protected readonly currentPage = computed(() => Math.min(this.page(), this.pageCount()));

  protected readonly rows = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.sorted().slice(start, start + PAGE_SIZE);
  });

  protected readonly summary = computed(() => {
    const total = this.filtered().length;
    if (total === 0) {
      return 'Ningún cliente coincide';
    }
    const start = (this.currentPage() - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, total);
    return `${start}–${end} de ${total} clientes`;
  });

  protected readonly hasFilters = computed(
    () => this.query().trim() !== '' || this.status() !== '' || this.city() !== '',
  );

  protected readonly columns: readonly TableColumn<Client>[] = [
    { id: 'name', header: 'Cliente', cell: (row) => row.name, sortable: true, hideable: false },
    { id: 'city', header: 'Ciudad', cell: (row) => row.city, sortable: true },
    { id: 'since', header: 'Alta', cell: (row) => row.since, sortable: true },
    {
      id: 'amount',
      header: 'Facturado',
      cell: (row) => CURRENCY.format(row.amount),
      sortValue: (row) => row.amount,
      sortable: true,
      align: 'end',
      cellClass: 'font-mono',
    },
    { id: 'status', header: 'Estado', sortValue: (row) => row.statusLabel, sortable: true },
    { id: 'actions', header: 'Acciones', hideable: false },
  ];

  protected onSortChange(sort: TableSort | null): void {
    this.sort.set(sort);
  }

  protected trackClient(row: Client): number {
    return row.id;
  }

  protected clearFilters(): void {
    this.query.set('');
    this.status.set('');
    this.city.set('');
    this.page.set(1);
  }

  protected openDetail(client: Client): void {
    this.selected.set(client);
    this.detailOpen.set(true);
  }

  protected onRowAction(client: Client, item: DropdownMenuItem): void {
    if (item.label === 'Ver detalle') {
      this.openDetail(client);
      return;
    }
    this.notifications.info(`«${item.label}» sobre ${client.name}. Esto es una vitrina.`);
  }

  protected formatAmount(value: number): string {
    return CURRENCY.format(value);
  }
}

/** La misma collation en español que usa la tabla, aplicada al conjunto completo. */
const COLLATOR = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

function compare(a: Client, b: Client, columnId: string): number {
  if (columnId === 'amount') {
    return a.amount - b.amount;
  }
  const key = columnId === 'status' ? 'statusLabel' : (columnId as keyof Client);
  return COLLATOR.compare(String(a[key] ?? ''), String(b[key] ?? ''));
}
