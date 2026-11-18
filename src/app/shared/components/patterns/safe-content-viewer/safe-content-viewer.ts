import { Component, booleanAttribute, input, output } from '@angular/core';
import { Button } from '@shared/components/actions/button/button';
import { Badge } from '@shared/components/feedback/badge/badge';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { Tone } from '@shared/models/tone.model';

/**
 * Visor estructurado para mensajes o comunicados con banner de seguridad.
 *
 * Aísla el cuerpo del contenido y ofrece un aviso claro cuando se bloquean
 * imágenes remotas de rastreo (`externalBlocked`), además de ranuras
 * proyectadas para hilos anteriores (`[thread]`), adjuntos (`[attachments]`)
 * y firma o acciones de cierre (`[footer]`).
 */
@Component({
  selector: 'app-safe-content-viewer',
  imports: [Avatar, Badge, Button],
  templateUrl: './safe-content-viewer.html',
  styleUrl: './safe-content-viewer.css',
})
export class SafeContentViewer {
  readonly subject = input.required<string>();
  readonly senderName = input.required<string>();
  readonly senderAddress = input('');
  readonly recipientSummary = input('');
  readonly timestamp = input('');

  readonly badgeLabel = input('');
  readonly badgeTone = input<Tone>('red');

  readonly externalBlocked = input(false, { transform: booleanAttribute });
  readonly externalBannerText = input(
    'Se bloquearon imágenes externas remotas para proteger tu privacidad (anti-tracking).',
  );

  readonly unblockExternal = output<void>();
}
