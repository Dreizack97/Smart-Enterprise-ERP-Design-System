import {
  Component,
  DOCUMENT,
  LOCALE_ID,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { MotionPreference } from '@core/theme/motion-preference';
import { Tone } from '@shared/models/tone.model';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Cómo se presenta la cifra.
 *
 * - `metric`  el indicador de panel: etiqueta, cifra, cambio, y un mini
 *             gráfico o una barra de progreso debajo.
 * - `tile`    el conteo compacto sobre un listado: etiqueta overline y
 *             cifra, nada más.
 * - `report`  una fila horizontal con la cifra de un lado y una insignia de
 *             icono con tono del otro.
 */
export type StatVariant = 'metric' | 'tile' | 'report';

/** Dirección de la nota junto a o bajo la cifra. */
export type StatTrend = 'up' | 'down' | 'flat';

const COUNT_DURATION_MS = 750;
const STAGGER_DELAY_MS = 50;
const PROGRESS_DELAY_MS = 60;

/** Conserva la precisión de la cifra, incluida la notación exponencial. */
function fractionDigits(value: number): number {
  const [coefficient, exponent = '0'] = String(value).split('e');
  return Math.min(20, Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent)));
}

/**
 * Una cifra con su etiqueta.
 *
 * Un solo componente donde el original tenía tres — `stat-card`,
 * `summary-tile` y `report-card` — porque eran la misma anatomía tres veces:
 * una etiqueta overline, una cifra grande monoespaciada y una nota opcional.
 * Diferían en la disposición, que es para lo que sirve `variant`, y cada uno
 * cargaba su propia idea de lo que la nota significaba: `delta` con una
 * tendencia, `note` con un tono, `caption` con una tendencia. Aquí eso es un
 * solo par, `note` y `noteTrend`.
 *
 * La cifra es monoespaciada. Ese contraste tipográfico entre prosa y números
 * es una firma del sistema y aplica a todo valor numérico.
 */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCard {
  private readonly view = inject(DOCUMENT).defaultView;
  private readonly motion = inject(MotionPreference);
  private readonly locale = inject(LOCALE_ID);
  private currentNumericValue = 0;

  /** Nombre de la cifra. */
  readonly label = input.required<string>();

  /** Anima valores numéricos y conserva literalmente los textos y marcadores de carga. */
  readonly value = input.required<string | number>();

  /** Configura el formato de cifras sin intentar extraer números de textos o fechas. */
  readonly numberFormat = input<Intl.NumberFormatOptions | undefined>();

  readonly variant = input<StatVariant>('metric');

  /** Icono mostrado junto a la cifra. `null` lo omite. `tile` nunca muestra uno. */
  readonly icon = input<IconName | null>(null);

  /**
   * El matiz de lo que sea que la variante enfatice: el icono en `metric` y
   * `report`, la propia cifra en `tile`. `neutral` la deja apagada.
   */
  readonly tone = input<Tone>('neutral');

  /** Nota bajo o junto a la cifra: "+12%", "vs. mes anterior". */
  readonly note = input('');

  /** Dirección de la nota, que decide su matiz y si lleva una flecha. */
  readonly noteTrend = input<StatTrend>('flat');

  /**
   * Porcentaje de una barra de progreso, como alternativa al mini gráfico.
   *
   * Con un valor la tarjeta dibuja la barra e ignora el gráfico proyectado;
   * el original usaba uno u otro, nunca ambos. Se dibuja en **toda**
   * variante: antes vivía dentro de la rama `metric`, así que una tarjeta
   * `report` que pedía una barra no obtenía nada y ninguna advertencia.
   */
  readonly progress = input<number | null>(null);

  /** Posición en la cuadrícula. Escalona la animación de entrada. */
  readonly index = input(0, { transform: numberAttribute });

  /** Permite activar o desactivar la animación del valor (activo por defecto). */
  readonly animatedValue = input(true, { transform: booleanAttribute });

  /** Valor a mostrar en la tarjeta. */
  readonly displayValue = signal('');

  /** Indica si el conteo está en curso para aplicar énfasis visual sutil. */
  protected readonly isCounting = signal(false);

  /** Porcentaje animado de la barra de progreso para que crezca desde 0 al cargar. */
  protected readonly animatedProgress = signal(0);

  private readonly formatter = computed(() => {
    const value = this.value();
    return new Intl.NumberFormat(
      this.locale,
      this.numberFormat() ?? {
        maximumFractionDigits:
          typeof value === 'number' && Number.isFinite(value) ? fractionDigits(value) : 0,
      },
    );
  });

  /** Mantiene estable la cifra accesible durante todos los fotogramas decorativos. */
  protected readonly finalValue = computed(() => {
    const value = this.value();
    return typeof value === 'number'
      ? Number.isFinite(value)
        ? this.formatter().format(value)
        : '—'
      : value;
  });

  private readonly staggerDelay = computed(() =>
    Number.isFinite(this.index()) ? Math.max(0, this.index()) * STAGGER_DELAY_MS : 0,
  );

  /** `flat` no lleva flecha: es una nota al pie, no un movimiento. */
  protected readonly noteIcon = computed<IconName | null>(() => {
    const trend = this.noteTrend();
    if (trend === 'up') {
      return 'arrow-up';
    }
    return trend === 'down' ? 'arrow-down' : null;
  });

  /** Una cifra que sube es verde, una que baja es roja, una nota plana es sencilla. */
  protected readonly noteTone = computed<Tone>(() => {
    const trend = this.noteTrend();
    if (trend === 'up') {
      return 'green';
    }
    return trend === 'down' ? 'red' : 'neutral';
  });

  protected readonly hasProgress = computed(() => this.progress() !== null);

  protected readonly clampedProgress = computed(() => {
    const progress = this.progress() ?? 0;
    return Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  });

  constructor() {
    effect((onCleanup) => {
      const targetProgress = this.clampedProgress();
      if (!this.hasProgress()) {
        this.animatedProgress.set(0);
        return;
      }
      if (this.motion.reduced() || !this.view?.requestAnimationFrame) {
        this.animatedProgress.set(targetProgress);
        return;
      }
      this.animatedProgress.set(0);
      const timer = this.view.setTimeout(() => {
        this.animatedProgress.set(targetProgress);
      }, this.staggerDelay() + PROGRESS_DELAY_MS);
      onCleanup(() => this.view?.clearTimeout(timer));
    });

    effect((onCleanup) => {
      const raw = this.value();
      const formatter = this.formatter();
      const finalValue = this.finalValue();
      const shouldAnimate = this.animatedValue() && !this.motion.reduced();
      const delayMs = this.staggerDelay();
      const view = this.view;
      this.isCounting.set(false);

      if (
        typeof raw !== 'number' ||
        !Number.isFinite(raw) ||
        !shouldAnimate ||
        !view?.requestAnimationFrame
      ) {
        this.currentNumericValue = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
        this.isCounting.set(false);
        this.displayValue.set(finalValue);
        return;
      }

      const startValue = this.currentNumericValue;

      if (startValue === raw) {
        this.isCounting.set(false);
        this.displayValue.set(finalValue);
        return;
      }

      this.displayValue.set(formatter.format(startValue));
      let rafId: number | null = null;
      let timer: number | null = null;
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
        if (timer !== null) view.clearTimeout(timer);
        if (rafId !== null) view.cancelAnimationFrame(rafId);
      });

      const startCount = (): void => {
        if (cancelled) return;
        this.isCounting.set(true);
        const startTime = view.performance.now();

        const step = (now: number): void => {
          if (cancelled) return;
          const elapsed = Math.max(0, now - startTime);
          const progress = Math.min(1, elapsed / COUNT_DURATION_MS);
          const eased = 1 - Math.pow(1 - progress, 2.2);
          this.currentNumericValue = startValue + (raw - startValue) * eased;

          if (progress < 1) {
            this.displayValue.set(formatter.format(this.currentNumericValue));
            rafId = view.requestAnimationFrame(step);
          } else {
            this.currentNumericValue = raw;
            this.displayValue.set(finalValue);
            this.isCounting.set(false);
            rafId = null;
          }
        };

        rafId = view.requestAnimationFrame(step);
      };

      if (delayMs > 0) {
        timer = view.setTimeout(() => {
          timer = null;
          startCount();
        }, delayMs);
      } else {
        startCount();
      }
    });
  }
}
