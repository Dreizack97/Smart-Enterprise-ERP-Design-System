import { Component, booleanAttribute, input } from '@angular/core';
import { TabContent, TabPanel } from '@angular/aria/tabs';

/**
 * El panel que pertenece a una pestaña de `app-tabs`.
 *
 * Debe proyectarse dentro de `<app-tabs>`: el emparejamiento entre una
 * pestaña y su panel lo hace `@angular/aria` a través del contenedor
 * compartido `ngTabs`, y es lo que produce `aria-controls` y
 * `aria-labelledby`. Un panel renderizado fuera de ese contenedor nunca
 * puede asociarse con su pestaña — que es lo que hacía el original, así que
 * sus pestañas no llevaban `aria-controls` en absoluto pese a que el
 * comentario afirmaba lo contrario.
 *
 * El contenido vive en un `ng-template`, así que un panel no abierto nunca
 * se construye.
 */
@Component({
  selector: 'app-tab-panel',
  imports: [TabPanel, TabContent],
  template: `
    <div ngTabPanel [value]="value()" [preserveContent]="preserveContent()" class="tab-panel">
      <ng-template ngTabContent>
        <ng-content />
      </ng-template>
    </div>
  `,
  styleUrl: './tab-panel.css',
})
export class AppTabPanel {
  /** Debe coincidir con el `value` de la pestaña a la que pertenece. */
  readonly value = input.required<string>();

  /** Conserva el DOM del panel ya visitado al cambiar de pestaña. */
  readonly preserveContent = input(false, { transform: booleanAttribute });
}
