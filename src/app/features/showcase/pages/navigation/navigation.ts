import { Component, computed, signal } from '@angular/core';
import { Accordion } from '@shared/components/navigation/accordion/accordion';
import { AccordionItem } from '@shared/components/navigation/accordion-item/accordion-item';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { Pagination } from '@shared/components/navigation/pagination/pagination';
import { StepItem, Stepper } from '@shared/components/navigation/stepper/stepper';
import { AppTabPanel } from '@shared/components/navigation/tab-panel/tab-panel';
import { TabItem, Tabs } from '@shared/components/navigation/tabs/tabs';
import { Button } from '@shared/components/actions/button/button';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/** Página de catálogo de la familia `navigation/`. */
@Component({
  selector: 'app-navigation',
  imports: [
    Accordion,
    AccordionItem,
    AppTabPanel,
    Breadcrumb,
    Button,
    Pagination,
    ShowcaseBlock,
    ShowcasePage,
    Stepper,
    Tabs,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Catálogo', route: '/fundamentos' },
    { label: 'Navegación' },
  ];

  protected readonly shortTrail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Navegación' },
  ];

  protected readonly tabs: readonly TabItem[] = [
    { value: 'general', label: 'General', icon: 'briefcase' },
    { value: 'fiscal', label: 'Datos fiscales', icon: 'dollar-sign' },
    { value: 'contactos', label: 'Contactos', icon: 'users', badge: '3' },
    { value: 'historial', label: 'Historial', icon: 'clock', disabled: true },
  ];

  protected readonly selectedTab = signal<string | undefined>('general');

  protected readonly plainTabs: readonly TabItem[] = [
    { value: 'abiertas', label: 'Abiertas' },
    { value: 'pagadas', label: 'Pagadas' },
    { value: 'canceladas', label: 'Canceladas' },
  ];

  protected readonly selectedPlainTab = signal<string | undefined>('abiertas');

  protected readonly steps: readonly StepItem[] = [
    { label: 'Datos del cliente', description: 'Razón social y RFC' },
    { label: 'Domicilio fiscal', description: 'Dirección de facturación' },
    { label: 'Método de pago', description: 'Condiciones y crédito' },
    { label: 'Confirmación', description: 'Revisión final' },
  ];

  protected readonly step = signal(1);

  protected readonly page = signal(3);
  protected readonly pageCount = 12;

  protected readonly pageSummary = computed(
    () => `Página ${this.page()} de ${this.pageCount} · 238 clientes`,
  );

  protected advance(): void {
    this.step.update((current) => (current >= this.steps.length - 1 ? 0 : current + 1));
  }
}
