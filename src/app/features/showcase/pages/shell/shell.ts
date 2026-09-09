import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStore } from '@core/layout/layout-store';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { Button } from '@shared/components/actions/button/button';
import { NavSection } from '@layout/components/sidebar/navigation.model';
import { PageHeader } from '@layout/components/page-header/page-header';
import { Sidebar } from '@layout/components/sidebar/sidebar';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/**
 * Página de catálogo de `layout/` — el armazón de la aplicación.
 *
 * El armazón es la única familia que el catálogo no puede meter en una
 * caja: `navbar` y `sidebar` son `position: fixed` y son dueños de todo el
 * viewport, y una copia metida en una tarjeta sería una copia, no el
 * componente. Así que la página hace dos cosas en su lugar.
 *
 * **Apunta a lo real**: la barra y el panel alrededor de esta página son
 * los componentes, y el bloque explica qué mirar y qué control presionar. Y
 * pone en pantalla las piezas que SÍ caben — el encabezado de página, y un
 * sidebar renderizado dentro de un marco con su propio estado, que solo es
 * posible porque en su momento `open` y `rail` se convirtieron en inputs en
 * vez de leerse del store.
 */
@Component({
  selector: 'app-shell',
  imports: [
    Breadcrumb,
    Button,
    PageHeader,
    RouterLink,
    ShowcaseBlock,
    ShowcasePage,
    Sidebar,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  protected readonly layout = inject(LayoutStore);

  /** El estado propio del sidebar de demostración, independiente del de la aplicación. */
  protected readonly demoRail = signal(false);

  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Catálogo', route: '/fundamentos' },
    { label: 'Shell' },
  ];

  /** Un árbol pequeño, para que el marco no necesite scroll para ser legible. */
  protected readonly sections: readonly NavSection[] = [
    {
      items: [{ id: 'demo-home', label: 'Inicio', icon: 'house', route: '/inicio' }],
    },
    {
      title: 'Operación',
      items: [
        { id: 'demo-orders', label: 'Pedidos', icon: 'shopping-cart' },
        {
          id: 'demo-stock',
          label: 'Inventario',
          icon: 'package',
          children: [
            { id: 'demo-stock-in', label: 'Entradas' },
            { id: 'demo-stock-out', label: 'Salidas' },
          ],
        },
        { id: 'demo-clients', label: 'Clientes', icon: 'users' },
      ],
    },
  ];

  protected toggleDemoRail(): void {
    this.demoRail.update((rail) => !rail);
  }
}
