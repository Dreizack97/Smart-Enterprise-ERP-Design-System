/** La preferencia que alguien eligió. */
export type Theme = 'light' | 'dark' | 'system';

/** El tema realmente aplicado, una vez resuelto `system`. */
export type ResolvedTheme = 'light' | 'dark';

/** Materialidad de las superficies: colores planos o cristal  */
export type SurfaceStyle = 'flat' | 'glass';

/** Paletas del modo claro */
export type LightPalette = 'classic' | 'ocean' | 'cyberpunk' | 'pearl';

/** Paletas del modo escuro */
export type DarkPalette = 'midnight' | 'graphite' | 'zinc' | 'cyber';

/** Densidad de la interfaz: cambia el tamaño raíz del que dependen los `rem`. */
export type UiScale = 'compact' | 'standard' | 'comfortable';

/**
 * Llaves de almacenamiento de apariencia.
 *
 * `BrowserStorage` escribe JSON,
 * el script asíncrono de index.html duplica estas llaves y valores antes de aplicar el primer pintado
 */
export const THEME_STORAGE_KEY = 'seerp:theme';
export const SURFACE_STYLE_STORAGE_KEY = 'seerp:surface-style';
export const LIGHT_PALETTE_STORAGE_KEY = 'seerp:light-palette';
export const DARK_PALETTE_STORAGE_KEY = 'seerp:dark-palette';
export const UI_SCALE_STORAGE_KEY = 'seerp:ui-scale';
export const HIGH_CONTRAST_STORAGE_KEY = 'seerp:high-contrast';
export const REDUCED_MOTION_STORAGE_KEY = 'seerp:reduced-motion';

export const DEFAULT_SURFACE_STYLE = 'flat';
export const DEFAULT_LIGHT_PALETTE: LightPalette = 'classic';
export const DEFAULT_DARK_PALETTE: DarkPalette = 'midnight';
export const DEFAULT_UI_SCALE: UiScale = 'standard';
