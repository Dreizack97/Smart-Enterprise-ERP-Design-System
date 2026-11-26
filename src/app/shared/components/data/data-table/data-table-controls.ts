import { Component, input, output } from '@angular/core';
import { Button } from '@shared/components/actions/button/button';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Icon } from '@shared/components/media/icon/icon';
import { StatusIndicator } from '@shared/components/feedback/status-indicator/status-indicator';
import { DropdownMenu } from '@shared/components/overlays/dropdown-menu/dropdown-menu';
import { nextElementId } from '@shared/utils/element-id';
import { TableSort, TableStatusFilter } from './data-table.model';

/** Columna de presentación para los controles de orden y visibilidad. */
interface ControlColumn {
  readonly id: string;
  readonly label: string;
  readonly visible: boolean;
}

/** Barra interna de la tabla; el estado y los datos siguen perteneciendo a DataTable. */
@Component({
  selector: 'app-data-table-controls',
  imports: [Button, Checkbox, Icon, DropdownMenu, StatusIndicator],
  templateUrl: './data-table-controls.html',
  styleUrl: './data-table-controls.css',
})
export class DataTableControls {
  readonly hasStatusColumn = input(false);
  readonly statusCounts = input({ all: 0, active: 0, inactive: 0 });
  readonly statusFilter = input<TableStatusFilter>('all');
  /** Mantiene visible el control sin inventar conteos si la API no informa actividad. */
  readonly statusUnavailable = input(false);
  readonly sortableColumns = input<readonly ControlColumn[]>([]);
  readonly sortBreakpoint = input<820 | 1000 | 1280 | null>(null);
  readonly toggleableColumns = input<readonly ControlColumn[]>([]);
  readonly currentSort = input<TableSort | null>(null);
  readonly columnMenu = input(false);
  readonly statusChanged = output<TableStatusFilter>();
  readonly sortColumnChanged = output<string>();
  readonly directionChanged = output<void>();
  readonly visibilityChange = output<{ id: string; visible: boolean }>();
  protected readonly sortSelectId = nextElementId('table-sort');

  protected setStatusFilter(value: TableStatusFilter): void {
    if (this.statusUnavailable() && value !== 'all') return;
    this.statusChanged.emit(value);
  }
  protected toggleMobileSortDirection(): void {
    this.directionChanged.emit();
  }
  protected onMobileSortColumnChange(event: Event): void {
    this.sortColumnChanged.emit((event.target as HTMLSelectElement).value);
  }
}
