import { Component, inject, signal } from '@angular/core';
import { BUTTON_VARIANTS, Button } from '@shared/components/actions/button/button';
import {
  SegmentOption,
  SegmentedControl,
} from '@shared/components/actions/segmented-control/segmented-control';
import { SocialButton } from '@shared/components/actions/social-button/social-button';
import { ThemeToggle } from '@shared/components/actions/theme-toggle/theme-toggle';
import { CONTROL_SIZES } from '@shared/models/size.model';
import { Notifications } from '@core/services/notification';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/**
 * Una marca neutral para los botones sociales.
 *
 * Dibujada aquí en vez de entregarse como activo de marca: un sistema de
 * diseño no debería cargar el logo de alguien más para demostrar la forma
 * de un botón, y una demo que toma prestada la marca de un proveedor real
 * se lee como una integración que existe.
 */
function providerMark(hue: string, glyph: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">` +
    `<rect width="24" height="24" rx="6" fill="${hue}"/>` +
    `<text x="12" y="17" font-family="system-ui,sans-serif" font-size="13" font-weight="700" ` +
    `text-anchor="middle" fill="#ffffff">${glyph}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Página de catálogo de la familia `actions/`. */
@Component({
  selector: 'app-actions',
  imports: [
    Button,
    SegmentedControl,
    ShowcaseBlock,
    ShowcasePage,
    SocialButton,
    ThemeToggle,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './actions.html',
  styleUrl: './actions.css',
})
export class Actions {
  private readonly notifications = inject(Notifications);

  protected readonly variants = BUTTON_VARIANTS;
  protected readonly sizes = CONTROL_SIZES;

  protected readonly providers = [
    {
      name: 'directorio',
      label: 'Continuar con el directorio corporativo',
      icon: providerMark('#2563eb', 'D'),
    },
    {
      name: 'certificado',
      label: 'Continuar con certificado digital',
      icon: providerMark('#0d9488', 'C'),
    },
  ];

  protected readonly view = signal('table');
  protected readonly density = signal('comfortable');
  protected readonly busy = signal(false);

  protected readonly viewOptions: readonly SegmentOption[] = [
    { value: 'table', label: 'Tabla', icon: 'list' },
    { value: 'grid', label: 'Cuadrícula', icon: 'layout-grid' },
    { value: 'chart', label: 'Gráfico', icon: 'chart-column' },
  ];

  protected readonly densityOptions: readonly SegmentOption[] = [
    { value: 'compact', label: 'Compacta' },
    { value: 'comfortable', label: 'Cómoda' },
    { value: 'wide', label: 'Amplia', disabled: true },
  ];

  /** Muestra cómo se ve `loading` sin fingir que algo ocurrió. */
  protected simulate(): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.notifications.success('Listo. Nada se guardó: esto es una vitrina.');
    }, 1600);
  }
}
