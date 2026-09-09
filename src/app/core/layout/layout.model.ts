/**
 * Llaves de almacenamiento del armazón.
 *
 * Todo lo que el sistema persiste lleva el prefijo `seerp:`, para que una
 * llave ajena nunca se confunda con una nuestra.
 *
 * A diferencia del tema, nada de esto se lee antes de que Angular arranque.
 * El script de pre-pintado existe porque la página tiene un color de fondo
 * desde el primer frame; el sidebar no existe hasta que la aplicación se
 * renderiza, así que no hay un frame anterior en el que pueda aparecer.
 */
export const SIDEBAR_COLLAPSED_KEY = 'seerp:sidebar-collapsed';

/** Identificadores de los submenús expandidos. */
export const SIDEBAR_SUBMENUS_KEY = 'seerp:sidebar-submenus';
