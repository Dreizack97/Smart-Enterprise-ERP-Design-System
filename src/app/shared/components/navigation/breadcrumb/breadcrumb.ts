import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { Icon } from '@shared/components/media/icon/icon';
import { IconName } from '@core/icons/lucide-icons';
import { placeAnchored, watchAnchor } from '@shared/utils/anchored-position';

/** Opción navegable dentro del menú desplegable de una miga. */
export interface BreadcrumbOption {
  readonly label: string;
  readonly route?: string;
  readonly queryParams?: Params;
  readonly icon?: IconName;
}

/** Nivel dentro de la ruta de navegación, con enlace y submenú opcionales. */
export interface BreadcrumbItem {
  readonly label: string;
  readonly route?: string;
  readonly children?: readonly BreadcrumbOption[];
}

/** Demora breve antes de cerrar al salir con el puntero para permitir cruzar al menú. */
const CLOSE_DELAY_MS = 400;

/** Migas de navegación cuyos menús se montan solo al abrirse y se ajustan al viewport. */
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink, Icon],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
  host: { '(keydown.escape)': 'closeMenu()' },
})
export class Breadcrumb {
  /** Niveles ordenados que conforman la ruta actual de navegación. */
  readonly items = input.required<readonly BreadcrumbItem[]>();
  /** Nombre accesible de la región de navegación. */
  readonly label = input('Ruta de navegación');

  protected readonly activeIndex = signal<number | null>(null);
  private readonly nodes = viewChildren<ElementRef<HTMLElement>>('node');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterRenderEffect((onCleanup) => {
      const panel = this.menu()?.nativeElement;
      const index = this.activeIndex();
      const anchor = index === null ? undefined : this.nodes()[index]?.nativeElement;
      const view = panel?.ownerDocument.defaultView;
      if (!panel || !anchor || !view) return;

      const reposition = () =>
        placeAnchored(panel, anchor, view, {
          placement: 'bottom-start',
          gap: 4,
          clampHeight: true,
        });
      reposition();
      onCleanup(watchAnchor(view, reposition));
    });
    inject(DestroyRef).onDestroy(() => this.cancelClose());
  }

  protected onNodeEnter(index: number): void {
    this.cancelClose();
    this.activeIndex.set(index);
  }

  protected onNodeLeave(): void {
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.activeIndex.set(null);
    }, CLOSE_DELAY_MS);
  }

  protected onNodeFocusOut(event: FocusEvent, index: number): void {
    const next = event.relatedTarget as Node | null;
    if (next && this.nodes()[index]?.nativeElement.contains(next)) return;
    if (this.activeIndex() === index) this.closeMenu();
  }

  protected onMenuEnter(): void {
    this.cancelClose();
  }

  protected closeMenu(): void {
    this.cancelClose();
    this.activeIndex.set(null);
  }

  private cancelClose(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
