import { Component, input } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * El vacío, explicado, cuando una lista no tiene nada que mostrar.
 *
 * Una tabla vacía sin texto deja a quien la lee sin poder distinguir si no
 * hay datos, si el filtro es demasiado estrecho, o si algo falló. El título
 * dice cuál de las tres es y el slot `actions` ofrece la salida.
 */
@Component({
  selector: 'app-empty-state',
  imports: [Icon],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyState {
  readonly icon = input<IconName>('search');

  /** Por qué no hay nada que mostrar. */
  readonly title = input.required<string>();

  /** Qué hacer a continuación. Vacío lo omite. */
  readonly description = input('');
}
