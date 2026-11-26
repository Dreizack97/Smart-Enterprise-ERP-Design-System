import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { Icon } from '@shared/components/media/icon/icon';

/** Estilo de presentación del paginador. */
export type PaginationVariant = 'pages' | 'compact';

/** Tamaño de los controles de paso y páginas. */
export type PaginationSize = 'sm' | 'md';

/** Un hueco de puntos suspensivos entre bloques de páginas no contiguos. */
const PAGE_GAP = 'gap' as const;

type PageSlot = number | typeof PAGE_GAP;

/**
 * Paginación.
 *
 * Muestra una ventana de páginas alrededor de la actual, más la primera y la
 * última, con puntos suspensivos entre bloques, o bien un modo compacto
 * (`< 1 / 4 >`) ideal para modales y tarjetas.
 */
@Component({
  selector: 'app-pagination',
  imports: [Icon],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  /** Página actual, indexada desde 1. */
  readonly page = model(1);

  /** Total de páginas. */
  readonly pageCount = input(1, { transform: numberAttribute });

  /** Texto informativo, p. ej. "Mostrando 1-10 de 87 clientes". */
  readonly summary = input('');

  /** Estilo de paginador: 'pages' (numérico con ventanas) o 'compact' (< 1 / 4 >). */
  readonly variant = input<PaginationVariant>('pages');

  /** Tamaño de los controles: 'md' (estándar de tabla) o 'sm' (compacto para tarjetas/modales). */
  readonly size = input<PaginationSize>('md');

  /** Quita el borde superior y el relleno (ideal dentro de modales o pies de tarjeta). */
  readonly flush = input(false, { transform: booleanAttribute });

  /**
   * Si hay algo a lo que navegar.
   *
   * Con una sola página, el control dibujaba un «1» solitario entre dos
   * flechas que jamás se podían presionar — tres controles diciendo lo
   * mismo, nada. El resumen se queda, porque «3 de 3 clientes» sigue siendo
   * la respuesta a la pregunta que quien lee tiene; la navegación se va.
   */
  protected readonly navigable = computed(() => this.pageCount() > 1);

  protected readonly isFirst = computed(() => this.page() <= 1);
  protected readonly isLast = computed(() => this.page() >= this.pageCount());

  protected readonly slots = computed<PageSlot[]>(() => {
    const total = Math.max(1, this.pageCount());
    const current = this.clamp(this.page());

    // Con pocas páginas la ventana no agrega nada y los puntos suspensivos solo estorban.
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const slots: PageSlot[] = [1];
    const from = Math.max(2, current - 1);
    const to = Math.min(total - 1, current + 1);

    if (from > 2) {
      slots.push(PAGE_GAP);
    }
    for (let page = from; page <= to; page += 1) {
      slots.push(page);
    }
    if (to < total - 1) {
      slots.push(PAGE_GAP);
    }
    slots.push(total);

    return slots;
  });

  protected readonly gap = PAGE_GAP;

  protected goTo(page: number): void {
    this.page.set(this.clamp(page));
  }

  protected previous(): void {
    this.goTo(this.page() - 1);
  }

  protected next(): void {
    this.goTo(this.page() + 1);
  }

  private clamp(page: number): number {
    return Math.min(Math.max(1, page), Math.max(1, this.pageCount()));
  }
}
