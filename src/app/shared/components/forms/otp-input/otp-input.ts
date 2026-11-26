import {
  Component,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';

/**
 * Código de verificación de un solo uso.
 *
 * Un solo campo, no una casilla por dígito: así funciona el autocompletado
 * del sistema operativo (`one-time-code`), y también funciona pegar el
 * código desde un correo. Las casillas separadas se ven mejor y se usan
 * mucho peor.
 */
@Component({
  selector: 'app-otp-input',
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.css',
})
export class OtpInput {
  /** El código completo. Un `model()`: se llena conforme se escribe. */
  readonly value = model('');

  /** Número de dígitos, y por lo tanto la longitud requerida del código. */
  readonly length = input(6, { transform: numberAttribute });

  /** Nombre accesible del campo. */
  readonly label = input('Código de verificación');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly inputId = input(nextElementId('otp'));

  /**
   * Enfoca el campo al aparecer. Solo para pantallas cuyo único propósito es
   * escribir el código; en cualquier otra, mover el foco desorienta.
   */
  readonly autofocus = input(false, { transform: booleanAttribute });

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  /**
   * Emitido una sola vez, al alcanzar la longitud requerida, con el código
   * completo. Existe para el auto-envío: el padre no tiene que observar
   * `value`.
   */
  readonly complete = output<string>();

  constructor() {
    afterNextRender(() => {
      if (this.autofocus() && !this.disabled()) {
        this.field().nativeElement.focus();
      }
    });
  }

  protected readonly placeholder = computed(() => '•'.repeat(this.length()));

  /** Anuncia el progreso sin leer los dígitos uno por uno. */
  protected readonly progress = computed(
    () => `${this.value().length} de ${this.length()} dígitos`,
  );

  /** Solo dígitos: escribir una letra ni siquiera debe llegar a aparecer. */
  protected onInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    const digits = field.value.replace(/\D/g, '').slice(0, this.length());
    if (field.value !== digits) {
      field.value = digits;
    }
    const wasIncomplete = this.value().length < this.length();
    this.value.set(digits);
    if (wasIncomplete && digits.length === this.length()) {
      this.complete.emit(digits);
    }
  }
}
