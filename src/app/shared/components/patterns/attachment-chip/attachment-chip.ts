import { Component, booleanAttribute, input, output } from '@angular/core';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Icon } from '@shared/components/media/icon/icon';
import { Tone } from '@shared/models/tone.model';

/**
 * Tarjeta compacta para mostrar o quitar un archivo adjunto.
 *
 * Combina el tipo de archivo (`kind`), el nombre, el tamaño formateado y un
 * botón opcional de eliminación para el redactor.
 */
@Component({
  selector: 'app-attachment-chip',
  imports: [Badge, Icon],
  templateUrl: './attachment-chip.html',
  styleUrl: './attachment-chip.css',
})
export class AttachmentChip {
  readonly name = input.required<string>();
  readonly size = input('');
  readonly kind = input('Archivo');
  readonly tone = input<Tone>('blue');
  readonly removable = input(false, { transform: booleanAttribute });

  readonly pressed = output<void>();
  readonly removed = output<void>();
}
