import { Component, input } from '@angular/core';
import { Avatar } from '@shared/components/media/avatar/avatar';

/** Dato rápido clave-valor en la columna capitular de una cuenta. */
export interface IdentityFact {
  readonly label: string;
  readonly value: string;
}

/**
 * Disposición de ficha de identidad en dos columnas: tarjeta capitular a la
 * izquierda (avatar, nombre, correo/usuario, insignias y metadatos) y rejilla
 * de campos/secciones a la derecha.
 */
@Component({
  selector: 'app-identity-card',
  imports: [Avatar],
  templateUrl: './identity-card.html',
  styleUrl: './identity-card.css',
})
export class IdentityCard {
  readonly name = input.required<string>();
  readonly subtitle = input('');
  readonly facts = input<readonly IdentityFact[]>([]);
}
