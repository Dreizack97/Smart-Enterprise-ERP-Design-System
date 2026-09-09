import { Component, computed, input } from '@angular/core';
import { ControlSize } from '@shared/models/size.model';

/**
 * Iniciales sobre un disco de color, para identificar a una persona en una
 * lista.
 *
 * La aplicación original obtenía estas imágenes de `ui-avatars.com`. Aquí se
 * dibujan en el navegador: un sistema de diseño no debería depender de un
 * tercero para pintar una tabla, y así se evita filtrarle una lista de
 * clientes a uno.
 *
 * El color se deriva del nombre, para que la misma persona conserve el suyo
 * entre recargas y entre pantallas.
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
})
export class Avatar {
  /** El nombre del que salen tanto las iniciales como el color de fondo. */
  readonly name = input.required<string>();

  /** Tamaño del disco, acorde a la densidad de donde se muestra. */
  readonly size = input<ControlSize>('md');

  /** Etiqueta accesible. Vacía junto a un nombre visible, que sería redundante. */
  readonly label = input('');

  protected readonly initials = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  /**
   * Un matiz estable derivado del nombre, oscurecido hasta que las iniciales
   * blancas sobre él superan WCAG AA.
   *
   * El original fijaba la luminosidad en 45% y afirmaba que eso mantenía el
   * contraste "sea cual sea el matiz resultante". No es así: a una sola
   * luminosidad, el brillo percibido de un matiz varía enormemente, y un
   * verde azulado medido dio **2.93:1** — una insignia de nombre que nadie
   * puede leer. Azul y morado pasaban, que es exactamente por qué a simple
   * vista se pasó por alto.
   *
   * Así que la luminosidad se resuelve en vez de asumirse: baja escalón por
   * escalón hasta que la luminancia relativa sea suficientemente baja para
   * 4.5:1 contra blanco. Determinista, para que la misma persona conserve su
   * color entre recargas y pantallas.
   */
  protected readonly color = computed(
    () => `hsl(${hueOf(this.name())} 55% ${LIGHTNESS_BY_HUE[hueOf(this.name())]}%)`,
  );
}

/** Un matiz estable en [0, 360) a partir del nombre. */
function hueOf(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 360;
  }
  return hash;
}

/** Blanco sobre un color necesita que ese color esté bajo esta luminancia relativa para lograr 4.5:1. */
const MAX_LUMINANCE = 0.175;

const SATURATION = 0.55;
const START_LIGHTNESS = 45;
const MIN_LIGHTNESS = 20;

/**
 * La luminosidad utilizable para cada matiz, resuelta una sola vez al cargar
 * el módulo.
 *
 * 360 entradas es un error de redondeo en memoria y saca por completo las
 * matemáticas de la ruta de renderizado.
 */
const LIGHTNESS_BY_HUE: readonly number[] = Array.from({ length: 360 }, (_, hue) => {
  for (let lightness = START_LIGHTNESS; lightness > MIN_LIGHTNESS; lightness -= 1) {
    if (relativeLuminance(hslToRgb(hue, SATURATION, lightness / 100)) <= MAX_LUMINANCE) {
      return lightness;
    }
  }
  return MIN_LIGHTNESS;
});

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = hue / 60;
  const second = chroma * (1 - Math.abs((sector % 2) - 1));
  const [r, g, b] = (
    [
      [chroma, second, 0],
      [second, chroma, 0],
      [0, chroma, second],
      [0, second, chroma],
      [second, 0, chroma],
      [chroma, 0, second],
    ] as const
  )[Math.floor(sector) % 6];
  const offset = lightness - chroma / 2;
  return [(r + offset) * 255, (g + offset) * 255, (b + offset) * 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}
