import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';

import { provideCore } from '@core/core-providers';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // `anchorScrolling` es lo que hace que funcionen las entradas de sección
      // del sidebar: cada página del catálogo es una familia, y el menú apunta
      // dentro de ellas.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      // Un cross-fade entre rutas, del navegador y no de una librería: las
      // páginas del catálogo son el mismo armazón con un cuerpo distinto, y
      // un corte seco hace que cada navegación se lea como una carga de
      // página. Cuánto dura y si ocurre siquiera se decide en CSS, junto al
      // resto de los tokens de movimiento — ahí es donde `prefers-reduced-motion`
      // lo apaga, en un solo lugar y no aquí en un segundo.
      withViewTransitions({ skipInitialTransition: true }),
    ),
    provideCore(),
  ],
};
