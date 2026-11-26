import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Tab, TabList, Tabs as AriaTabs } from '@angular/aria/tabs';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';
import { Select, SelectOption } from '@shared/components/forms/select/select';

/** Una pestaña. `value` es lo que se lee de y se escribe en `selected`. */
export interface TabItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly badge?: string;
  readonly disabled?: boolean;
}

/**
 * La barra de pestañas.
 *
 * Los paneles se proyectan como hijos `app-tab-panel`, así que caen dentro
 * del mismo contenedor `ngTabs` que la barra. Esa contención no es
 * cosmética: es lo que permite a `@angular/aria` emparejar cada pestaña con
 * su panel y emitir `aria-controls` y `aria-labelledby`. El original
 * renderizaba el panel fuera del contenedor, así que el emparejamiento nunca
 * ocurría y cada pestaña salía sin `aria-controls`.
 *
 * La accesibilidad viene de las directivas de `@angular/aria`: desplazamiento
 * con flechas, Home/End, `tabindex` móvil y `aria-selected` mantenidos en
 * sincronía. Nada de esto se reimplementa a mano, porque es exactamente ahí
 * donde estos patrones se rompen.
 *
 * Ni `role="tabpanel"` ni `aria-controls` se escriben nunca a mano: las
 * directivas son dueñas de ambos, y fijarlos manualmente solo lograría que
 * el atributo dijera una cosa mientras el componente creyera otra.
 */
@Component({
  selector: 'app-tabs',
  imports: [TabList, Tab, Icon, Select],
  // `ngTabs` es una directiva de host y no un elemento en la plantilla, por
  // la misma razón que el acordeón lo hace: `ng-content` no cambia el
  // inyector. Un `app-tab-panel` proyectado se declara en la plantilla del
  // consumidor, así que solo puede alcanzar lo que `<app-tabs>` provee — con
  // la directiva dentro de la plantilla, el panel no podría encontrar el
  // token TABS en absoluto.
  hostDirectives: [AriaTabs],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  private readonly destroyRef = inject(DestroyRef);
  private readonly tabListEl = viewChild<ElementRef<HTMLElement>>('tabList');
  private readonly tabDirectives = viewChildren(Tab);

  readonly tabs = input.required<readonly TabItem[]>();

  /** La pestaña activa. Un `model()`: la propia barra la cambia. */
  readonly selected = model<string | undefined>(undefined);

  /** Nombre accesible de la barra. Obligatorio si la página tiene más de una. */
  readonly label = input('');

  readonly disabled = input(false, { transform: booleanAttribute });

  /** Ofrece la misma navegación en un selector nativo compacto para pantallas móviles. */
  protected readonly mobileOptions = computed<readonly SelectOption[]>(() =>
    this.tabs().map((tab) => ({
      value: tab.value,
      label: tab.label + (tab.badge ? ` (${tab.badge})` : ''),
      disabled: !!tab.disabled,
    })),
  );

  /** Geometría de la pestaña seleccionada; `null` conserva el borde estático como respaldo. */
  protected readonly indicator = signal<{ left: number; bottom: number; width: number } | null>(
    null,
  );

  constructor() {
    afterRenderEffect((onCleanup) => {
      const list = this.tabListEl()?.nativeElement;
      const tabs = this.tabDirectives();
      if (list && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => this.syncIndicator());
        observer.observe(list);
        for (const tab of tabs) observer.observe(tab.element);
        onCleanup(() => observer.disconnect());
      }
    });

    afterRenderEffect(() => {
      this.tabs();
      this.syncIndicator();
    });
  }

  /** Cambia la selección compartida solo si la barra y el destino están habilitados. */
  protected onMobileSelect(value: string): void {
    if (!this.disabled() && this.tabs().some((tab) => tab.value === value && !tab.disabled))
      this.selected.set(value);
  }

  /** Mide la selección real de Angular ARIA y respeta la fila que ocupa dentro de la lista. */
  private syncIndicator(): void {
    if (this.destroyRef.destroyed) return;
    const target = this.tabDirectives().find((tab) => tab.selected())?.element;
    if (
      !target ||
      !target.offsetWidth ||
      !target.offsetHeight ||
      typeof ResizeObserver === 'undefined'
    ) {
      this.indicator.set(null);
      return;
    }

    this.indicator.set({
      left: target.offsetLeft,
      bottom: target.offsetTop + target.offsetHeight,
      width: target.offsetWidth,
    });
  }
}
