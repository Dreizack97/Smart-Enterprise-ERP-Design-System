import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { ThemeStore } from '@core/theme/theme-store';
import { DarkPalette, LightPalette } from '@core/theme/theme.model';
import { SegmentedControl } from '@shared/components/actions/segmented-control/segmented-control';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { RadioGroup } from '@shared/components/forms/radio-group/radio-group';
import { ToggleSwitch } from '@shared/components/forms/toggle-switch/toggle-switch';
import { Icon } from '@shared/components/media/icon/icon';
import {
  DARK_PALETTE_OPTIONS,
  LIGHT_PALETTE_OPTIONS,
  SURFACE_STYLE_OPTIONS,
  THEME_OPTIONS,
  UI_SCALE_OPTIONS,
  findOption,
} from '../profile-preferences-options';

/** Un aviso que se puede encender o apagar en la vitrina. */
interface Notice {
  readonly key: string;
  readonly label: string;
  readonly enabled: WritableSignal<boolean>;
}

/**
 * Pestaña «Preferencias» de la plantilla Perfil: tema, estilo visual (plano o cristal),
 * paletas clara y oscura, escala de la interfaz y ajustes de accesibilidad conectados a `ThemeStore`.
 */
@Component({
  selector: 'app-profile-preferences',
  imports: [Icon, RadioGroup, SectionCard, SegmentedControl, ToggleSwitch],
  templateUrl: './profile-preferences.html',
  styleUrl: './profile-preferences.css',
})
export class ProfilePreferences {
  protected readonly theme = inject(ThemeStore);

  protected readonly themeOptions = THEME_OPTIONS;
  protected readonly surfaceStyleOptions = SURFACE_STYLE_OPTIONS;
  protected readonly scaleOptions = UI_SCALE_OPTIONS;
  protected readonly lightPaletteOptions = LIGHT_PALETTE_OPTIONS;
  protected readonly darkPaletteOptions = DARK_PALETTE_OPTIONS;

  protected readonly notices: readonly Notice[] = [
    { key: 'digest', label: 'Resumen diario por correo', enabled: signal(true) },
    { key: 'stock', label: 'Alertas de inventario bajo', enabled: signal(true) },
    { key: 'weekly', label: 'Reporte semanal del área', enabled: signal(false) },
  ];

  protected readonly currentPaletteOptions = computed(() =>
    this.theme.isDark() ? this.darkPaletteOptions : this.lightPaletteOptions,
  );

  protected isPaletteActive(value: string): boolean {
    return this.theme.isDark()
      ? this.theme.darkPalette() === value
      : this.theme.lightPalette() === value;
  }

  protected onPaletteChange(value: string): void {
    if (this.theme.isDark()) {
      this.theme.setDarkPalette(value as DarkPalette);
    } else {
      this.theme.setLightPalette(value as LightPalette);
    }
  }

  protected onThemeChange(value: string): void {
    const theme = findOption(THEME_OPTIONS, value);
    if (theme) this.theme.set(theme);
  }

  protected onSurfaceStyleChange(value: string): void {
    const style = findOption(SURFACE_STYLE_OPTIONS, value);
    if (style) this.theme.setSurfaceStyle(style);
  }

  protected onScaleChange(value: string): void {
    const scale = findOption(UI_SCALE_OPTIONS, value);
    if (scale) this.theme.setUiScale(scale);
  }
}
