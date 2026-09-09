import { Component, booleanAttribute, input, output } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Button } from '@shared/components/actions/button/button';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * El vacío, explicado, con una forma de reintentar cuando una carga falla.
 *
 * Complementa a `EmptyState` (sin datos) y `Skeleton` (todavía cargando):
 * este es el tercer estado, el fallo, que de otro modo solo sobrevive como
 * un toast efímero sin salida. `retry` vuelve a emitir la solicitud sin
 * recargar.
 */
@Component({
  selector: 'app-error-state',
  imports: [Button, Icon],
  templateUrl: './error-state.html',
  styleUrl: './error-state.css',
})
export class ErrorState {
  readonly icon = input<IconName>('triangle-alert');

  /** Qué falló. */
  readonly title = input('No se pudieron cargar los datos');

  /** Detalle o siguiente paso. Vacío lo omite. */
  readonly description = input('');

  readonly retryLabel = input('Reintentar');

  /** El reintento está en curso: el botón muestra su spinner. */
  readonly retrying = input(false, { transform: booleanAttribute });

  /** Oculta el botón de reintentar cuando el fallo no es recuperable. */
  readonly retryable = input(true, { transform: booleanAttribute });

  readonly retry = output<void>();

  protected onRetry(): void {
    if (!this.retrying()) {
      this.retry.emit();
    }
  }
}
