import { DOCUMENT, Service, computed, inject } from '@angular/core';
import { Chart, ChartConfiguration, ChartDataset, ChartOptions } from 'chart.js';
import { ThemeStore } from '@core/theme/theme-store';

/** Cuántos slots categóricos define el sistema. */
const SERIES_SLOTS = 6;

/** Marca los datasets que coloreó el sistema, para poder recolorearlos al cambiar de tema. */
const SYSTEM_COLOURED = Symbol('system-coloured');

/** Tipos de gráfico cuyos datasets llevan un color por punto de dato, no por serie. */
const ARC_TYPES = new Set(['doughnut', 'pie', 'polarArea']);

interface ChartPalette {
  readonly tick: string;
  readonly grid: string;
  readonly legend: string;
  readonly tooltipSurface: string;
  readonly tooltipTitle: string;
  readonly tooltipBody: string;
  readonly markBorder: string;
  readonly fontFamily: string;
  /** El orden categórico, por posición. Nunca se cicla más allá de su longitud. */
  readonly series: readonly string[];
}

/**
 * Cromo y color de los gráficos, gobernados por el tema.
 *
 * Un `<canvas>` no hereda CSS, así que ejes, cuadrícula, leyenda, tooltip y las
 * propias marcas hay que colorearlos por código. En vez de duplicar valores hex
 * aquí —justo la deriva que los niveles de tokens existen para evitar—, la
 * paleta se lee de vuelta desde los tokens de nivel 3 `--chart-*`. Cambia el
 * token y cada gráfico lo sigue, en ambos temas.
 *
 * El sistema de diseño es dueño de su paleta categórica. Chart.js trae un
 * plugin `Colors` que asignaría una, pero deliberadamente no se registra: dos
 * fuentes de color son una de más, y el plugin se desactiva en silencio en
 * cuanto se personaliza `Chart.defaults` — que es justo lo que dejaba cada
 * gráfico en gris antes de escribir esto.
 */
@Service()
export class ChartTheme {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(ThemeStore);

  /** Se recalcula cada vez que cambia el tema, porque los tokens cambian con él. */
  readonly palette = computed<ChartPalette>(() => {
    // Depende del tema explícitamente: los valores vienen del DOM, así que nada
    // más le avisaría a este computed que ya quedaron obsoletos.
    this.theme.resolvedTheme();
    this.theme.lightPalette();
    this.theme.darkPalette();
    const read = this.tokenReader();
    return {
      tick: read('--chart-tick'),
      grid: read('--chart-grid'),
      legend: read('--chart-legend'),
      tooltipSurface: read('--chart-tooltip-surface'),
      tooltipTitle: read('--chart-tooltip-title'),
      tooltipBody: read('--chart-tooltip-body'),
      markBorder: read('--chart-mark-border'),
      fontFamily: read('--font-sans'),
      series: Array.from({ length: SERIES_SLOTS }, (_, index) =>
        read(`--chart-series-${index + 1}`),
      ).filter(Boolean),
    };
  });

  /**
   * Colorea los datasets de una configuración antes de construir el gráfico.
   *
   * Esto tiene que ocurrir *antes* de `new Chart(...)`: Chart.js resuelve y
   * cachea las opciones de cada elemento al construirse, y mutar el color
   * escalar de un dataset después nunca llega a esos elementos cacheados — las
   * barras se quedaban en el gris por defecto de Chart.js aunque el dataset
   * dijera otra cosa. Un gráfico de arcos escapaba a esto por casualidad,
   * porque un arreglo de colores se resuelve de nuevo por índice en cada
   * dibujado.
   *
   * La configuración se muta en vez de copiarse porque Chart.js de todos modos
   * toma posesión de `config.data`, así que una copia solo le daría al
   * llamador un objeto obsoleto.
   */
  prepare(config: ChartConfiguration): ChartConfiguration {
    // Antes del retorno anticipado de abajo: un gráfico sin paleta igual anima.
    if (this.prefersReducedMotion()) {
      config.options = { ...config.options, animation: false };
    }

    const palette = this.palette();
    if (palette.series.length === 0) {
      return config;
    }

    const arcChart = ARC_TYPES.has(String(config.type));
    config.data.datasets.forEach((dataset, index) => {
      this.paint(dataset as ChartDataset, index, arcChart, palette);
    });
    return config;
  }

  /**
   * Si quien lee pidió menos movimiento.
   *
   * Un `<canvas>` se pinta por script, así que la regla general
   * `prefers-reduced-motion` de `base.css` —escrita contra `*`— nunca llega a
   * un gráfico: las barras seguían creciendo y los arcos seguían barriendo
   * para alguien que pidió lo contrario. Hay que avisarle a Chart.js por
   * separado, y este es el único lugar por el que pasa cada gráfico del
   * sistema camino a construirse.
   */
  private prefersReducedMotion(): boolean {
    return (
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false
    );
  }

  /** Tipografía y color de texto por defecto, aplicados una vez por cada gráfico creado. */
  applyDefaults(): void {
    const palette = this.palette();
    Chart.defaults.font.family = palette.fontFamily;
    Chart.defaults.color = palette.tick;
    // NO el color de la cuadrícula, que es lo que el original ponía aquí.
    // Chart.js le pasa este valor por defecto a todo dataset que no declare
    // borde, así que el tinte de la cuadrícula se filtraba a las marcas; el
    // color de superficie es lo que un separador de relleno necesita.
    Chart.defaults.borderColor = palette.markBorder;
  }

  /**
   * Reescribe el cromo y las marcas de un gráfico ya creado.
   *
   * Se respeta `grid.display === false`: algunos mini-gráficos ocultan la
   * cuadrícula a propósito, y volver a pintarla los arruinaría.
   */
  applyTo(chart: Chart): void {
    const palette = this.palette();
    const options = chart.options as ChartOptions;

    for (const scale of Object.values(options.scales ?? {})) {
      if (!scale) {
        continue;
      }
      scale.ticks = { ...scale.ticks, color: palette.tick };
      if (scale.grid?.display !== false) {
        scale.grid = { ...scale.grid, color: palette.grid };
      }
    }

    options.plugins = {
      ...options.plugins,
      legend: {
        ...options.plugins?.legend,
        labels: { ...options.plugins?.legend?.labels, color: palette.legend },
      },
      tooltip: {
        ...options.plugins?.tooltip,
        backgroundColor: palette.tooltipSurface,
        titleColor: palette.tooltipTitle,
        bodyColor: palette.tooltipBody,
      },
    };

    this.colourSeries(chart, palette);

    // Sin animación: esto es un recoloreo, no un cambio de datos.
    chart.update('none');
  }

  /**
   * Asigna la paleta categórica a los datasets que llegaron sin color.
   *
   * Un dataset que el llamador ya coloreó se deja intacto. Los nuestros se
   * marcan, para que un cambio de tema los recoloree en vez de confundir la
   * asignación anterior con una decisión deliberada.
   */
  private colourSeries(chart: Chart, palette: ChartPalette): void {
    if (palette.series.length === 0) {
      return;
    }

    chart.data.datasets.forEach((dataset, index) => {
      // Se lee el tipo desde los propios metadatos del dataset y no desde la
      // configuración del gráfico: un gráfico mixto puede tener a la vez una
      // línea y una dona, y el tipo de la configuración no se puede acotar
      // entre ambas formas de configuración.
      const isArc = ARC_TYPES.has(String(chart.getDatasetMeta(index).type));
      this.paint(dataset as ChartDataset, index, isArc, palette);
    });
  }

  /**
   * Asigna un slot de la paleta categórica a un dataset.
   *
   * Un dataset que el llamador ya coloreó se deja intacto. Los nuestros se
   * marcan, para que un cambio de tema los recoloree en vez de confundir la
   * asignación anterior con una decisión deliberada.
   */
  private paint(dataset: ChartDataset, index: number, isArc: boolean, palette: ChartPalette): void {
    const marked = dataset as ChartDataset & { [SYSTEM_COLOURED]?: boolean };
    const untouched = dataset.backgroundColor === undefined && dataset.borderColor === undefined;

    if (!untouched && !marked[SYSTEM_COLOURED]) {
      return;
    }
    marked[SYSTEM_COLOURED] = true;

    if (isArc) {
      // Un color por rebanada, en el orden de la paleta, con un anillo de
      // superficie entre ellas para que los arcos contiguos se lean como
      // marcas separadas.
      dataset.backgroundColor = dataset.data.map(
        (_, slice) => palette.series[slice % palette.series.length],
      );
      dataset.borderColor = palette.markBorder;
      dataset.borderWidth = 2;
      return;
    }

    const colour = palette.series[index % palette.series.length];
    dataset.backgroundColor = colour;
    dataset.borderColor = colour;
  }

  private tokenReader(): (token: string) => string {
    const view = this.document.defaultView;
    if (!view) {
      return () => '';
    }
    const styles = view.getComputedStyle(this.document.documentElement);
    return (token) => styles.getPropertyValue(token).trim();
  }
}
