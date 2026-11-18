import { Component, booleanAttribute, input, model, output } from '@angular/core';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { Icon } from '@shared/components/media/icon/icon';
import { Tone } from '@shared/models/tone.model';

/** Insignia de contexto mostrada al pie de una fila de mensaje. */
export interface MessageRowTag {
  readonly label: string;
  readonly tone: Tone;
}

/**
 * Fila compacta de bandeja de mensajes con acciones rápidas al pasar el cursor.
 *
 * El área principal usa un `<button type="button">` dedicado para conservar
 * accesibilidad por teclado, separado de la casilla de selección múltiple y de
 * la barra flotante de acciones rápidas (`unread`, `flagged`, `deleted`).
 */
@Component({
  selector: 'app-message-row',
  imports: [Avatar, Badge, Checkbox, Icon],
  templateUrl: './message-row.html',
  styleUrl: './message-row.css',
})
export class MessageRow {
  readonly sender = input.required<string>();
  readonly subject = input.required<string>();
  readonly snippet = input('');
  readonly timestamp = input('');

  readonly unread = input(false, { transform: booleanAttribute });
  readonly selected = input(false, { transform: booleanAttribute });
  readonly selectable = input(true, { transform: booleanAttribute });

  readonly flagged = model(false);
  readonly checked = model(false);

  readonly priorityLabel = input('');
  readonly priorityTone = input<Tone>('red');
  readonly tags = input<readonly MessageRowTag[]>([]);

  readonly activated = output<void>();
  readonly toggleRead = output<void>();
  readonly deleted = output<void>();

  protected toggleFlag(): void {
    this.flagged.update((value) => !value);
  }
}
