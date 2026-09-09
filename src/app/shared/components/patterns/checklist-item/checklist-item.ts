import { Component, input, model } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Icon } from '@shared/components/media/icon/icon';

/** Un dato de contexto bajo el título: un icono y un valor ya formateado. */
export interface ChecklistMeta {
  readonly icon: IconName;
  readonly text: string;
}

/**
 * Una fila marcable con un título, una insignia y una línea de contexto.
 *
 * Generalizado a partir del `task-card` original, que cargaba un vocabulario
 * de prioridad de ERP en español — `'alta' | 'media' | 'baja'` mapeado a
 * etiquetas y matices dentro del componente — más dos slots fijos llamados
 * `due` y `assignee`. Nada de eso es una decisión de diseño: una fila de
 * lista de tareas es un checkbox, un título, una insignia opcional y
 * cuantos datos de contexto tenga la pantalla.
 *
 * `meta` reemplaza al par fijo, para que una fila pueda mostrar una fecha,
 * un responsable, el tamaño de un archivo, o nada en absoluto.
 */
@Component({
  selector: 'app-checklist-item',
  imports: [Badge, Checkbox, Icon],
  templateUrl: './checklist-item.html',
  styleUrl: './checklist-item.css',
})
export class ChecklistItem {
  readonly title = input.required<string>();

  /** Detalle bajo el título. Vacío lo omite. */
  readonly description = input('');

  /** Insignia junto al título. Vacío la omite. */
  readonly badgeLabel = input('');

  readonly badgeTone = input<Tone>('neutral');

  /** Entradas de contexto bajo la descripción, en el orden dado. */
  readonly meta = input<readonly ChecklistMeta[]>([]);

  /**
   * Si la fila está marcada.
   *
   * Un `model()`: el checkbox de la fila la alterna, y el contenedor se
   * entera a través del binding bidireccional.
   */
  readonly done = model(false);
}
