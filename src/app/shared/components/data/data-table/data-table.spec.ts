import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable } from './data-table';
import { MobileTableLayout, TableColumn, TableStatusFilter } from './data-table.model';
import { TableCell } from './table-cell';

interface Item {
  id: number;
  name: string;
  isActive: boolean;
}

/** Consumidor real para comprobar el contrato de los controles extraídos de DataTable. */
@Component({
  selector: 'app-table-test-host',
  imports: [DataTable, TableCell],
  template: `
    <app-data-table
      [columns]="columns()"
      [rows]="rows()"
      [trackBy]="trackBy()"
      [page]="page()"
      [pageSize]="pageSize()"
      [loading]="loading()"
      [mobileLayout]="mobileLayout()"
      [(statusFilter)]="status"
      [columnMenu]="true"
      [rowClickable]="true"
      [highlightedRowId]="highlightedId()"
      (rowClick)="clickedRow.set($event)"
    >
      @if (templated()) {
        <ng-template appTableCell="name" [appTableCellOf]="rows()" let-row>
          <strong class="custom-name">{{ row.name }}</strong>
        </ng-template>
      }
    </app-data-table>
    <app-data-table [columns]="columns()" [rows]="rows()" />
  `,
})
class TableTestHost {
  readonly status = signal<TableStatusFilter>('all');
  readonly highlightedId = signal<string | number | null>(null);
  readonly trackBy = signal<(row: Item, index: number) => string | number>((row) => row.id);
  readonly page = signal(1);
  readonly pageSize = signal(0);
  readonly loading = signal(false);
  readonly mobileLayout = signal<MobileTableLayout>('standard');
  readonly clickedRow = signal<Item | null>(null);
  readonly templated = signal(false);
  readonly columns = signal<readonly TableColumn<Item>[]>([
    {
      id: 'name',
      header: 'Nombre',
      cell: (row) => row.name,
      sortable: true,
      mobileRole: 'primary',
    },
    {
      id: 'status',
      header: 'Estado',
      cell: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
      hideable: false,
    },
  ]);
  readonly rows = signal<readonly Item[]>([
    { id: 1, name: 'Zeta', isActive: true },
    { id: 2, name: 'Alfa', isActive: true },
    { id: 3, name: 'Beta', isActive: false },
  ]);
}

describe('DataTable: controles', () => {
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    TestBed.configureTestingModule({
      imports: [TableTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    });
  });

  afterEach(() => {
    if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('conserva las tarjetas estándar y aplica cada distribución móvil solo a la tabla que la solicita', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const tables = fixture.nativeElement.querySelectorAll('table') as NodeListOf<HTMLTableElement>;
    expect([...tables].every((table) => !table.classList.contains('table--stacked-mobile'))).toBe(
      true,
    );

    fixture.componentInstance.mobileLayout.set('stacked');
    await fixture.whenStable();
    expect(tables[0].classList.contains('table--stacked-mobile')).toBe(true);
    expect(tables[1].classList.contains('table--stacked-mobile')).toBe(false);

    fixture.componentInstance.mobileLayout.set('title-first');
    await fixture.whenStable();
    expect(tables[0].classList.contains('table--title-first-mobile')).toBe(true);
    expect(tables[0].classList.contains('table--stacked-mobile')).toBe(false);
    expect(tables[1].classList.contains('table--title-first-mobile')).toBe(false);

    fixture.componentInstance.mobileLayout.set('standard');
    await fixture.whenStable();
    expect(tables[0].classList.contains('table--stacked-mobile')).toBe(false);
    expect(tables[0].classList.contains('table--title-first-mobile')).toBe(false);
  });

  it('expone todas las coincidencias ordenadas aunque solo muestre una fila de la segunda página', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.pageSize.set(1);
    fixture.componentInstance.page.set(2);
    await fixture.whenStable();
    const element = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    const select = element.querySelector('select') as HTMLSelectElement;
    select.value = 'name';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    const table = fixture.debugElement.query(By.directive(DataTable))
      .componentInstance as DataTable<Item>;
    expect(table.processedRows().map((row) => row.name)).toEqual(['Alfa', 'Beta', 'Zeta']);
    expect(element.querySelectorAll('.table__row')).toHaveLength(1);
    expect(element.querySelector('.table__row')?.textContent).toContain('Beta');
    fixture.componentInstance.status.set('active');
    await fixture.whenStable();
    expect(table.processedRows().map((row) => row.name)).toEqual(['Alfa', 'Zeta']);
  });

  it('filtra el estado desde la barra y ordena desde el selector móvil', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    (table.querySelectorAll('.table__status-pill')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.status()).toBe('active');
    expect(table.querySelectorAll('.table__row').length).toBe(2);
    const select = table.querySelector('select') as HTMLSelectElement;
    select.value = 'name';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(table.querySelector('.table__row')?.textContent).toContain('Alfa');
    (table.querySelector('.table__mobile-sort-dir') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(table.querySelector('.table__row')?.textContent).toContain('Zeta');
  });

  it('mantiene único el identificador accesible de cada selector de ordenamiento', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const selects = [...fixture.nativeElement.querySelectorAll('select')] as HTMLSelectElement[];
    expect(selects.length).toBe(2);
    expect(new Set(selects.map((select) => select.id)).size).toBe(2);
    for (const select of selects) expect(select.labels?.[0]?.textContent).toContain('Ordenar');
  });

  it('alterna la visibilidad de una columna desde el menú', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    (table.querySelector('.table__column-menu-wrap button') as HTMLButtonElement).click();
    await fixture.whenStable();
    const label = [...document.querySelectorAll('.table__columns label')].find((element) =>
      element.textContent?.includes('Nombre'),
    ) as HTMLLabelElement;
    expect(label).toBeDefined();
    label.click();
    await fixture.whenStable();
    expect(
      [...table.querySelectorAll('.table__header')].some((header) =>
        header.textContent?.includes('Nombre'),
      ),
    ).toBe(false);
  });

  it('copia el texto de la celda sin disparar la navegación de fila con clic o teclado', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    const copyBtn = table.querySelector('app-copy-button button') as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();
    expect(copyBtn.getAttribute('aria-label')).toBe('Copiar Nombre');
    for (const key of ['Enter', ' ']) {
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      expect(fixture.componentInstance.clickedRow()).toBeNull();
    }
    copyBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('Zeta');
    expect(copyBtn.classList.contains('copy--copied')).toBe(true);
    expect(fixture.componentInstance.clickedRow()).toBeNull();

    (table.querySelector('.table__row') as HTMLElement).click();
    expect(fixture.componentInstance.clickedRow()?.name).toBe('Zeta');
  });

  it('mantiene el fallo de copia separado de la acción de fila', async () => {
    writeText.mockRejectedValue(new DOMException('Acceso denegado', 'NotAllowedError'));
    const fixture = TestBed.createComponent(TableTestHost);
    await fixture.whenStable();
    const copyBtn = fixture.nativeElement.querySelector(
      'app-copy-button button',
    ) as HTMLButtonElement;
    copyBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(copyBtn.classList.contains('copy--error')).toBe(true);
    expect(copyBtn.classList.contains('copy--copied')).toBe(false);
    expect(fixture.componentInstance.clickedRow()).toBeNull();
  });

  it('no ofrece copiar una clave de ordenamiento cuando falta texto de celda', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      { id: 'name', header: 'Clave interna', sortValue: (row) => row.id, mobileRole: 'primary' },
    ]);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-copy-button')).toBeNull();
  });

  it('copia el texto visible aunque la columna ordene por una clave diferente', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      {
        id: 'name',
        header: 'Nombre',
        cell: (row) => row.name,
        sortValue: (row) => row.id,
        mobileRole: 'primary',
      },
    ]);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('app-copy-button button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('Zeta');
  });

  it.each([
    { text: '', copyable: true },
    { text: '—', copyable: true },
    { text: '-', copyable: true },
    { text: 'Dato', copyable: false },
  ])(
    'omite controles para valores vacíos, marcadores o columnas deshabilitadas: $text / $copyable',
    async ({ text, copyable }) => {
      const fixture = TestBed.createComponent(TableTestHost);
      fixture.componentInstance.columns.set([
        { id: 'name', header: 'Nombre', cell: () => text, mobileRole: 'primary', copyable },
      ]);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('app-copy-button')).toBeNull();
    },
  );

  it('respeta la exclusión predeterminada de estados y conserva el cero como dato válido', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      { id: 'name', header: 'Cantidad', cell: () => '0', mobileRole: 'primary' },
      { id: 'status', header: 'Estado', cell: () => 'Activo', mobileRole: 'badge' },
    ]);
    await fixture.whenStable();
    const row = fixture.nativeElement.querySelector('.table__row') as HTMLElement;
    expect(row.querySelectorAll('app-copy-button')).toHaveLength(1);
    (row.querySelector('app-copy-button button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('0');
  });

  it('permite habilitar explícitamente la copia de una columna de estado', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      { id: 'status', header: 'Estado', cell: () => 'Activo', mobileRole: 'badge', copyable: true },
    ]);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('app-copy-button button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('Activo');
  });

  it('preserva la plantilla de celda al habilitar o deshabilitar la copia', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.templated.set(true);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.custom-name')?.textContent).toBe('Zeta');
    (table.querySelector('app-copy-button button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('Zeta');

    fixture.componentInstance.columns.update((columns) =>
      columns.map((column) => ({ ...column, copyable: false })),
    );
    await fixture.whenStable();
    expect(table.querySelector('app-copy-button')).toBeNull();
    expect(table.querySelector('.custom-name')?.textContent).toBe('Zeta');
  });

  it('resalta únicamente la fila indicada y permite retirar y repetir la confirmación', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    host.highlightedId.set(2);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    const highlightedRows = table.querySelectorAll('.table__row--highlighted');
    expect(highlightedRows).toHaveLength(1);
    expect(highlightedRows[0].textContent).toContain('Alfa');
    expect(fixture.nativeElement.querySelectorAll('.table__row--highlighted')).toHaveLength(1);

    host.highlightedId.set(null);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.highlightedId.set(2);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Alfa');
  });

  it('no infiere altas al cargar, agregar, filtrar o recuperar los datos de una búsqueda', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.rows.update((rows) => [...rows, { id: 4, name: 'Delta', isActive: true }]);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    const allRows = host.rows();
    host.rows.set(allRows.filter((row) => row.id === 1));
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.rows.set(allRows.map((row) => ({ ...row })));
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
  });

  it('admite claves numéricas, su representación textual y el cero', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    host.rows.set([{ id: 0, name: 'Cero', isActive: true }, ...host.rows()]);
    host.highlightedId.set(0);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Cero');
    host.highlightedId.set('2');
    await fixture.whenStable();
    expect(table.querySelectorAll('.table__row--highlighted')).toHaveLength(1);
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Alfa');
    host.highlightedId.set('inexistente');
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
  });

  it('respeta la clave personalizada de trackBy aunque el registro también tenga id', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    host.trackBy.set((row) => row.name);
    host.highlightedId.set(2);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.highlightedId.set('Alfa');
    await fixture.whenStable();
    expect(table.querySelectorAll('.table__row--highlighted')).toHaveLength(1);
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Alfa');
  });

  it('usa el índice de trackBy sin sustituirlo por el id del registro', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.trackBy.set((_row, index) => index);
    fixture.componentInstance.highlightedId.set(0);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.table__row--highlighted')?.textContent).toContain(
      'Zeta',
    );
  });

  it('mantiene la identidad resaltada al ordenar y reordenar las filas recibidas', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    host.highlightedId.set(1);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    (table.querySelector('.table__sort') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(table.querySelector('.table__row')?.textContent).toContain('Alfa');
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Zeta');
    host.rows.update((rows) => [...rows].reverse());
    await fixture.whenStable();
    expect(table.querySelectorAll('.table__row--highlighted')).toHaveLength(1);
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Zeta');
  });

  it('no traslada el resaltado a otra fila cuando la indicada queda fuera de página o filtro', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    host.highlightedId.set(3);
    host.pageSize.set(2);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.page.set(2);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Beta');
    host.status.set('active');
    host.page.set(1);
    await fixture.whenStable();
    expect(table.querySelectorAll('.table__row')).toHaveLength(2);
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
    host.status.set('all');
    host.page.set(2);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Beta');
    host.highlightedId.set(null);
    await fixture.whenStable();
    expect(table.querySelector('.table__row--highlighted')).toBeNull();
  });

  it('resalta una fila recibida después de la confirmación y la carga sin inferir otras altas', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    const host = fixture.componentInstance;
    await fixture.whenStable();
    host.loading.set(true);
    host.highlightedId.set(4);
    host.rows.update((rows) => [...rows, { id: 4, name: 'Delta', isActive: true }]);
    await fixture.whenStable();
    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(table.querySelector('.table__row')).toBeNull();
    host.loading.set(false);
    await fixture.whenStable();
    expect(table.querySelectorAll('.table__row--highlighted')).toHaveLength(1);
    expect(table.querySelector('.table__row--highlighted')?.textContent).toContain('Delta');
  });

  it('centra siempre las columnas de acciones y nunca permite ordenarlas ni ocultarlas', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      {
        id: 'name',
        header: 'Nombre',
        cell: (row) => row.name,
        sortable: true,
        mobileRole: 'primary',
      },
      { id: 'actions', header: 'Acciones', sortable: true, align: 'end', hideable: true },
    ]);
    await fixture.whenStable();

    const table = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    const headers = [...table.querySelectorAll<HTMLElement>('.table__header')];
    const actionsHeader = headers.find((header) => header.textContent?.trim() === 'Acciones');
    const actionsCell = table.querySelector<HTMLElement>('td[data-mobile-role="actions"]');

    expect(actionsHeader?.classList.contains('table__header--center')).toBe(true);
    expect(actionsHeader?.classList.contains('table__header--end')).toBe(false);
    expect(actionsHeader?.querySelector('.table__sort')).toBeNull();
    expect(actionsCell?.classList.contains('table__cell--center')).toBe(true);
    expect(actionsCell?.classList.contains('table__cell--end')).toBe(false);
  });

  it('expone el umbral del selector de ordenamiento cuando hay columnas ordenables ocultables por resolución', async () => {
    const fixture = TestBed.createComponent(TableTestHost);
    fixture.componentInstance.columns.set([
      {
        id: 'name',
        header: 'Nombre',
        cell: (row) => row.name,
        sortable: true,
        priority: 1,
        mobileRole: 'primary',
      },
      {
        id: 'status',
        header: 'Estado',
        cell: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
        sortable: true,
        priority: 3,
        mobileRole: 'badge',
      },
    ]);
    await fixture.whenStable();

    const tableToolbar = fixture.nativeElement.querySelector(
      'app-data-table app-data-table-controls .table__toolbar',
    ) as HTMLElement;
    expect(tableToolbar.getAttribute('data-sort-breakpoint')).toBe('1000');

    fixture.componentInstance.columns.set([
      {
        id: 'name',
        header: 'Nombre',
        cell: (row) => row.name,
        sortable: true,
        priority: 1,
        mobileRole: 'primary',
      },
      {
        id: 'status',
        header: 'Estado',
        cell: (row) => (row.isActive ? 'Activo' : 'Inactivo'),
        sortable: true,
        priority: 4,
        mobileRole: 'badge',
      },
    ]);
    await fixture.whenStable();
    expect(tableToolbar.getAttribute('data-sort-breakpoint')).toBe('1280');

    fixture.componentInstance.columns.set([
      {
        id: 'name',
        header: 'Nombre',
        cell: (row) => row.name,
        sortable: true,
        priority: 1,
        mobileRole: 'primary',
      },
    ]);
    await fixture.whenStable();
    expect(tableToolbar.getAttribute('data-sort-breakpoint')).toBeNull();
  });
});
