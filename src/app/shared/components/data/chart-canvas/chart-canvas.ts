import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js';
import { ChartTheme } from '@core/charts/chart-theme';
import { nextElementId } from '@shared/utils/element-id';

/**
 * Solo lo que el sistema realmente dibuja.
 *
 * `registerables` trae cada controlador, escala y plugin de Chart.js, y
 * referenciarlos todos le impide al empaquetador descartar los que nadie
 * usa: polar, radar y dispersión viajaban en el bundle sin que existiera un
 * solo gráfico de esos tipos. La lista explícita funciona además como el
 * inventario de lo que soporta el sistema de diseño; agregar un tipo
 * significa ampliarla.
 *
 * `Colors` está deliberadamente ausente: `ChartTheme` asigna la paleta
 * categórica propia del sistema, y dos fuentes de color son una de más.
 * `Filler` es lo que hace que `fill: true` bajo una línea surta efecto.
 */
Chart.register(
  BarController,
  LineController,
  DoughnutController,
  PieController,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Legend,
  Tooltip,
);

/**
 * Un `<canvas>` de Chart.js con su ciclo de vida y su tematizado ya
 * resueltos.
 *
 * Crea el gráfico, lo destruye al salir, y lo retematiza cuando cambia el
 * tema. Sin esto, cada página tendría que registrar sus gráficos a mano, que
 * es exactamente lo que hacía el original con un arreglo global.
 */
@Component({
  selector: 'app-chart-canvas',
  templateUrl: './chart-canvas.html',
  styleUrl: './chart-canvas.css',
})
export class ChartCanvas {
  /** La configuración de Chart.js. Cambiarla recrea el gráfico entero. */
  readonly config = input.required<ChartConfiguration>();

  /** Altura del canvas. Chart.js necesita un contenedor de altura definida. */
  readonly height = input('');

  /**
   * Descripción textual del gráfico.
   *
   * Un `<canvas>` es opaco para un lector de pantalla: sin esto, la
   * información que carga el gráfico simplemente no existe para quien no
   * puede verlo.
   */
  readonly summary = input.required<string>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly chartTheme = inject(ChartTheme);
  private chart: Chart | null = null;

  protected readonly summaryId = nextElementId('chart-summary');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    // `afterRenderEffect` y no `effect`, y la diferencia son 28 px de gráfico
    // colgando fuera de su tarjeta.
    //
    // Chart.js dimensiona el canvas a partir de su contenedor, lo que
    // significa que MIDE el DOM. Un `effect` normal corre durante la
    // detección de cambios, antes de que el `[style.height]` de la plantilla
    // se haya escrito, así que el contenedor todavía estaba en su 18.75rem
    // por defecto y el canvas se construía a 300px de alto dentro de una
    // caja de 17rem. Nada lo corregía después: el contenedor nunca cambiaba
    // de tamaño, así que el ResizeObserver nunca se disparaba, y el gráfico
    // simplemente se desbordaba para siempre.
    //
    // La regla, aprendida ya una vez en el showcase: un efecto no puede medir
    // el DOM que esa misma pasada de detección de cambios está a punto de
    // escribir.
    afterRenderEffect(() => {
      const config = this.config();
      const canvas = this.canvas().nativeElement;

      // Sin contexto 2D no hay gráfico que dibujar (un navegador con canvas
      // deshabilitado). El resumen textual sigue ahí, así que la información
      // no se pierde.
      if (!canvas.getContext('2d')) {
        return;
      }

      this.chartTheme.applyDefaults();
      this.chart?.destroy();
      // Coloreado antes de construirse, no después: Chart.js cachea las
      // opciones resueltas de cada elemento mientras se construye, y un color
      // asignado más tarde nunca las alcanza.
      this.chart = new Chart(canvas, this.chartTheme.prepare(config));
      this.chartTheme.applyTo(this.chart);
    });

    effect(() => {
      // Depende solo de la paleta: recolorea sin recrear el gráfico.
      this.chartTheme.palette();
      if (this.chart) {
        this.chartTheme.applyTo(this.chart);
      }
    });
  }
}
