import { EnvironmentProviders, LOCALE_ID, Provider, makeEnvironmentProviders } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { provideAppIcons } from '@core/icons/lucide-icons';

// La interfaz está en español: fechas, números y plurales deben seguirla.
registerLocaleData(localeEsMx);

/**
 * Todo lo que `core/` aporta al inyector, en un solo lugar.
 *
 * Los stores (`ThemeStore`, `LayoutStore`, `ActiveRoute`, `NotificationFeed`,
 * `ChartTheme`, `Notifications`) son `@Service()` y se proveen a sí mismos en
 * la raíz, así que no aparecen aquí. Solo se lista lo que necesita un
 * provider explícito.
 */
export function provideCore(): EnvironmentProviders {
  const providers: Provider[] = [provideAppIcons(), { provide: LOCALE_ID, useValue: 'es-MX' }];
  return makeEnvironmentProviders(providers);
}
