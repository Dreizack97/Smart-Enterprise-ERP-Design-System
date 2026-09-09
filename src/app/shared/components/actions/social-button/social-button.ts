import { Component, input, output } from '@angular/core';

/** Inicio de sesión a través de un proveedor externo. El logo llega como imagen. */
@Component({
  selector: 'app-social-button',
  templateUrl: './social-button.html',
  styleUrl: './social-button.css',
})
export class SocialButton {
  /** Texto del botón, nombrando al proveedor de identidad. */
  readonly label = input.required<string>();

  /** Logo del proveedor, como URI `data:` en base64. */
  readonly iconSrc = input.required<string>();

  readonly pressed = output<void>();
}
