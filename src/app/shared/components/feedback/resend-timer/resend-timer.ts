import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { Button } from '@shared/components/actions/button/button';

/**
 * Cuenta regresiva de espera con un botón de reenvío.
 *
 * Mientras corre la cuenta regresiva no hay botón alguno: solo el texto con
 * los segundos que faltan. El padre la reinicia cambiando `resetSignal`
 * (típicamente incrementando un contador) después de un reenvío exitoso.
 *
 * Existe para que ningún flujo que reenvíe un correo o un código deje a
 * alguien presionar sin límite: sin espera se obtienen tickets de soporte y
 * una puerta abierta a abusar del endpoint.
 */
@Component({
  selector: 'app-resend-timer',
  imports: [Button],
  templateUrl: './resend-timer.html',
  styleUrl: './resend-timer.css',
})
export class ResendTimer {
  /** Segundos de espera antes de permitir un nuevo envío. */
  readonly cooldownSeconds = input(60);

  /** El reenvío está en curso: el botón muestra su spinner. */
  readonly resending = input(false);

  /** Cambiar esto reinicia la cuenta regresiva. */
  readonly resetSignal = input(0);

  readonly label = input('Reenviar');

  readonly resend = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  protected readonly remaining = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      this.resetSignal();
      this.startCooldown(this.cooldownSeconds());
    });

    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  protected onResend(): void {
    if (this.remaining() === 0 && !this.resending()) {
      this.resend.emit();
    }
  }

  private startCooldown(seconds: number): void {
    this.clearTimer();
    this.remaining.set(Math.max(seconds, 0));

    if (seconds <= 0) {
      return;
    }

    this.timer = setInterval(() => {
      this.remaining.update((value) => {
        const next = value - 1;
        if (next <= 0) {
          this.clearTimer();
        }
        return Math.max(next, 0);
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
