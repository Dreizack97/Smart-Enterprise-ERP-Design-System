import { Component, booleanAttribute, input, model } from '@angular/core';
import { Tab, TabList, Tabs as AriaTabs } from '@angular/aria/tabs';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';

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
  imports: [TabList, Tab, Icon],
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
  readonly tabs = input.required<readonly TabItem[]>();

  /** La pestaña activa. Un `model()`: la propia barra la cambia. */
  readonly selected = model<string | undefined>(undefined);

  /** Nombre accesible de la barra. Obligatorio si la página tiene más de una. */
  readonly label = input('');

  readonly disabled = input(false, { transform: booleanAttribute });
}
