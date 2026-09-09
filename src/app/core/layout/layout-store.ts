import { Service, inject, signal, untracked } from '@angular/core';
import { BrowserStorage } from '@core/storage/browser-storage';
import { SIDEBAR_COLLAPSED_KEY, SIDEBAR_SUBMENUS_KEY } from './layout.model';

/** Ancho a partir del cual el sidebar deja de ser un cajón deslizante. */
const DESKTOP_BREAKPOINT = 1024;

/**
 * Estado del armazón: riel colapsado, cajón móvil y submenús expandidos.
 *
 * Solo guarda estado, nada más — sin efectos, sin DOM. El original reflejaba
 * el riel en `<body>` para que reglas globales como
 * `body.sidebar-collapsed .app-main` pudieran alcanzar a través del árbol de
 * componentes; esas reglas ahora viven dentro de los componentes que
 * estilizan, gobernadas por inputs, así que la clase se quedó sin lectores.
 *
 * La persistencia ocurre en el mutador que cambia el valor, no en un efecto
 * que observa el signal. Un efecto también corre al construirse, así que
 * volvería a escribir a disco el valor que acaba de leer de ahí, y aleja la
 * escritura de la acción que la causó.
 *
 * Los signals se exponen de solo lectura para que el emparejamiento entre
 * mutador y escritura no dependa de que nadie llame `set()` desde afuera.
 *
 * Los mutadores leen el estado a través de `untracked`. Eso no es decoración:
 * `openBranch` se llama desde un efecto en `sidebar-nav-item` para revelar la
 * ruta activa, y una lectura simple convertiría al signal en dependencia de
 * ese efecto, que entonces se dispararía de nuevo por su propia escritura
 * (NG0103).
 */
@Service()
export class LayoutStore {
  private readonly storage = inject(BrowserStorage);

  private readonly collapsed = signal(this.storage.read(SIDEBAR_COLLAPSED_KEY, false));
  private readonly drawerOpen = signal(false);
  private readonly submenus = signal<ReadonlySet<string>>(this.readOpenSubmenus());

  /** Riel colapsado en escritorio. Persistido. */
  readonly sidebarCollapsed = this.collapsed.asReadonly();

  /** Cajón abierto en móvil. Efímero por diseño: no sobrevive a la navegación. */
  readonly sidebarOpen = this.drawerOpen.asReadonly();

  /** Identificadores de los submenús expandidos. Persistido. */
  readonly openSubmenus = this.submenus.asReadonly();

  toggleCollapsed(): void {
    const next = !untracked(this.collapsed);
    this.collapsed.set(next);
    this.storage.write(SIDEBAR_COLLAPSED_KEY, next);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((open) => !open);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  isSubmenuOpen(id: string): boolean {
    return this.submenus().has(id);
  }

  /**
   * Expande un submenú, cerrando a sus hermanos.
   *
   * El comportamiento de acordeón es intencional: con tres niveles de
   * profundidad, permitir varias ramas abiertas a la vez convierte al menú en
   * una lista que nadie puede escanear de un vistazo.
   */
  toggleSubmenu(id: string, siblingIds: readonly string[]): void {
    const next = new Set(untracked(this.submenus));
    if (next.has(id)) {
      next.delete(id);
    } else {
      for (const sibling of siblingIds) {
        next.delete(sibling);
      }
      next.add(id);
    }
    this.applySubmenus(next);
  }

  /** Abre una rama completa. La usa el sidebar para revelar la ruta activa. */
  openBranch(ids: readonly string[]): void {
    const current = untracked(this.submenus);
    if (ids.every((id) => current.has(id))) {
      // No hay nada que abrir. Salir sin escribir evita que el efecto que
      // llama marque el signal en cada pasada de detección de cambios.
      return;
    }
    this.applySubmenus(new Set([...current, ...ids]));
  }

  /** El cajón móvil no tiene sentido en escritorio: ensanchar la ventana lo cierra. */
  syncWithViewport(width: number): void {
    if (width >= DESKTOP_BREAKPOINT) {
      this.closeDrawer();
    }
  }

  private applySubmenus(next: ReadonlySet<string>): void {
    this.submenus.set(next);
    this.storage.write(SIDEBAR_SUBMENUS_KEY, [...next]);
  }

  private readOpenSubmenus(): ReadonlySet<string> {
    const stored = this.storage.read<readonly unknown[]>(SIDEBAR_SUBMENUS_KEY, []);
    if (!Array.isArray(stored)) {
      return new Set();
    }
    return new Set(stored.filter((id): id is string => typeof id === 'string'));
  }
}
