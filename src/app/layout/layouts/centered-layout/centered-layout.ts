import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * El marco para pantallas que son un solo panel sobre un fondo de marca:
 * iniciar sesión, recuperar contraseña, confirmar un código.
 *
 * Renombrado desde `auth-layout`. Nada en él es autenticación — es un panel
 * centrado con un campo de color detrás, y las pantallas de registro,
 * enlace expirado y mantenimiento quieren exactamente el mismo marco.
 * Nombrarlo por la primera pantalla que lo usó es lo que impedía que la
 * segunda lo reutilizara.
 *
 * No lleva navegación, deliberadamente: quien no ha iniciado sesión no debe
 * ver ni un fragmento del menú.
 */
@Component({
  selector: 'app-centered-layout',
  imports: [RouterOutlet],
  templateUrl: './centered-layout.html',
  styleUrl: './centered-layout.css',
})
export class CenteredLayout {}
