import { Component, booleanAttribute, input, output } from '@angular/core';
import { ControlSize } from '@shared/models/size.model';
import { nextElementId } from '@shared/utils/element-id';

/**
 * Interruptor de encendido/apagado.
 *
 * Un `<button role="switch">`, no un checkbox: el cambio aplica de
 * inmediato, sin nada que confirmar, que es exactamente lo que comunica
 * `switch`.
 *
 * El color de la pista y el recorrido de la perilla vienen de CSS
 * indexado por `[aria-checked]`. No agregar utilidades de color aquí:
 * duplicarían el estado.
 *
 * ## La etiqueta se ve, como en el resto de los controles
 *
 * Durante un tiempo la `label` solo llegaba al `aria-label` y nunca se
 * dibujaba, lo que dejaba al switch como la única excepción entre sus
 * hermanos —`checkbox`, `radio-group` y `field` muestran la suya y la
 * esconden con `labelHidden`—. En el catálogo no se notaba porque la matriz
 * de variantes nombra cada fila; en una lista de ajustes reales quedaban
 * tres interruptores sin decir qué encendían.
 *
 * El nombre accesible sale de ese mismo texto vía `aria-labelledby`, no de un
 * `aria-label` aparte: así lo que se ve y lo que se anuncia no pueden
 * discrepar. `<label for>` no serviría — solo apunta a controles de
 * formulario, y esto es un `<button role="switch">`.
 */
@Component({
  selector: 'app-toggle-switch',
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.css',
})
export class ToggleSwitch {
  /** Estado del interruptor recibido del componente contenedor. */
  readonly checked = input(false);

  /** Notifica cuando el usuario solicita alternar el interruptor. */
  readonly checkedChange = output<boolean>();

  /** El texto junto al interruptor, y su nombre accesible. */
  readonly label = input.required<string>();

  /**
   * Oculta la etiqueta a la vista sin quitársela a los lectores de pantalla.
   *
   * Para cuando algo alrededor ya nombra al control — la fila de una matriz de
   * variantes, el encabezado de una columna — y repetir el texto solo sería
   * ruido.
   */
  readonly labelHidden = input(false, { transform: booleanAttribute });

  /** Ata el texto con el botón, que es de dónde sale el nombre accesible. */
  readonly labelId = input(nextElementId('switch-label'));

  readonly size = input<ControlSize>('md');
  readonly disabled = input(false, { transform: booleanAttribute });

  protected toggle(): void {
    if (!this.disabled()) {
      this.checkedChange.emit(!this.checked());
    }
  }
}
