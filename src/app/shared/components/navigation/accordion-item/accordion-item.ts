import { Component, ElementRef, booleanAttribute, input, model, viewChild } from '@angular/core';
import { AccordionContent, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';

/** Teclas reservadas por el grupo ARIA para sus encabezados. */
const HEADER_KEYS = new Set([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/**
 * Una sección colapsable dentro de `app-accordion`.
 *
 * El panel inserta el contenido de `ngAccordionContent` al abrirse.
 * `preserveContent` conserva después los nodos de los controles y su captura
 * local al plegar formularios.
 */
@Component({
  selector: 'app-accordion-item',
  imports: [AccordionPanel, AccordionTrigger, AccordionContent, Icon],
  host: { '(keydown)': 'onPanelKeydown($event)' },
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.css',
})
export class AccordionItem {
  private readonly contentPanel = viewChild.required<AccordionPanel, ElementRef<HTMLElement>>(
    'panel',
    { read: ElementRef },
  );

  /** Título del encabezado presionable. */
  readonly label = input.required<string>();

  /** Icono opcional antes del título. */
  readonly icon = input<IconName | null>(null);

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Permite abrir secciones desde una validación y observar los cambios del usuario.
   * En apertura única, el consumidor debe coordinar los valores externos para mantener una sola sección abierta.
   */
  readonly expanded = model(false);

  /** Conserva el contenido ya mostrado al cerrar la sección; se activa expresamente en formularios. */
  readonly preserveContent = input(false, { transform: booleanAttribute });

  /** Resume el contenido de la sección bajo el título del encabezado. */
  readonly summary = input('');

  /** Indica que la sección contiene cambios pendientes de guardar. */
  readonly modified = input(false, { transform: booleanAttribute });

  /**
   * Mantiene las teclas de edición dentro del contenido: el grupo ARIA también
   * escucha sus eventos y, si los recibe, cancela Espacio y navega o pliega secciones.
   * Conserva la acción nativa y la propagación de Tab, Escape y los atajos modificados.
   */
  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target as Node | null;
    if (!target || !this.contentPanel().nativeElement.contains(target)) return;
    if (HEADER_KEYS.has(event.key)) event.stopPropagation();
  }
}
