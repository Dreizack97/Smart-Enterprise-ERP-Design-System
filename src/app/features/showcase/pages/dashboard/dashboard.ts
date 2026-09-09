import { Component, computed, inject, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { Notifications } from '@core/services/notification';
import { IconName } from '@core/icons/lucide-icons';
import { Button } from '@shared/components/actions/button/button';
import {
  SegmentOption,
  SegmentedControl,
} from '@shared/components/actions/segmented-control/segmented-control';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { StatCard, StatTrend } from '@shared/components/containers/stat-card/stat-card';
import { ChartCanvas } from '@shared/components/data/chart-canvas/chart-canvas';
import { Timeline, TimelineEntry } from '@shared/components/media/timeline/timeline';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { PageHeader } from '@layout/components/page-header/page-header';
import { Tone } from '@shared/models/tone.model';

/** Una cifra principal del panel. */
interface Kpi {
  readonly label: string;
  readonly value: string;
  readonly icon: IconName;
  readonly tone: Tone;
  readonly note: string;
  readonly trend: StatTrend;
}

/** Los dos rangos en los que se puede leer el panel. */
type Range = 'month' | 'quarter';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
const QUARTER_LABELS = ['T1 2025', 'T2 2025', 'T3 2025', 'T4 2025', 'T1 2026', 'T2 2026'];

/**
 * **Plantilla Panel** — un dashboard completo ensamblado solo con piezas del
 * sistema.
 *
 * Sin servicios y sin fetching: dos conjuntos de datos estáticos y un
 * control que alterna entre ellos. El alternado está aquí por una razón —
 * es lo que demuestra que el gráfico se vuelve a renderizar cuando cambia
 * su configuración, que una captura fija de un dashboard nunca muestra.
 *
 * El feed de actividad es `timeline`, construido en la fase 7. Hasta
 * entonces era una columna simple de `activity-item`s — las mismas filas
 * sin la línea que dice que son una sola secuencia.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    Breadcrumb,
    Button,
    ChartCanvas,
    PageHeader,
    SectionCard,
    SegmentedControl,
    StatCard,
    Timeline,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly notifications = inject(Notifications);

  protected readonly range = signal<Range>('month');

  protected readonly rangeOptions: readonly SegmentOption[] = [
    { value: 'month', label: 'Por mes' },
    { value: 'quarter', label: 'Por trimestre' },
  ];

  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Panel de control' },
  ];

  protected readonly kpis = computed<readonly Kpi[]>(() =>
    this.range() === 'month'
      ? [
          {
            label: 'Facturación',
            value: '$1.284.900',
            icon: 'dollar-sign',
            tone: 'green',
            note: '12,4 % más que agosto',
            trend: 'up',
          },
          {
            label: 'Pedidos',
            value: '482',
            icon: 'shopping-cart',
            tone: 'blue',
            note: '38 pendientes de surtir',
            trend: 'up',
          },
          {
            label: 'Clientes activos',
            value: '238',
            icon: 'users',
            tone: 'purple',
            note: 'sin cambios',
            trend: 'flat',
          },
          {
            label: 'Devoluciones',
            value: '14',
            icon: 'rotate-ccw',
            tone: 'red',
            note: '3 menos que agosto',
            trend: 'down',
          },
        ]
      : [
          {
            label: 'Facturación',
            value: '$3.812.400',
            icon: 'dollar-sign',
            tone: 'green',
            note: '8,1 % más que T1',
            trend: 'up',
          },
          {
            label: 'Pedidos',
            value: '1.431',
            icon: 'shopping-cart',
            tone: 'blue',
            note: '96 pendientes de surtir',
            trend: 'up',
          },
          {
            label: 'Clientes activos',
            value: '251',
            icon: 'users',
            tone: 'purple',
            note: '13 altas nuevas',
            trend: 'up',
          },
          {
            label: 'Devoluciones',
            value: '52',
            icon: 'rotate-ccw',
            tone: 'red',
            note: '7 más que T1',
            trend: 'up',
          },
        ],
  );

  /**
   * Una configuración nueva por rango.
   *
   * `chart-canvas` destruye y reconstruye cuando `config` cambia, y
   * Chart.js toma posesión del objeto `data` que se le entrega — así que
   * cada rango devuelve su propio literal en vez de mutar uno compartido.
   */
  protected readonly revenue = computed<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: this.range() === 'month' ? MONTH_LABELS : QUARTER_LABELS,
      datasets: [
        {
          label: 'Facturación',
          data:
            this.range() === 'month'
              ? [980, 1120, 1045, 1230, 1180, 1285]
              : [3210, 3480, 3390, 3705, 3528, 3812],
        },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false },
  }));

  protected readonly split = computed<ChartConfiguration>(() => ({
    type: 'doughnut',
    data: {
      labels: ['Directo', 'Distribuidor', 'Marketplace'],
      datasets: [{ data: this.range() === 'month' ? [48, 31, 21] : [44, 34, 22] }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  }));

  protected readonly revenueSummary = computed(() =>
    this.range() === 'month'
      ? 'Facturación mensual de enero a junio, en miles de pesos: 980, 1.120, 1.045, 1.230, 1.180 y 1.285.'
      : 'Facturación trimestral de T1 2025 a T2 2026, en miles de pesos: 3.210, 3.480, 3.390, 3.705, 3.528 y 3.812.',
  );

  protected readonly splitSummary = computed(() =>
    this.range() === 'month'
      ? 'Reparto por canal en el mes: directo 48 %, distribuidor 31 %, marketplace 21 %.'
      : 'Reparto por canal en el trimestre: directo 44 %, distribuidor 34 %, marketplace 22 %.',
  );

  protected readonly feed: readonly TimelineEntry[] = [
    {
      icon: 'user-plus',
      tone: 'blue',
      title: 'Alta de cliente',
      description: 'Ana Torres completó su registro en el portal.',
      time: 'hace 5 minutos',
    },
    {
      icon: 'shopping-cart',
      tone: 'green',
      title: 'Pedido confirmado',
      description: 'PED-2481 pasó a preparación en el almacén central.',
      time: 'hace 22 minutos',
    },
    {
      icon: 'triangle-alert',
      tone: 'yellow',
      title: 'Inventario bajo',
      description: 'Quedan 4 unidades de «Teclado mecánico RX».',
      time: 'hace 1 hora',
    },
    {
      icon: 'circle-check',
      tone: 'green',
      title: 'Factura pagada',
      description: 'FAC-1190 se liquidó por transferencia.',
      time: 'hace 3 horas',
    },
    {
      icon: 'circle-alert',
      tone: 'red',
      title: 'Pago rechazado',
      description: 'La tarjeta de Grupo Vega fue declinada.',
      time: 'ayer',
    },
  ];

  protected export(): void {
    this.notifications.info('Esto es una vitrina: no hay nada que exportar.');
  }
}
