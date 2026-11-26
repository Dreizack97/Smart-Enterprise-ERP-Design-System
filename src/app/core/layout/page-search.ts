import { DestroyRef, Service, TemplateRef, signal } from '@angular/core';

/** Opciones de presentación para el buscador contextual de la barra superior. */
export interface PageSearchOptions {
  readonly placeholder?: string;
  readonly label?: string;
}

const DEFAULT_PLACEHOLDER = 'Buscar...';
const DEFAULT_LABEL = 'Buscar';

/** Intercepta `Escape` en fase de captura dentro de un contenedor de búsqueda para borrar y salir en un solo paso. */
export function bindSearchEscape(container: HTMLElement, onEscape: () => void): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.isComposing || event.defaultPrevented) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onEscape();
  };
  container.addEventListener('keydown', onKeyDown, true);
  return () => container.removeEventListener('keydown', onKeyDown, true);
}

/**
 * Puente reactivo entre la pantalla activa y el buscador opcional de `Navbar`.
 *
 * Permite habilitar la búsqueda superior desde cualquier vista sin acoplar
 * el armazón del layout a módulos de negocio concretos.
 */
@Service()
export class PageSearch {
  private owner: symbol | null = null;
  private panelOwner: symbol | null = null;
  private readonly activeState = signal(false);
  private readonly queryState = signal('');
  private readonly placeholderState = signal(DEFAULT_PLACEHOLDER);
  private readonly labelState = signal(DEFAULT_LABEL);
  private readonly panelState = signal<TemplateRef<unknown> | null>(null);
  private readonly dismissCountState = signal(0);

  /** Indica si la vista actual habilitó el buscador superior. */
  readonly enabled = this.activeState.asReadonly();

  /** Texto de búsqueda vigente. */
  readonly query = this.queryState.asReadonly();

  /** Texto guía mostrado en el campo. */
  readonly placeholder = this.placeholderState.asReadonly();

  /** Nombre accesible del campo de búsqueda. */
  readonly label = this.labelState.asReadonly();

  /** Plantilla opcional de resultados que el layout proyecta bajo el buscador superior. */
  readonly panel = this.panelState.asReadonly();

  /** Contador incrementado cuando una selección o acción solicita cerrar y desenfocar el buscador. */
  readonly dismissVersion = this.dismissCountState.asReadonly();

  /** Activa el buscador para la vista actual y lo libera automáticamente al destruirse. */
  activate(options: PageSearchOptions, destroyRef: DestroyRef): void {
    const token = Symbol('page-search');
    this.owner = token;
    this.activeState.set(true);
    this.queryState.set('');
    this.placeholderState.set(options.placeholder?.trim() || DEFAULT_PLACEHOLDER);
    this.labelState.set(options.label?.trim() || DEFAULT_LABEL);

    destroyRef.onDestroy(() => {
      if (this.owner === token) {
        this.deactivate();
      }
    });
  }

  /** Registra el panel desplegable de resultados asociado al buscador superior y lo retira al destruirse. */
  attachPanel(template: TemplateRef<unknown>, destroyRef: DestroyRef): void {
    const token = Symbol('page-search-panel');
    this.panelOwner = token;
    this.panelState.set(template);

    destroyRef.onDestroy(() => {
      if (this.panelOwner === token) {
        this.panelOwner = null;
        this.panelState.set(null);
      }
    });
  }

  /** Actualiza la consulta capturada. */
  setQuery(value: string): void {
    this.queryState.set(value);
  }

  /** Limpia el texto conservando la activación vigente. */
  clear(): void {
    this.queryState.set('');
  }

  /** Limpia la consulta y solicita cerrar y desenfocar el buscador activo. */
  dismiss(): void {
    this.queryState.set('');
    this.dismissCountState.update((version) => version + 1);
  }

  private deactivate(): void {
    this.owner = null;
    this.panelOwner = null;
    this.activeState.set(false);
    this.queryState.set('');
    this.placeholderState.set(DEFAULT_PLACEHOLDER);
    this.labelState.set(DEFAULT_LABEL);
    this.panelState.set(null);
  }
}
