import { Component, booleanAttribute, input } from '@angular/core';
import { AccordionContent, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * Una sección colapsable dentro de `app-accordion`.
 *
 * El contenido vive en un `ng-template` con `ngAccordionContent`, así que no
 * se crea hasta que alguien abre la sección: un acordeón de diez secciones no
 * debe construir diez árboles de componentes para mostrar uno.
 */
@Component({
  selector: 'app-accordion-item',
  imports: [AccordionPanel, AccordionTrigger, AccordionContent, Icon],
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.css',
})
export class AccordionItem {
  /** Título del encabezado presionable. */
  readonly label = input.required<string>();

  /** Icono opcional antes del título. */
  readonly icon = input<IconName | null>(null);

  readonly disabled = input(false, { transform: booleanAttribute });
}
