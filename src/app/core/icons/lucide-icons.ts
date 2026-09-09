import { Provider } from '@angular/core';
import {
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowRight,
  LucideArrowUp,
  LucideArrowUpDown,
  LucideBell,
  LucideBriefcase,
  LucideCalendar,
  LucideCamera,
  LucideChartColumn,
  LucideChartLine,
  LucideChartPie,
  LucideCheck,
  LucideCheckCheck,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronUp,
  LucideCircle,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideClock,
  LucideCode,
  LucideCopy,
  LucideDollarSign,
  LucideDownload,
  LucideEllipsisVertical,
  LucideEye,
  LucideEyeOff,
  LucideFilter,
  LucideHouse,
  LucideImage,
  LucideInfo,
  LucideKey,
  LucideLayoutGrid,
  LucideList,
  LucideLock,
  LucideLogOut,
  LucideMail,
  LucideMailOpen,
  LucideMenu,
  LucideMoon,
  LucidePackage,
  LucidePackageOpen,
  LucidePencil,
  LucidePlus,
  LucidePrinter,
  LucideQrCode,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideSearch,
  LucideSend,
  LucideSettings,
  LucideShield,
  LucideShoppingBag,
  LucideShoppingCart,
  LucideSmartphone,
  LucideStar,
  LucideSun,
  LucideSunMoon,
  LucideTrash2,
  LucideTriangleAlert,
  LucideUpload,
  LucideUser,
  LucideUserPlus,
  LucideUsers,
  LucideX,
  LucideZap,
  provideLucideIcons,
} from '@lucide/angular';

/**
 * El vocabulario de iconos del sistema.
 *
 * Lucide permite tree-shaking: solo se empaqueta lo que aquí se registra. El
 * conjunto es deliberadamente más amplio de lo que el catálogo demuestra hoy
 * — un vocabulario de iconos es parte de lo que entrega un sistema de diseño,
 * y la página de Fundamentos renderiza cada uno desde `ICON_NAMES`.
 */
const ICONS = [
  // Navigation and shell
  LucideMenu,
  LucideHouse,
  LucideChevronDown,
  LucideChevronUp,
  LucideChevronLeft,
  LucideChevronRight,
  LucideSearch,
  LucideBell,
  LucideSettings,
  LucideLogOut,
  LucideEllipsisVertical,
  LucideFilter,

  // Theme
  LucideSun,
  LucideMoon,
  LucideSunMoon,

  // People
  LucideUser,
  LucideUsers,
  LucideUserPlus,

  // Business
  LucideBriefcase,
  LucidePackage,
  LucidePackageOpen,
  LucideShoppingCart,
  LucideShoppingBag,
  LucideDollarSign,
  LucideCalendar,
  LucideClock,

  // Charts
  LucideChartLine,
  LucideChartColumn,
  LucideChartPie,

  // Actions
  LucidePlus,
  LucidePencil,
  LucideTrash2,
  LucideCopy,
  LucideX,
  LucideCheck,
  LucideCheckCheck,
  LucidePrinter,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideDownload,
  LucideSend,
  LucideCamera,
  LucideImage,
  LucideUpload,

  // Table sorting
  LucideArrowUpDown,
  LucideArrowUp,
  LucideArrowDown,
  LucideArrowLeft,
  LucideArrowRight,

  // Views
  LucideLayoutGrid,
  LucideList,

  // Status and notifications
  LucideCircle,
  LucideCircleCheck,
  LucideCircleAlert,
  LucideInfo,
  LucideTriangleAlert,
  LucideStar,
  LucideZap,

  // Access and security
  LucideLock,
  LucideKey,
  LucideShield,
  LucideEye,
  LucideEyeOff,
  LucideQrCode,
  LucideSmartphone,
  LucideMail,
  LucideMailOpen,
  LucideCode,
] as const;

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
  'house',
  'image',
  'info',
  'key',
  'layout-grid',
  'list',
  'lock',
  'log-out',
  'mail',
  'mail-open',
  'menu',
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
  'shopping-bag',
  'shopping-cart',
  'smartphone',
  'star',
  'sun',
  'sun-moon',
  'trash-2',
  'triangle-alert',
  'upload',
  'user',
  'user-plus',
  'users',
  'x',
  'zap',
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
