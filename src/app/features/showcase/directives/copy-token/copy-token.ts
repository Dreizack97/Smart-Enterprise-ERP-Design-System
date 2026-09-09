import { DestroyRef, Directive, ElementRef, Renderer2, inject, input, signal } from '@angular/core';
import { copyText } from '@shared/utils/clipboard';

/** Cuánto dura visible la confirmación. Suficiente para leerla, poco para olvidarla. */
const FEEDBACK_MS = 1600;

/** Qué pasó en el último intento. */
type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copia el nombre de un token al portapapeles cuando se presiona su
 * muestra.
 *
 * Toda la promesa del catálogo es que un color en pantalla tiene un
 * nombre, y hasta ahora ese nombre solo se podía leer y volver a
 * teclear — la única operación que alguien hace con una muestra es
 * llevarse su token a una hoja de estilos. Seleccionar el texto era la
 * alternativa, y un `<span>` dentro de una cuadrícula no es cómodo de
 * seleccionar.
 *
 * ## Por qué exige un `<button>`
 *
 * El selector es `button[appCopyToken]`, así que no se puede aplicar a un
 * `<div>` que solo parece presionable. Una muestra que copia es un
 * control: necesita el teclado, el anillo de foco y el rol, y la forma
 * más barata de tener los tres bien es partir del elemento que ya los
 * tiene.
 *
 * ## Por qué anuncia el fallo
 *
 * `navigator.clipboard` necesita un contexto seguro y de todos modos el
 * navegador puede negarlo. Mostrar «copiado» en cualquier caso sería el
 * catálogo mintiendo sobre lo único para lo que existe, así que los dos
 * resultados dicen cosas distintas.
 */
@Directive({
  selector: 'button[appCopyToken]',
  host: {
    type: 'button',
    // La clase viene de la directiva y no de cada plantilla: una muestra
    // que copia siempre se ve presionable, y no hay forma de cablear una y
    // olvidarse del estilo.
    class: 'copyable',
    '(click)': 'copy()',
    '[attr.data-copy-state]': 'state() === "idle" ? null : state()',
  },
})
export class CopyToken {
  /** El nombre del token a poner en el portapapeles, p. ej. `--surface-1`. */
  readonly appCopyToken = input.required<string>();

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * La confirmación se anuncia a través de una región viva junto a la
   * muestra, no a través de un toast.
   *
   * Un toast por «copiado» roba atención para algo que quien lee acaba de
   * hacer, y setenta muestras encolarían setenta de ellos. Una región viva
   * lo dice una vez, donde ocurrió, y solo a quien necesita que se lo
   * digan.
   *
   * Se agrega JUNTO al botón y no adentro. El texto dentro de un botón es
   * parte del nombre accesible del botón, así que una región viva ahí
   * renombraría al control a «Copiar --surface-1 --surface-1 copiado» en
   * cuanto se disparara. El nombre viene de la propia etiqueta oculta del
   * botón, que escribe la plantilla; este elemento solo anuncia.
   */
  private readonly announcer = this.renderer.createElement('span') as HTMLElement;

  protected readonly state = signal<CopyState>('idle');
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.renderer.setAttribute(this.announcer, 'class', 'sr-only');
    this.renderer.setAttribute(this.announcer, 'aria-live', 'polite');
    this.renderer.appendChild(this.host.parentElement ?? this.host, this.announcer);

    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  protected async copy(): Promise<void> {
    const token = this.appCopyToken();
    const ok = await copyText(token);

    this.state.set(ok ? 'copied' : 'failed');
    this.announce(ok ? `${token} copiado` : `No se pudo copiar ${token}`);

    this.clearTimer();
    this.timer = setTimeout(() => {
      this.state.set('idle');
      this.announce('');
    }, FEEDBACK_MS);
  }

  private announce(message: string): void {
    this.renderer.setProperty(this.announcer, 'textContent', message);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
