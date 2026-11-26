import { IconName } from '@core/icons/lucide-icons';

/**
 * Un nodo de navegación.
 *
 * Un nodo con `children` es un grupo expandible; uno sin ellos es un enlace.
 * El árbol soporta hasta cuatro niveles, los que necesita Recursos Humanos;
 * pasado eso, el sidebar deja de ser navegable y se convierte en un mapa del
 * sitio.
 */
export interface NavItem {
  /**
   * Identificador estable. Es la llave bajo la cual se persiste "este grupo
   * se dejó abierto", así que no debe cambiar entre sesiones.
   */
  readonly id: string;

  readonly label: string;
  readonly icon?: IconName;

  /** Ruta de la aplicación. Ausente en los grupos. */
  readonly route?: string;

  /**
   * Sección de esa ruta, cuando la entrada nombra a un grupo dentro de una
   * página.
   *
   * Una página del catálogo es una familia contada como una sola historia;
   * cortarla en una ruta por componente rompería la historia para
   * complacer al menú. El menú, en cambio, apunta dentro de la página, que
   * es para lo que existe un ancla.
   */
  readonly fragment?: string;

  readonly children?: readonly NavItem[];
}

/** Un grupo de entradas de navegación bajo un encabezado compartido. */
export interface NavSection {
  /** Encabezado del grupo. Ausente en la primera sección, que no lleva ninguno. */
  readonly title?: string;

  readonly items: readonly NavItem[];
}

/** Recolecta recursivamente los IDs de una lista de nodos y todos sus descendientes. */
export function subtreeIdsOf(items: readonly NavItem[]): string[] {
  return items.flatMap((item) => [item.id, ...subtreeIdsOf(item.children ?? [])]);
}
