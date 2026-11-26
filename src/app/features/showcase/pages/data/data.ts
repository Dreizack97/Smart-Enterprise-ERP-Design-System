import { Component, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { Button } from '@shared/components/actions/button/button';
import { ChartCanvas } from '@shared/components/data/chart-canvas/chart-canvas';
import { DataTable } from '@shared/components/data/data-table/data-table';
import { TableColumn } from '@shared/components/data/data-table/data-table.model';
import { TableCell } from '@shared/components/data/data-table/table-cell';
import { createTablePagination } from '@shared/components/data/data-table/table-state';
import { TablePagination } from '@shared/components/data/table-pagination/table-pagination';
import { TableToolbar } from '@shared/components/data/table-toolbar/table-toolbar';
import { EmptyState } from '@shared/components/feedback/empty-state/empty-state';
import { ErrorState } from '@shared/components/feedback/error-state/error-state';
import { Skeleton } from '@shared/components/feedback/skeleton/skeleton';
import { StatusBadge } from '@shared/components/feedback/status-badge/status-badge';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Select, SelectOption } from '@shared/components/forms/select/select';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { StatusTone } from '@shared/models/status-tone.model';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';

interface Client {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly amount: number;
  readonly status: StatusTone;
  readonly statusLabel: string;
}

const CURRENCY = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Página de catálogo de la familia `data/`. */
@Component({
  selector: 'app-data',
  imports: [
    Avatar,
    Button,
    ChartCanvas,
    DataTable,
    EmptyState,
    ErrorState,
    SearchInput,
    Select,
    ShowcaseBlock,
    ShowcasePage,
    TablePagination,
    TableToolbar,
    Skeleton,
    StatusBadge,
    TableCell,
  ],
  templateUrl: './data.html',
  styleUrl: './data.css',
})
export class Data {
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  /**
   * Nombres elegidos para ejercitar la collation en español, no al azar.
   *
   * «Angel» debe ordenar junto a «Ángela» y no después de toda Z, y
   * «Pedido 9» antes que «Pedido 10» — una comparación de strings simple se
   * equivoca en ambos casos.
   */
  protected readonly clients: readonly Client[] = [
    {
      id: 1,
      name: 'Ángela Ruiz',
      city: 'Guadalajara',
      amount: 12500,
      status: 'success',
      statusLabel: 'Activa',
    },
    {
      id: 2,
      name: 'Angel Moreno',
      city: 'Monterrey',
      amount: 980.5,
      status: 'warning',
      statusLabel: 'Pendiente',
    },
    {
      id: 3,
      name: 'Pedido 10',
      city: 'Puebla',
      amount: 45300,
      status: 'success',
      statusLabel: 'Activa',
    },
    {
      id: 4,
      name: 'Pedido 9',
      city: 'Ciudad de México',
      amount: 7200,
      status: 'danger',
      statusLabel: 'Rechazada',
    },
    {
      id: 5,
      name: 'Zoe Márquez',
      city: 'Mérida',
      amount: 158000,
      status: 'info',
      statusLabel: 'En revisión',
    },
    {
      id: 6,
      name: 'Bruno Díaz',
      city: 'León',
      amount: 320,
      status: 'neutral',
      statusLabel: 'Borrador',
    },
  ];

  protected readonly emptyClients: readonly Client[] = [];

  protected readonly pagination = createTablePagination({
    totalItems: () => this.clients.length,
    pageSizes: [5, 10, 25],
    initialPageSize: 5,
  });

  protected readonly toolbarQuery = signal('');
  protected readonly toolbarStatus = signal('');
  protected readonly toolbarFiltered = signal(false);
  protected readonly toolbarSelection = signal(0);

  protected readonly toolbarStatuses: readonly SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activa' },
    { value: 'pending', label: 'Pendiente' },
  ];

  protected readonly columns: readonly TableColumn<Client>[] = [
    { id: 'name', header: 'Cliente', cell: (row) => row.name, sortable: true, hideable: false },
    { id: 'city', header: 'Ciudad', cell: (row) => row.city, sortable: true },
    {
      id: 'amount',
      header: 'Importe',
      cell: (row) => CURRENCY.format(row.amount),
      sortValue: (row) => row.amount,
      sortable: true,
      align: 'end',
      cellClass: 'font-mono',
    },
    { id: 'status', header: 'Estado', sortValue: (row) => row.statusLabel, sortable: true },
  ];

  protected readonly revenue: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{ label: 'Ingresos', data: [12, 19, 14, 22, 18, 26] }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  };

  protected readonly split: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Directo', 'Distribuidor', 'Marketplace'],
      datasets: [{ data: [48, 31, 21] }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  };

  protected readonly trend: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        { label: 'Pedidos', data: [42, 51, 47, 63, 58, 72] },
        { label: 'Devoluciones', data: [6, 4, 8, 5, 3, 4] },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  };

  protected trackClient(row: Client): number {
    return row.id;
  }

  protected reload(): void {
    this.failed.set(false);
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1400);
  }

  protected toggleError(): void {
    this.failed.update((failed) => !failed);
  }
}
