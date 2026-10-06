import { Component, computed, inject } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { ThemeStore } from '@core/theme/theme-store';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * El interruptor de tema claro y oscuro, por su cuenta.
 *
 * La barra superior trae el suyo; las pantallas que no tienen barra —
 * iniciar sesión, recuperar la contraseña, una página no encontrada —
 * necesitaban otro, o el tema solo podía cambiarse después de entrar.
 *
 * Es un botón redondo y elevado, pensado para flotar sobre el fondo de
 * marca. Dónde se coloca es decisión del layout que lo usa.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.css',
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeStore);

  /** El icono anuncia el tema al que se cambia, no el actual. */
  protected readonly icon = computed<IconName>(() => (this.theme.isDark() ? 'sun' : 'moon'));
}
