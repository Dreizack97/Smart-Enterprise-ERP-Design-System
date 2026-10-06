import { Component, input } from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';
import { Icon } from '@shared/components/media/icon/icon';

/** Una regla de la política de contraseñas y si la contraseña escrita ya la cumple. */
export interface PasswordRequirement {
  readonly label: string;
  readonly met: boolean;
}

/**
 * La lista de reglas de una contraseña, marcadas conforme se cumplen.
 *
 * Complementa al medidor de fortaleza en vez de repetirlo: el medidor dice
 * qué tan difícil es adivinar la contraseña; esta lista dice qué le falta
 * para que el servidor la acepte. Un mensaje de error solo aparece al
 * terminar de escribir, y la lista avisa mientras se escribe.
 *
 * El componente no conoce la política: recibe las reglas ya evaluadas,
 * porque las reglas son del servidor de cada aplicación y no del sistema de
 * diseño.
 */
@Component({
  selector: 'app-password-requirements',
  imports: [Icon],
  templateUrl: './password-requirements.html',
  styleUrl: './password-requirements.css',
})
export class PasswordRequirements {
  /** Las reglas en el orden en que se muestran. */
  readonly requirements = input.required<readonly PasswordRequirement[]>();

  /** Encabezado de la lista. */
  readonly title = input('La contraseña debe contener:');

  protected readonly titleId = nextElementId('requirements');
}
