import { Component, input, numberAttribute } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';
import { IconName } from '@core/icons/lucide-icons';

/**
 * El icono del sistema.
 *
 * Envuelve la directiva dinámica de Lucide para que ningún otro componente
 * tenga que importar iconos uno por uno. Es la única pieza que conoce a
 * Lucide: cambiar de familia de iconos toca este archivo y el catálogo, nada
 * más.
 *
 * Accesibilidad: un icono es decorativo por defecto (`aria-hidden`). Solo
 * cuando recibe un `label` se anuncia como una imagen con nombre. Un icono
 * junto a texto visible NO debe llevar `label` — se leería dos veces.
 */
@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  /** Un icono del catálogo registrado en `lucide-icons`. */
  readonly name = input.required<IconName>();

  /** Lado del icono en píxeles. */
  readonly size = input(16, { transform: numberAttribute });

  /** En superficies de color sólido, un trazo más grueso compensa el contraste. */
  readonly strokeWidth = input(2, { transform: numberAttribute });

  /** Etiqueta accesible. Solo cuando el icono carga información propia. */
  readonly label = input('');
}
