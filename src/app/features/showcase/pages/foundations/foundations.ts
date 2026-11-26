import { Component, DOCUMENT, afterNextRender, computed, inject, signal } from '@angular/core';
import { ICON_NAMES } from '@core/icons/lucide-icons';
import { ThemeStore } from '@core/theme/theme-store';
import { Icon } from '@shared/components/media/icon/icon';
import { TONES } from '@shared/models/tone.model';
import { CopyToken } from '@features/showcase/directives/copy-token/copy-token';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';
import { CONTRAST_AA, contrastRatio, formatRatio } from '@features/showcase/utils/contrast-ratio';
import { TokenEntry, collectTokens } from '@features/showcase/utils/token-catalog';

/** Un token sin su prefijo de grupo, para que la etiqueta se lea como el escalón. */
interface Labelled extends TokenEntry {
  readonly step: string;
}

/** Una muestra de color con su contraste medido contra la superficie detrás de ella. */
interface Swatch extends Labelled {
  readonly ratio: string;
  readonly passes: boolean;
}

/** Uno de los siete roles tipográficos, con los valores que resuelve el navegador. */
interface TypeRole {
  readonly token: string;
  readonly label: string;
  readonly size: string;
  readonly lineHeight: string;
  readonly sample: string;
}

/**
 * Orden de lectura para las escalas cuyos escalones se nombran en vez de
 * numerarse.
 *
 * `collectTokens` ordena numéricamente, que es correcto para `50…950` e
 * inútil para `sm, md, lg, xl, 2xl`: el orden alfabético convierte una
 * escala en un revoltijo («2xl, full, lg, md, sm, xl»). El orden es
 * editorial; los valores siguen viniendo del documento. Un token que falta
 * en una lista se agrega al final en vez de descartarse, así que agregar
 * uno igual lo saca a la luz.
 */
const RADIUS_ORDER = ['sm', 'md', 'lg', 'xl', '2xl', 'full'];
const SHADOW_ORDER = ['sm', 'md', 'lg', 'xl', '2xl', 'inner', 'soft', 'card', 'elevated'];
const DURATION_ORDER = ['instant', 'fast', 'normal', 'slow'];

const TYPE_ROLES: readonly { token: string; label: string; sample: string }[] = [
  { token: 'display', label: 'display', sample: 'Sistema de Diseño' },
  { token: 'title', label: 'title', sample: 'Cierre del ejercicio' },
  { token: 'heading', label: 'heading', sample: 'Clientes activos' },
  { token: 'subheading', label: 'subheading', sample: 'Facturación del trimestre' },
  { token: 'body', label: 'body', sample: 'El texto corriente de la interfaz.' },
  { token: 'caption', label: 'caption', sample: 'Apoyo y notas al pie.' },
  { token: 'overline', label: 'overline', sample: 'Rótulo de sección' },
];

/**
 * Fundamentos: de qué está hecho el sistema antes de que exista ningún
 * componente.
 *
 * Toda lista de esta página se **lee del documento**, nunca se escribe
 * aquí. Las rampas vienen de las hojas de estilos a través de
 * `collectTokens`, las cifras de contraste se calculan en el navegador, las
 * métricas tipográficas son lo que resolvió el navegador, y los iconos
 * vienen de `ICON_NAMES`. Un catálogo que repite sus propios tokens es una
 * segunda copia, y una segunda copia se desalinea.
 */
@Component({
  selector: 'app-foundations',
  imports: [CopyToken, Icon, ShowcaseBlock, ShowcasePage, VariantGrid, VariantRow],
  templateUrl: './foundations.html',
  styleUrl: './foundations.css',
})
export class Foundations {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(ThemeStore);

  protected readonly icons = ICON_NAMES;
  protected readonly tones = TONES;

  /** Repite la demo de movimiento. Una duración no se ve en un cuadro fijo. */
  protected readonly motionRun = signal(0);

  /**
   * Se incrementa una vez que termina el primer render, para releer los
   * tokens.
   *
   * Los valores vienen del documento, y en un servidor de desarrollo las
   * hojas de estilos se inyectan por script en vez de bloquear el
   * renderizado: una lectura durante la primera detección de cambios puede
   * caer antes de que existan. Sin esto, el resultado vacío se cachearía
   * para siempre y la página saldría en blanco en un entorno y bien en
   * otro.
   */
  private readonly afterRender = signal(0);

  constructor() {
    afterNextRender(() => this.afterRender.update((run) => run + 1));
  }

  /**
   * Todo lo de abajo depende de `resolvedTheme()` a propósito: los valores
   * vienen del DOM, así que nada más le avisaría a estos computeds que ya
   * quedaron obsoletos cuando cambia el tema. Es la misma dependencia que
   * declara `ChartTheme`.
   */
  private readonly tokens = computed(() => {
    this.theme.resolvedTheme();
    this.theme.lightPalette();
    this.theme.darkPalette();
    this.theme.surfaceStyle();
    this.theme.highContrast();
    this.afterRender();
    const read = (prefix: string) => collectTokens(this.document, prefix);
    return {
      primary: read('--color-primary-'),
      secondary: read('--color-secondary-'),
      accent: read('--color-accent-'),
      surfaces: read('--surface-'),
      inks: read('--ink-'),
      lines: read('--line-'),
      series: read('--chart-series-'),
      radii: read('--radius-'),
      shadows: read('--shadow-'),
      durations: read('--duration-'),
    };
  });

  protected readonly primaryRamp = computed(() => this.ramp(this.tokens().primary, 'primary'));
  protected readonly secondaryRamp = computed(() =>
    this.ramp(this.tokens().secondary, 'secondary'),
  );
  protected readonly accentRamp = computed(() => this.ramp(this.tokens().accent, 'accent'));
  protected readonly seriesRamp = computed(() =>
    this.tokens().series.map((entry) => strip(entry, '--chart-series-')),
  );

  protected readonly surfaces = computed(() => this.tokens().surfaces);
  protected readonly lines = computed(() => this.tokens().lines);
  protected readonly radii = computed(() =>
    inOrder(labelled(this.tokens().radii, '--radius-'), RADIUS_ORDER),
  );
  protected readonly shadows = computed(() =>
    inOrder(labelled(this.tokens().shadows, '--shadow-'), SHADOW_ORDER),
  );
  protected readonly durations = computed(() =>
    inOrder(labelled(this.tokens().durations, '--duration-'), DURATION_ORDER),
  );

  /** Los roles de tinta, cada uno medido contra la superficie de tarjeta sobre la que se sienta. */
  protected readonly inks = computed<Swatch[]>(() => {
    const surface = this.resolve('--surface-1');
    return this.tokens().inks.map((entry) => this.swatch(entry, '--ink-', surface));
  });

  protected readonly typeRoles = computed<TypeRole[]>(() => {
    this.theme.resolvedTheme();
    this.theme.uiScale();
    this.afterRender();
    return TYPE_ROLES.map((role) => ({
      token: `--text-${role.token}`,
      label: role.label,
      sample: role.sample,
      size: this.resolve(`--text-${role.token}`),
      lineHeight: this.resolve(`--text-${role.token}--line-height`) || 'normal',
    }));
  });

  protected replayMotion(): void {
    this.motionRun.update((run) => run + 1);
  }

  /** Una rampa muestra sus escalones; el contraste se juzga por rol, no por escalón. */
  private ramp(entries: readonly TokenEntry[], group: string): Swatch[] {
    const surface = this.resolve('--surface-1');
    return entries.map((entry) => this.swatch(entry, `--color-${group}-`, surface, `--${group}-`));
  }

  private swatch(entry: TokenEntry, prefix: string, surface: string, alt?: string): Swatch {
    const ratio = contrastRatio(entry.value, surface);
    return {
      ...strip(entry, prefix, alt),
      ratio: ratio === null ? '—' : formatRatio(ratio),
      passes: ratio !== null && ratio >= CONTRAST_AA,
    };
  }

  private resolve(token: string): string {
    const view = this.document.defaultView;
    if (!view) {
      return '';
    }
    return view.getComputedStyle(this.document.documentElement).getPropertyValue(token).trim();
  }
}

function labelled(entries: readonly TokenEntry[], prefix: string): Labelled[] {
  return entries.map((entry) => strip(entry, prefix));
}

/**
 * `--color-primary-600` → `600`, `--chart-series-3` → `3`.
 *
 * Una rampa se lee por su escalón, y repetir el grupo en cada chip
 * convierte una fila de once muestras en un muro de prefijos.
 */
function strip(entry: TokenEntry, prefix: string, alt?: string): Labelled {
  const step = entry.name.replace(prefix, '').replace(alt ?? prefix, '');
  return { ...entry, step };
}

/**
 * Ordena por un orden de lectura declarado, dejando al final lo que no está
 * en la lista.
 *
 * Descartar un escalón desconocido dejaría al catálogo silenciosamente
 * incompleto, que es exactamente la falla que generarlo desde las hojas de
 * estilos existe para evitar.
 */
function inOrder(entries: readonly Labelled[], order: readonly string[]): Labelled[] {
  const rank = (step: string) => {
    const index = order.indexOf(step);
    return index === -1 ? order.length : index;
  };
  return [...entries].sort((a, b) => rank(a.step) - rank(b.step) || a.step.localeCompare(b.step));
}
