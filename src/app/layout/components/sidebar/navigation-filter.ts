import { matchesQuery } from '@shared/utils/text-highlight';
import { NavItem, NavSection } from './navigation.model';

/**
 * Poda el árbol a lo que coincide con `query`.
 *
 * Un grupo con descendientes que coinciden se conserva solo con ellos, para
 * que el resultado sea corto y siga diciendo dónde vive cada pantalla: buscar
 * «asist» no despliega todo «Asistencia», solo lo que también dice «asist».
 * Un grupo sin descendientes que coincidan se conserva entero si su propio
 * nombre coincide: buscar «Producción» muestra todo lo que hay en Producción.
 * Las secciones vacías desaparecen.
 */
export function filterNavigation(
  sections: readonly NavSection[],
  query: string,
): readonly NavSection[] {
  return sections.flatMap((section) => {
    const items = filterItems(section.items, query);
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}

function filterItems(items: readonly NavItem[], query: string): NavItem[] {
  return items.flatMap((item) => {
    const filtered = filterItem(item, query);
    return filtered ? [filtered] : [];
  });
}

function filterItem(item: NavItem, query: string): NavItem | null {
  const children = filterItems(item.children ?? [], query);
  if (children.length > 0) {
    return { ...item, children };
  }
  return matchesQuery(item.label, query) ? item : null;
}
