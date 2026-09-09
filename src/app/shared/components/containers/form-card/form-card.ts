import { Component, input } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * El panel centrado de una pantalla de inicio de sesión, registro o
 * recuperación.
 *
 * Renombrado desde `auth-card`: nada en él es específico de autenticación.
 * Es la forma que toma un formulario corto y autónomo cuando es lo único en
 * la página — una marca, un encabezado, los campos, y un pie con enlaces
 * secundarios.
 *
 * Solo el panel: el fondo pertenece a `centred-layout`. Mantenerlos separados
 * permite que varias pantallas de un flujo compartan un solo fondo sin
 * volver a animarlo en cada navegación.
 */
@Component({
  selector: 'app-form-card',
  imports: [Icon],
  templateUrl: './form-card.html',
  styleUrl: './form-card.css',
})
export class FormCard {
  /** Nombre del producto mostrado bajo el logo. */
  readonly brand = input('Smart Enterprise');

  /**
   * Una línea bajo la marca. Vacío omite el párrafo por completo.
   *
   * Antes se renderizaba sin importar el valor, así que una tarjeta sin
   * lema pagaba de todos modos su caja de línea y su margen superior — una
   * franja vacía bajo la marca que se leía como error y no como decisión.
   */
  readonly tagline = input('Sistema de Gestión Empresarial');

  /** Icono usado como logo. */
  readonly logoIcon = input<IconName>('chart-line');

  /**
   * Nivel del encabezado de la marca: `1` cuando la tarjeta ES la pantalla,
   * `2` cuando vive dentro de una página que ya tiene su propio encabezado.
   *
   * Era un `<h1>` fijo. Eso es correcto para una pantalla de inicio de
   * sesión e incorrecto en cualquier otro lugar — la página del catálogo
   * terminó con tres encabezados de primer nivel, y la lista de encabezados
   * de un lector de pantalla dejó de describir jerarquía alguna.
   */
  readonly headingLevel = input<1 | 2>(1);
}
