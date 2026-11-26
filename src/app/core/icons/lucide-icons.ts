import { Provider } from '@angular/core';
import { provideLucideIcons } from '@lucide/angular';
import { APP_ICON_DATA } from './app-icon-data';

/**
 * El vocabulario de iconos del sistema.
 *
 * Los dibujos se generan con `npm run generate:icons` desde la versión instalada
 * de Lucide; se registra su información SVG sin incluir un componente por icono. El
 * conjunto es deliberadamente más amplio de lo que el catálogo demuestra hoy
 * — un vocabulario de iconos es parte de lo que entrega un sistema de diseño,
 * y la página de Fundamentos renderiza cada uno desde `ICON_NAMES`.
 */
const ICONS = APP_ICON_DATA;

/**
 * Todo nombre válido para `<app-icon name="...">`.
 *
 * Es una constante y no solo un tipo para que el showcase pueda recorrerla:
 * el catálogo de iconos de la página de Fundamentos se genera a partir de
 * aquí, lo que hace imposible registrar un icono y olvidar mostrarlo.
 */
export const ICON_NAMES = [
  'arrow-down',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-up-down',
  'bell',
  'briefcase',
  'building-2',
  'calendar',
  'camera',
  'chart-column',
  'chart-line',
  'chart-pie',
  'check',
  'check-check',
  'chevron-down',
  'chevron-left',
  'chevron-right',
  'chevron-up',
  'circle',
  'circle-alert',
  'circle-check',
  'clock',
  'code',
  'copy',
  'dollar-sign',
  'download',
  'ellipsis-vertical',
  'eye',
  'eye-off',
  'filter',
  'globe',
  'heart-pulse',
  'house',
  'image',
  'info',
  'key',
  'layout-grid',
  'list',
  'locate-fixed',
  'lock',
  'log-out',
  'mail',
  'mail-open',
  'maximize-2',
  'menu',
  'minimize-2',
  'minus',
  'monitor',
  'moon',
  'package',
  'package-open',
  'pencil',
  'plus',
  'printer',
  'qr-code',
  'refresh-cw',
  'rotate-ccw',
  'search',
  'send',
  'settings',
  'shield',
  'shield-check',
  'shopping-bag',
  'shopping-cart',
  'sliders-horizontal',
  'smartphone',
  'star',
  'sun',
  'sun-moon',
  'tablet',
  'trash-2',
  'triangle-alert',
  'upload',
  'user',
  'user-plus',
  'users',
  'x',
  'zap',
  'zoom-in',
  'zoom-out',
] as const;

/**
 * Nombres válidos para `<app-icon name="...">`.
 *
 * Derivado de `ICON_NAMES` para que la unión de tipos y el catálogo no puedan
 * desalinearse. `strictTemplates` rechaza entonces un icono no registrado en
 * tiempo de compilación, en vez de dejar un hueco vacío en tiempo de
 * ejecución.
 */
export type IconName = (typeof ICON_NAMES)[number];

/** Registra todo el catálogo. Declarado una sola vez, en `core-providers.ts`. */
export function provideAppIcons(): Provider {
  return provideLucideIcons(...ICONS);
}
