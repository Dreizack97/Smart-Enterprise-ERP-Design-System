import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { ThemeStore } from '@core/theme/theme-store';

/**
 * La raíz de la aplicación.
 *
 * Contiene exactamente dos cosas: el marco enrutado y el toaster. Todo lo
 * que antes se andamiaba aquí ahora vive detrás de una ruta, que es lo que
 * "aplicación navegable con su armazón final" significa en la práctica.
 */
@Component({
  selector: 'app-root',
  imports: [NgxSonnerToaster, RouterOutlet],
  templateUrl: './app.html',
})
export class App {
  protected readonly theme = inject(ThemeStore);
}
