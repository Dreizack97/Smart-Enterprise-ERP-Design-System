import { DarkPalette, LightPalette, SurfaceStyle, Theme, UiScale } from '@core/theme/theme.model';
import { SegmentOption } from '@shared/components/actions/segmented-control/segmented-control';
import { RadioOption } from '@shared/components/forms/radio-group/radio-group';

/** Una paleta de color (clara u oscura) con los colores de su miniatura. */
export interface PaletteOption<P extends string = string> {
  readonly value: P;
  readonly label: string;
  readonly description: string;
  readonly swatch: {
    readonly canvas: string;
    readonly surface: string;
    readonly line: string;
    readonly accent: string;
  };
}

/** Una opción de control cuyo valor es, además, el del modelo que representa. */
type TypedOption<O, T extends string> = O & { readonly value: T };

/** Preferencia de iluminación de la plantilla Perfil. */
export const THEME_OPTIONS: readonly TypedOption<RadioOption, Theme>[] = [
  { value: 'light', label: 'Claro', description: 'Fondo claro a toda hora.', icon: 'sun' },
  { value: 'dark', label: 'Oscuro', description: 'Fondo oscuro a toda hora.', icon: 'moon' },
  {
    value: 'system',
    label: 'Seguir al sistema',
    description: 'Cambia con la preferencia del equipo.',
    icon: 'sun-moon',
  },
];

/** Estilo visual de las superficies (colores planos vs. glassmorphism). */
export const SURFACE_STYLE_OPTIONS: readonly TypedOption<RadioOption, SurfaceStyle>[] = [
  {
    value: 'flat',
    label: 'Colores planos',
    description: 'Superficies sólidas de corte limpio.',
    icon: 'layout-grid',
  },
  {
    value: 'glass',
    label: 'Cristales',
    description: 'Láminas translúcidas con desenfoque y luz ambiental.',
    icon: 'eye',
  },
];

export const UI_SCALE_OPTIONS: readonly TypedOption<SegmentOption, UiScale>[] = [
  { value: 'compact', label: 'Compacta' },
  { value: 'standard', label: 'Estándar' },
  { value: 'comfortable', label: 'Amplia' },
];

/** Las 4 variantes cromáticas para el modo claro. */
export const LIGHT_PALETTE_OPTIONS: readonly PaletteOption<LightPalette>[] = [
  {
    value: 'classic',
    label: 'Classic Azul',
    description: 'Azul sobre lienzo neutro.',
    swatch: { canvas: '#f8fafc', surface: '#ffffff', line: '#cbd5e1', accent: '#2563eb' },
  },
  {
    value: 'ocean',
    label: 'Dark Cyan',
    description: 'Tinte hielo con acentos profundos.',
    swatch: { canvas: '#f0f9ff', surface: '#ffffff', line: '#7dd3fc', accent: '#0e7490' },
  },
  {
    value: 'cyberpunk',
    label: 'Cyber Cyan',
    description: 'Bordes vivos y cían eléctrico.',
    swatch: { canvas: '#e0fafe', surface: '#ffffff', line: '#00b8d4', accent: '#00e5ff' },
  },
  {
    value: 'pearl',
    label: 'Perla',
    description: 'Monocromo frío y minimalista.',
    swatch: { canvas: '#f4f4f6', surface: '#ffffff', line: '#d4d4d8', accent: '#0284c7' },
  },
];

/** Las 4 variantes cromáticas para el modo oscuro. */
export const DARK_PALETTE_OPTIONS: readonly PaletteOption<DarkPalette>[] = [
  {
    value: 'midnight',
    label: 'Medianoche',
    description: 'Azul profundo, la predeterminada.',
    swatch: { canvas: '#0b1120', surface: '#16213a', line: '#334155', accent: '#7db3fb' },
  },
  {
    value: 'graphite',
    label: 'Grafito',
    description: 'Neutro frío y de alto contraste.',
    swatch: { canvas: '#0d1117', surface: '#161b22', line: '#30363d', accent: '#58a6ff' },
  },
  {
    value: 'zinc',
    label: 'Zinc',
    description: 'Carbón sin tinte azul.',
    swatch: { canvas: '#09090b', surface: '#141417', line: '#2e2e33', accent: '#60a5fa' },
  },
  {
    value: 'cyber',
    label: 'Cyber Cyan',
    description: 'Abisal oscuro con neón cían.',
    swatch: { canvas: '#050b14', surface: '#0b1624', line: '#0891b2', accent: '#00f0ff' },
  },
];

/** Estrecha el `string` que emite un control de opciones al tipo de sus valores. */
export function findOption<T extends string>(
  options: readonly { readonly value: T }[],
  value: string,
): T | undefined {
  return options.find((option) => option.value === value)?.value;
}
