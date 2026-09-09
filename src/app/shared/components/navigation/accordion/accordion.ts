import { Component } from '@angular/core';
import { AccordionGroup } from '@angular/aria/accordion';

/**
 * Un grupo de secciones colapsables.
 *
 * Contiene `app-accordion-item`. La accesibilidad viene de
 * `ngAccordionGroup`: desplazamiento con flechas entre encabezados, Home/End,
 * y `aria-expanded` / `aria-controls` siempre sincronizados con lo que hay
 * en pantalla.
 *
 * El grupo es una `hostDirective` y no algo en la plantilla porque
 * `ng-content` no cambia el inyector: las secciones se declaran en la
 * plantilla del consumidor, así que solo pueden alcanzar lo que
 * `<app-accordion>` provee. Sus inputs (`multiExpandable`, `disabled`) se
 * reexponen tal cual.
 *
 * No es para navegación primaria: plegar destinos oculta la estructura del
 * sitio. Esto es para revelación progresiva — preguntas frecuentes, opciones
 * avanzadas de un formulario.
 */
@Component({
  selector: 'app-accordion',
  hostDirectives: [{ directive: AccordionGroup, inputs: ['multiExpandable', 'disabled'] }],
  template: '<ng-content />',
  styleUrl: './accordion.css',
})
export class Accordion {}
