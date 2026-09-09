import { Component, booleanAttribute, computed, input, model, signal } from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Para qué contraseña es este campo, para que el navegador ofrezca el autocompletado correcto. */
export type PasswordAutocomplete = 'current-password' | 'new-password' | 'off';

/**
 * Campo de contraseña con botón para revelarla.
 *
 * El estado de revelado es interno: es una ayuda momentánea para comprobar
 * lo que se escribió, no un dato que el formulario deba conocer ni
 * persistir.
 */
@Component({
  selector: 'app-password-input',
  imports: [Field, Icon],
  templateUrl: './password-input.html',
  styleUrl: './password-input.css',
})
export class PasswordInput {
  readonly value = model('');
  readonly label = input('Contraseña');
  readonly placeholder = input('••••••••');
  readonly hint = input('');

  /**
   * Un campo de inicio de sesión y uno de registro son distintos para un
   * gestor de contraseñas. Equivocarse aquí hace que se ofrezca la
   * contraseña guardada justo donde se está eligiendo una nueva.
   */
  readonly autocomplete = input<PasswordAutocomplete>('current-password');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly inputId = input(nextElementId('password'));
  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  protected readonly revealed = signal(false);

  private readonly control = useFormControl({
    id: this.inputId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  protected readonly onBlur = this.control.onBlur;

  protected readonly toggleLabel = computed(() =>
    this.revealed() ? 'Ocultar contraseña' : 'Mostrar contraseña',
  );

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
  }

  protected onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}
