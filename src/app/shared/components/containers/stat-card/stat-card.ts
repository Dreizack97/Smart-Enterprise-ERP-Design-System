import { Component, computed, input, numberAttribute } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
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
  /** Nombre de la cifra. */
  readonly label = input.required<string>();

  /** La cifra en sí. Se acepta un número para que los conteos simples no necesiten formateo. */
  readonly value = input.required<string | number>();

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

  protected readonly clampedProgress = computed(() =>
    Math.min(100, Math.max(0, this.progress() ?? 0)),
  );
}
