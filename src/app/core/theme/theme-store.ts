import { DOCUMENT, DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { BrowserStorage } from '@core/storage/browser-storage';
import { ResolvedTheme, THEME_STORAGE_KEY, Theme } from './theme.model';

/** Cuánto dura la transición global de color al cambiar de tema. */
const THEME_ANIMATION_MS = 350;

/**
 * Estado del tema claro / oscuro.
 *
 * El tema ya está aplicado por el script síncrono de `index.html`; este
 * servicio solo lo lee, lo alterna y lo persiste. Deliberadamente no lo
 * vuelve a aplicar al arrancar, lo que forzaría un repintado innecesario.
 */
@Service()
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(BrowserStorage);
  private readonly destroyRef = inject(DestroyRef);

  private readonly preference = signal<Theme>(this.readStoredPreference());
  private readonly systemTheme = signal<ResolvedTheme>(this.readSystemTheme());

  /** La preferencia elegida, incluyendo `system`. */
  readonly theme = this.preference.asReadonly();

  /** El tema realmente en efecto, con `system` ya resuelto. */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const value = this.preference();
    return value === 'system' ? this.systemTheme() : value;
  });

  readonly isDark = computed(() => this.resolvedTheme() === 'dark');

  /** Etiqueta la acción, no el estado: lo que pasa al presionarlo. */
  readonly toggleLabel = computed(() => (this.isDark() ? 'Modo claro' : 'Modo oscuro'));

  constructor() {
    this.watchSystemPreference();
  }

  /** Alterna entre claro y oscuro, partiendo de lo que hay en pantalla. */
  toggle(): void {
    this.set(this.isDark() ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.preference.set(theme);
    this.persist(theme);
    this.apply();
  }

  /**
   * Sincroniza la clase `dark` en `<html>` con el estado actual.
   *
   * `.theme-anim` se agrega solo mientras se cambia: dejarla puesta haría que
   * cualquier hover ordinario arrastrara detrás una transición de 300 ms.
   */
  private apply(): void {
    const root = this.document.documentElement;
    root.classList.add('theme-anim');
    root.classList.toggle('dark', this.isDark());
    this.document.defaultView?.setTimeout(
      () => root.classList.remove('theme-anim'),
      THEME_ANIMATION_MS,
    );
  }

  /** La preferencia del sistema solo se sigue mientras no exista una elección manual. */
  private watchSystemPreference(): void {
    const media = this.prefersDark();
    if (!media) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => {
      this.systemTheme.set(event.matches ? 'dark' : 'light');
      if (this.preference() === 'system') {
        this.document.documentElement.classList.toggle('dark', event.matches);
      }
    };

    media.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', onChange));
  }

  private readSystemTheme(): ResolvedTheme {
    return this.prefersDark()?.matches ? 'dark' : 'light';
  }

  /**
   * `matchMedia` no está disponible en todos los entornos donde corre este
   * código. Sin una consulta que hacer, se asume claro.
   */
  private prefersDark(): MediaQueryList | null {
    const view = this.document.defaultView;
    return typeof view?.matchMedia === 'function'
      ? view.matchMedia('(prefers-color-scheme: dark)')
      : null;
  }

  private readStoredPreference(): Theme {
    const stored = this.storage.read<string | null>(THEME_STORAGE_KEY, null);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  }

  /**
   * `system` no se guarda, se elimina: la ausencia de la llave es exactamente
   * lo que el script de `index.html` interpreta como "seguir al sistema
   * operativo".
   */
  private persist(theme: Theme): void {
    if (theme === 'system') {
      this.storage.remove(THEME_STORAGE_KEY);
    } else {
      this.storage.write(THEME_STORAGE_KEY, theme);
    }
  }
}
