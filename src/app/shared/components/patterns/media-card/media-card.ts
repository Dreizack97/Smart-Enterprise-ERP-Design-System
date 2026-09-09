import { Component, computed, input } from '@angular/core';
import { Tone } from '@shared/models/tone.model';

/**
 * Una tarjeta liderada por una imagen, con una cifra y un medidor opcional.
 *
 * Generalizada a partir del `product-card` original, que traía a fuego un
 * vocabulario de inventario de ERP: tres estados llamados "En Stock",
 * "Stock Bajo" y "Agotado" vivían dentro del componente, así que lo único
 * que podía describir era inventario. La forma nunca fue sobre inventario —
 * imagen, overline, título, una cifra principal, una cifra secundaria y un
 * nivel — y esa forma le queda bien a un producto, a un archivo con su
 * cuota, o a una campaña con su presupuesto.
 *
 * Las cifras llegan ya formateadas. El formato de moneda y de número son
 * decisiones del dominio, no del sistema de diseño; cablearlas aquí
 * significaría editar el sistema de diseño para abrir operaciones en otro
 * país.
 */
@Component({
  selector: 'app-media-card',
  templateUrl: './media-card.html',
  styleUrl: './media-card.css',
})
export class MediaCard {
  /** Título del elemento. */
  readonly title = input.required<string>();

  /** Imagen: una URL o una URI `data:` en base64. */
  readonly image = input.required<string>();

  /** Etiqueta pequeña sobre el título — una categoría, una carpeta, un canal. */
  readonly overline = input('');

  /** Descripción corta bajo el título. Vacío la omite. */
  readonly description = input('');

  /** Cifra principal, ya formateada. Vacío la omite. */
  readonly figure = input('');

  /** Cifra secundaria junto a la principal. Vacío la omite. */
  readonly secondaryFigure = input('');

  /** Insignia sobre la imagen. Vacío la omite. */
  readonly badgeLabel = input('');

  /** Matiz de la insignia y del relleno del medidor. */
  readonly tone = input<Tone>('neutral');

  /** Porcentaje del medidor bajo las cifras. `null` omite el medidor. */
  readonly meter = input<number | null>(null);

  /** Nombre accesible del medidor. Obligatorio cuando se muestra un medidor. */
  readonly meterLabel = input('');

  protected readonly hasMeter = computed(() => this.meter() !== null);

  protected readonly clampedMeter = computed(() => Math.min(100, Math.max(0, this.meter() ?? 0)));

  /** Recae en el título para que el medidor nunca se quede sin nombre. */
  protected readonly resolvedMeterLabel = computed(() => this.meterLabel() || this.title());
}
