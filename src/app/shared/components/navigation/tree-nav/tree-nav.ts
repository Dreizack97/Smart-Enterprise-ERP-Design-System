import { Component, input, model } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Icon } from '@shared/components/media/icon/icon';
import { Tone } from '@shared/models/tone.model';

/** Un elemento seleccionable dentro de un grupo del árbol de navegación. */
export interface TreeNavItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly badge?: string | number;
  readonly badgeTone?: Tone;
}

/** Una sección titulada que agrupa elementos relacionados del árbol. */
export interface TreeNavGroup {
  readonly label?: string;
  readonly items: readonly TreeNavItem[];
}

/**
 * Árbol jerárquico plano por secciones para carpetas o categorías de ajuste.
 *
 * Emite el identificador elegido mediante `selected` como `model()` para
 * mantener una única fuente de verdad en el contenedor padre.
 */
@Component({
  selector: 'app-tree-nav',
  imports: [Badge, Icon],
  templateUrl: './tree-nav.html',
  styleUrl: './tree-nav.css',
})
export class TreeNav {
  readonly groups = input.required<readonly TreeNavGroup[]>();
  readonly selected = model('');
  readonly ariaLabel = input('Árbol de navegación');

  protected choose(id: string): void {
    this.selected.set(id);
  }
}
