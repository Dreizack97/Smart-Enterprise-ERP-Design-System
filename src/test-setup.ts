// Configuración global del entorno de pruebas, cargada por `setupFiles` del builder `@angular/build:unit-test`.

// jsdom no implementa `matchMedia`, y tanto `ThemeStore` (preferencia de color del sistema)
// como ngx-sonner lo consultan al construirse: cualquier prueba que renderice `App` lo necesita.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
