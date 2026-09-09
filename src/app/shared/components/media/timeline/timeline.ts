import { Component, input } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';
import { ActivityItem } from '@shared/components/media/activity-item/activity-item';

/** Un momento en la línea de tiempo. La misma forma que `activity-item` ya lee. */
export interface TimelineEntry {
  readonly icon: IconName;
  readonly title: string;
  readonly description?: string;
  readonly time?: string;
  readonly tone?: Tone;
}

/**
 * Una serie de eventos con una línea que los conecta.
 *
 * La unidad visual es `activity-item`, sin cambios — esto agrega lo único
 * que un feed no tiene, que es la afirmación de que estas entradas son
 * **una sola secuencia** y no una lista de filas sin relación.
 *
 * ## Por qué las entradas son un input y no contenido proyectado
 *
 * El riel tiene que empezar bajo una insignia y detenerse en la siguiente, lo
 * que significa que el componente debe saber dónde está cada insignia y cuál
 * entrada es la última. El encapsulamiento de estilos deja a los hijos
 * proyectados fuera del alcance de esta hoja de estilos — cargan el
 * atributo del consumidor, no el nuestro — así que una versión proyectada
 * habría tenido que dibujar una línea continua detrás de todo y esperar que
 * las insignias la taparan. No lo hacen: `.tone-soft` es translúcido en el
 * tema oscuro, y la línea se veía directamente a través de cada icono.
 *
 * Renderizar los elementos aquí convierte al riel en un hermano de cada
 * insignia en vez de en una capa detrás de ellas: ocupa exactamente el hueco
 * entre dos de ellas y no toca ninguna.
 */
@Component({
  selector: 'app-timeline',
  imports: [ActivityItem],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
  host: { role: 'list', '[attr.aria-label]': 'label() || null' },
})
export class Timeline {
  readonly entries = input.required<readonly TimelineEntry[]>();

  /** Nombra la secuencia, p. ej. «Historial del pedido». */
  readonly label = input('');
}
