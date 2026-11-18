import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { normalise } from '@shared/utils/text';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Una sugerencia autocompletable para `app-chip-input`. */
export interface ChipSuggestion {
  readonly value: string;
  readonly label: string;
  readonly sublabel?: string;
}

/**
 * Campo de entrada múltiple por etiquetas (chips) con autocompletado.
 *
 * Cumple el contrato `FormValueControl<readonly string[]>` de Signal Forms:
 * expone `value` como `model()` y acepta `errors`, `touched`, `disabled` y
 * `required`. Pensado para listas de destinatarios (`Para`, `CC`, `CCO`),
 * etiquetas de filtrado o dominios en listas blanca y negra.
 */
@Component({
  selector: 'app-chip-input',
  imports: [Field, Icon],
  templateUrl: './chip-input.html',
  styleUrl: './chip-input.css',
})
export class ChipInput {
  readonly value = model<readonly string[]>([]);
  readonly suggestions = input<readonly ChipSuggestion[]>([]);

  readonly label = input('');
  readonly placeholder = input('Agregar...');
  readonly hint = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly inputId = input(nextElementId('chip-input'));
  readonly ariaLabel = input('');

  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  protected readonly draft = signal('');
  protected readonly popupOpen = signal(false);

  private readonly control = useFormControl({
    id: this.inputId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  private readonly markTouched = this.control.onBlur;

  protected readonly filteredSuggestions = computed(() => {
    const query = normalise(this.draft().trim());
    const current = new Set(this.value());
    return this.suggestions().filter((item) => {
      if (current.has(item.value)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        normalise(item.label).includes(query) ||
        normalise(item.value).includes(query) ||
        (item.sublabel ? normalise(item.sublabel).includes(query) : false)
      );
    });
  });

  protected onDraftInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
    this.popupOpen.set(this.draft().trim().length > 0);
  }

  protected onFocus(): void {
    if (!this.disabled() && this.filteredSuggestions().length > 0 && this.draft().trim().length > 0) {
      this.popupOpen.set(true);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ',' || event.key === ';') {
      event.preventDefault();
      this.commitDraft();
      return;
    }

    if (event.key === 'Backspace' && this.draft() === '' && this.value().length > 0) {
      this.removeAt(this.value().length - 1);
      return;
    }

    if (event.key === 'Escape') {
      this.popupOpen.set(false);
    }
  }

  protected onHostBlur(): void {
    this.markTouched();
    // Diferido breve para permitir que un clic sobre una sugerencia se procese antes de cerrar.
    setTimeout(() => {
      if (this.draft().trim()) {
        this.commitDraft();
      }
      this.popupOpen.set(false);
    }, 150);
  }

  protected pickSuggestion(item: ChipSuggestion): void {
    if (this.disabled()) {
      return;
    }
    this.appendValue(item.value);
    this.draft.set('');
    this.popupOpen.set(false);
  }

  protected removeAt(index: number): void {
    if (this.disabled()) {
      return;
    }
    this.value.update((items) => items.filter((_, i) => i !== index));
  }

  private commitDraft(): void {
    const raw = this.draft()
      .split(/[,;\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (raw.length > 0) {
      for (const token of raw) {
        this.appendValue(token);
      }
    }
    this.draft.set('');
    this.popupOpen.set(false);
  }

  private appendValue(entry: string): void {
    this.value.update((items) => (items.includes(entry) ? items : [...items, entry]));
  }
}
