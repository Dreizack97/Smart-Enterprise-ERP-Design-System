import { Component, booleanAttribute, input } from '@angular/core';

/**
 * Tamaño del título del encabezado.
 *
 * `lg` para tarjetas que comparten una cuadrícula, donde varios títulos de
 * 20px compiten entre sí; `xl` para las secciones principales de una página.
 */
export type SectionTitleSize = 'lg' | 'xl';

/**
 * Un panel con encabezado, para agrupar contenido.
 *
 * `flush` quita el padding del cuerpo, para contenido que debe llegar hasta
 * los bordes de la tarjeta — típicamente una tabla.
 */
@Component({
  selector: 'app-section-card',
  templateUrl: './section-card.html',
  styleUrl: './section-card.css',
})
export class SectionCard {
  readonly title = input.required<string>();

  /** Aclaración bajo el título. Vacío la omite. */
  readonly subtitle = input('');

  /** Quita el padding del cuerpo, para contenido de borde a borde como una tabla. */
  readonly flush = input(false, { transform: booleanAttribute });

  readonly titleSize = input<SectionTitleSize>('xl');
}
