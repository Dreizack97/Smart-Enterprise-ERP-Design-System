import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Notifications } from '@core/services/notification';
import { Button } from '@shared/components/actions/button/button';
import { SocialButton } from '@shared/components/actions/social-button/social-button';
import { FormCard } from '@shared/components/containers/form-card/form-card';
import { Divider } from '@shared/components/containers/divider/divider';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Input } from '@shared/components/forms/input/input';
import { OtpInput } from '@shared/components/forms/otp-input/otp-input';
import { PasswordInput } from '@shared/components/forms/password-input/password-input';
import { PasswordStrengthMeter } from '@shared/components/forms/password-strength-meter/password-strength-meter';
import { ResendTimer } from '@shared/components/feedback/resend-timer/resend-timer';

/** Las tres pantallas de las que se compone un flujo de acceso. */
type AccessStep = 'signin' | 'signup' | 'verify';

/**
 * Una marca de proveedor neutral, dibujada aquí en vez de entregarse como
 * activo de marca.
 *
 * Un sistema de diseño no debería cargar el logo de alguien más para
 * demostrar la forma de un botón, y una plantilla que toma prestada la marca
 * de un proveedor real se lee como una integración que existe.
 */
function providerMark(hue: string, glyph: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">` +
    `<rect width="24" height="24" rx="6" fill="${hue}"/>` +
    `<text x="12" y="17" font-family="system-ui,sans-serif" font-size="13" font-weight="700" ` +
    `text-anchor="middle" fill="#ffffff">${glyph}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * **Plantilla Acceso** — una pantalla completa ensamblada solo con piezas del
 * sistema.
 *
 * Aquí no hay autenticación y no la debe haber: una plantilla muestra cómo
 * se ven las piezas cuando se juntan de verdad, y en el momento en que le
 * crece un servicio deja de ser una plantilla y se convierte en una
 * aplicación.
 *
 * Lleva **tres pasos**, no uno, y esa es una decisión que vale la pena
 * declarar. El plan lista `password-strength-meter` bajo esta plantilla, y
 * un medidor de fortaleza no tiene nada que hacer en un formulario de
 * inicio de sesión — nadie califica la fortaleza de una contraseña que
 * está escribiendo para volver a entrar. El medidor pertenece al paso de
 * registro, y el código de un solo uso pertenece al paso siguiente. Mostrar
 * los tres juntos es lo que un flujo de acceso realmente es; mostrar solo
 * el primero habría dejado a dos componentes sin un lugar honesto donde
 * vivir.
 */
@Component({
  selector: 'app-access',
  imports: [
    Button,
    Checkbox,
    Divider,
    FormCard,
    Input,
    OtpInput,
    PasswordInput,
    PasswordStrengthMeter,
    ResendTimer,
    SocialButton,
  ],
  templateUrl: './access.html',
  styleUrl: './access.css',
})
export class Access {
  private readonly notifications = inject(Notifications);
  private readonly router = inject(Router);

  protected readonly step = signal<AccessStep>('signin');

  protected readonly email = signal('');
  protected readonly fullName = signal('');
  protected readonly password = signal('');
  protected readonly remember = signal(true);
  protected readonly terms = signal(false);
  protected readonly code = signal('');
  protected readonly resending = signal(false);
  protected readonly resendReset = signal(0);
  protected readonly busy = signal(false);

  protected readonly providers = [
    { label: 'Continuar con el directorio corporativo', icon: providerMark('#2563eb', 'D') },
    { label: 'Continuar con certificado digital', icon: providerMark('#0d9488', 'C') },
  ];

  /** El medidor de fortaleza no debe usar el propio nombre de la persona en su contra. */
  protected readonly ownWords = computed(() =>
    [this.fullName(), this.email().split('@')[0]].filter(Boolean),
  );

  protected readonly title = computed(() =>
    this.step() === 'signup' ? 'Crear una cuenta' : 'Smart Enterprise',
  );

  protected go(step: AccessStep): void {
    this.step.set(step);
  }

  /** Todo aquí es un retraso y un toast: la plantilla no guarda lógica. */
  protected submit(next: AccessStep | null, message: string): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.notifications.info(message);
      if (next) {
        this.step.set(next);
      }
    }, 1200);
  }

  protected finish(): void {
    this.busy.set(true);
    setTimeout(() => {
      this.busy.set(false);
      this.notifications.success('Listo. Esto es una vitrina: no hay sesión.');
      void this.router.navigateByUrl('/inicio');
    }, 1200);
  }

  protected onResend(): void {
    this.resending.set(true);
    setTimeout(() => {
      this.resending.set(false);
      this.notifications.info('Código reenviado.');
    }, 1000);
  }
}
