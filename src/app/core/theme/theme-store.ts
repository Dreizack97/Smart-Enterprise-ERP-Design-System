import {
  DOCUMENT,
  DestroyRef,
  Service,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { BrowserStorage } from '@core/storage/browser-storage';
import {
  DARK_PALETTE_STORAGE_KEY,
  DEFAULT_DARK_PALETTE,
  DEFAULT_LIGHT_PALETTE,
  DEFAULT_SURFACE_STYLE,
  DEFAULT_UI_SCALE,
  DarkPalette,
  HIGH_CONTRAST_STORAGE_KEY,
  LIGHT_PALETTE_STORAGE_KEY,
  LightPalette,
  REDUCED_MOTION_STORAGE_KEY,
  ResolvedTheme,
  SURFACE_STYLE_STORAGE_KEY,
  SurfaceStyle,
  THEME_STORAGE_KEY,
  Theme,
  UI_SCALE_STORAGE_KEY,
  UiScale,
} from './theme.model';

/** Cuánto dura la transición global de color al cambiar de tema. */
const THEME_ANIMATION_MS = 620;

const SURFACE_STYLES: readonly SurfaceStyle[] = ['flat', 'glass'];
const LIGHT_PALETTES: readonly LightPalette[] = ['classic', 'cyberpunk', 'ocean', 'pearl'];
const DARK_PALETTES: readonly DarkPalette[] = ['cyber', 'midnight', 'graphite', 'zinc'];
const UI_SCALES: readonly UiScale[] = ['compact', 'standard', 'comfortable'];

/** Clases de paleta que `apply()` reemplaza en `<html>`. */
const PALETTE_CLASSES = [
  ...LIGHT_PALETTES.map((palette) => `theme-${palette}`),
  ...DARK_PALETTES.map((palette) => `theme-${palette}`),
];

/**
 * Estado de la apariencia: tema claro / oscuro, estilo de superficie (plano o cristal)
 * paletas clara y oscura, escala de la interfaz, alto contraste y reducción de movimiento.
 *
 * Todo ya está aplicado por el script síncrono de `index.html`; este servicio
 * solo lo lee, lo cambia y lo persiste. Deliberadamente no lo vuelve a aplicar
 * al arrancar, lo que forzaría un repintado innecesario.
 */
@Service()
export class ThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(BrowserStorage);
  private readonly destroyRef = inject(DestroyRef);

  private readonly preference = signal<Theme>(this.readStoredPreference());
  private readonly systemTheme = signal<ResolvedTheme>(this.readSystemTheme());
  private readonly surfaceStyleState = signal(
    this.readStoredOption(SURFACE_STYLE_STORAGE_KEY, SURFACE_STYLES, DEFAULT_SURFACE_STYLE),
  );
  private readonly lightPaletteState = signal(
    this.readStoredOption(LIGHT_PALETTE_STORAGE_KEY, LIGHT_PALETTES, DEFAULT_LIGHT_PALETTE),
  );
  private readonly darkPaletteState = signal(
    this.readStoredOption(DARK_PALETTE_STORAGE_KEY, DARK_PALETTES, DEFAULT_DARK_PALETTE),
  );
  private readonly uiScaleState = signal(
    this.readStoredOption(UI_SCALE_STORAGE_KEY, UI_SCALES, DEFAULT_UI_SCALE),
  );
  private readonly highContrastState = signal(this.readStoredFlag(HIGH_CONTRAST_STORAGE_KEY));
  private readonly reducedMotionState = signal(this.readStoredFlag(REDUCED_MOTION_STORAGE_KEY));

  /** La preferencia elegida, incluyendo `system`. */
  readonly theme = this.preference.asReadonly();
  readonly surfaceStyle = this.surfaceStyleState.asReadonly();
  readonly lightPalette = this.lightPaletteState.asReadonly();
  readonly darkPalette = this.darkPaletteState.asReadonly();
  readonly uiScale = this.uiScaleState.asReadonly();
  readonly highContrast = this.highContrastState.asReadonly();
  readonly reducedMotion = this.reducedMotionState.asReadonly();

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
    this.persistTheme(theme);
    this.apply();
  }

  setSurfaceStyle(style: SurfaceStyle): void {
    this.update(this.surfaceStyleState, SURFACE_STYLE_STORAGE_KEY, style);
  }

  setLightPalette(palette: LightPalette): void {
    this.update(this.lightPaletteState, LIGHT_PALETTE_STORAGE_KEY, palette);
  }

  setDarkPalette(palette: DarkPalette): void {
    this.update(this.darkPaletteState, DARK_PALETTE_STORAGE_KEY, palette);
  }

  setUiScale(scale: UiScale): void {
    this.update(this.uiScaleState, UI_SCALE_STORAGE_KEY, scale);
  }

  setHighContrast(enabled: boolean): void {
    this.update(this.highContrastState, HIGH_CONTRAST_STORAGE_KEY, enabled);
  }

  setReducedMotion(enabled: boolean): void {
    this.update(this.reducedMotionState, REDUCED_MOTION_STORAGE_KEY, enabled);
  }

  private update<T>(state: WritableSignal<T>, key: string, value: T): void {
    state.set(value);
    this.storage.write(key, value);
    this.apply();
  }

  private animTimer: ReturnType<typeof setTimeout> | null = null;
  private transitionId = 0;

  /**
   * Sincroniza `<html>` con el estado actual: la clase `dark`, la clase de la
   * paleta y los atributos de las preferencias.
   *
   * Toma las coordenadas del control que disparó el cambio (`activeElement`)
   * para que la onda radial con bloom nazca exactamente desde ese botón.
   */
  private apply(): void {
    const root = this.document.documentElement;
    const view = this.document.defaultView;
    const doc = this.document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };

    const currentId = ++this.transitionId;

    if (this.animTimer !== null) {
      view?.clearTimeout(this.animTimer);
      this.animTimer = null;
    }

    // Calculamos el centro del botón que disparó el cambio (o la esquina superior derecha como respaldo)
    const trigger = this.document.activeElement as HTMLElement | null;
    const width = view?.innerWidth ?? 1920;
    const height = view?.innerHeight ?? 1080;

    let originX = width - 48;
    let originY = 32;

    if (
      trigger &&
      trigger !== this.document.body &&
      trigger !== root &&
      typeof trigger.getBoundingClientRect === 'function'
    ) {
      const rect = trigger.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        originX = Math.round(rect.left + rect.width / 2);
        originY = Math.round(rect.top + rect.height / 2);
      }
    }

    const maxRadius = Math.ceil(
      Math.hypot(Math.max(originX, width - originX), Math.max(originY, height - originY)),
    );

    root.style.setProperty('--theme-x', `${originX}px`);
    root.style.setProperty('--theme-y', `${originY}px`);
    root.style.setProperty('--theme-r', `${maxRadius}px`);

    const commitDomChanges = () => {
      const dark = this.isDark();
      root.classList.toggle('dark', dark);
      root.classList.remove(...PALETTE_CLASSES);
      root.classList.add(`theme-${dark ? this.darkPaletteState() : this.lightPaletteState()}`);

      root.setAttribute('data-surface', this.surfaceStyleState());
      root.setAttribute('data-ui-scale', this.uiScaleState());
      root.setAttribute('data-high-contrast', String(this.highContrastState()));
      root.setAttribute('data-reduced-motion', String(this.reducedMotionState()));
    };

    const osReducedMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const skipAnimation = this.reducedMotionState() || osReducedMotion;

    root.classList.add('theme-anim');

    if (!skipAnimation && typeof doc.startViewTransition === 'function') {
      const transition = doc.startViewTransition(() => {
        commitDomChanges();
      });
      transition.finished.finally(() => {
        if (this.transitionId === currentId) {
          root.classList.remove('theme-anim');
        }
      });
      return;
    }

    commitDomChanges();
    this.animTimer =
      view?.setTimeout(() => {
        if (this.transitionId === currentId) {
          root.classList.remove('theme-anim');
        }
        this.animTimer = null;
      }, THEME_ANIMATION_MS) ?? null;
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
        this.apply();
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

  /** Un valor guardado fuera de la lista (de otra versión o editado a mano) cae al predeterminado. */
  private readStoredOption<T extends string>(key: string, options: readonly T[], fallback: T): T {
    const stored = this.storage.read<unknown>(key, null);
    return options.find((option) => option === stored) ?? fallback;
  }

  private readStoredFlag(key: string): boolean {
    return this.storage.read<unknown>(key, false) === true;
  }

  /**
   * `system` no se guarda, se elimina: la ausencia de la llave es exactamente
   * lo que el script de `index.html` interpreta como "seguir al sistema
   * operativo".
   */
  private persistTheme(theme: Theme): void {
    if (theme === 'system') {
      this.storage.remove(THEME_STORAGE_KEY);
    } else {
      this.storage.write(THEME_STORAGE_KEY, theme);
    }
  }
}
