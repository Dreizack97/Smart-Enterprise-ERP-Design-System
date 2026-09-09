import { Component, computed, input, numberAttribute } from '@angular/core';

/** `text` para líneas de párrafo, `block` para tarjetas, `circle` para avatares. */
export type SkeletonShape = 'text' | 'block' | 'circle';

/**
 * Marcador de posición de carga.
 *
 * Reserva el espacio que el contenido ocupará para que la página no salte
 * cuando llegue. Se anuncia como una región ocupada (`aria-busy`) en vez de
 * leerse en voz alta: sus barras no significan nada para quien no puede
 * verlas.
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.css',
})
export class Skeleton {
  /** La silueta que representa al contenido que se está cargando. */
  readonly shape = input<SkeletonShape>('text');

  /** Cuántas barras dibujar. Solo tiene sentido con `shape="text"`. */
  readonly lines = input(1, { transform: numberAttribute });

  /** Altura en píxeles. Por defecto la forma decide. */
  readonly height = input(0, { transform: numberAttribute });

  protected readonly rows = computed(() => Array.from({ length: Math.max(1, this.lines()) }));

  /** Una altura explícita gana; si no, aplica el token propio de la forma. */
  protected readonly customHeight = computed(() => {
    const explicit = this.height();
    return explicit > 0 ? `${explicit}px` : null;
  });

  /**
   * La última línea de un párrafo se corta más corta que el resto. Sin ese
   * detalle, el bloque se lee como una tabla en vez de como texto.
   */
  protected isLastOfMany(index: number): boolean {
    return this.shape() === 'text' && this.rows().length > 1 && index === this.rows().length - 1;
  }
}
