/** La preferencia que alguien eligió. */
export type Theme = 'light' | 'dark' | 'system';

/** El tema realmente aplicado, una vez resuelto `system`. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Llave de almacenamiento del tema.
 *
 * `BrowserStorage` escribe JSON, así que el valor guardado es `"dark"` con
 * comillas. El script síncrono de `index.html` lo interpreta así: la llave y
 * la forma se duplican ahí a propósito, porque ese script corre antes de que
 * Angular exista y no puede importar nada.
 */
export const THEME_STORAGE_KEY = 'seerp:theme';
