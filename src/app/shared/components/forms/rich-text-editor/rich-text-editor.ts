import {
  Component,
  DOCUMENT,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { useFormControl } from '@shared/utils/form-control';
import { Field } from '@shared/components/forms/field/field';
import { Icon } from '@shared/components/media/icon/icon';

/** Comando de formato soportado por la barra del editor. */
export type RichTextCommand = 'bold' | 'italic' | 'underline' | 'insertUnorderedList';

/**
 * Editor de texto enriquecido ligero integrado con tokens de campo y tema.
 *
 * Cumple el contrato `FormValueControl<string>` de Signal Forms exponiendo
 * `value` como HTML estructurado. Acepta acciones adicionales en la barra
 * (`[toolbarEnd]`) y pie extensible (`[footer]`) para firma corporativa.
 */
@Component({
  selector: 'app-rich-text-editor',
  imports: [Field, Icon],
  templateUrl: './rich-text-editor.html',
  styleUrl: './rich-text-editor.css',
})
export class RichTextEditor {
  readonly value = model('');

  readonly label = input('');
  readonly placeholder = input('Escribe tu mensaje aquí...');
  readonly hint = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly inputId = input(nextElementId('rte'));
  readonly ariaLabel = input('');

  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  private readonly document = inject(DOCUMENT);
  private readonly surface = viewChild<ElementRef<HTMLElement>>('surface');

  private readonly control = useFormControl({
    id: this.inputId,
    error: this.error,
    errors: this.errors,
    touched: this.touched,
  });
  protected readonly errorId = this.control.errorId;
  protected readonly message = this.control.message;
  private readonly markTouched = this.control.onBlur;

  constructor() {
    afterRenderEffect(() => {
      const element = this.surface()?.nativeElement;
      const incoming = this.value();
      if (element && element.innerHTML !== incoming) {
        element.innerHTML = incoming;
      }
    });
  }

  protected applyFormat(command: RichTextCommand): void {
    if (this.disabled()) {
      return;
    }
    const element = this.surface()?.nativeElement;
    if (!element) {
      return;
    }
    element.focus();
    this.document.execCommand(command, false);
    this.syncValue();
  }

  protected onSurfaceInput(): void {
    this.syncValue();
  }

  protected onSurfaceBlur(): void {
    this.markTouched();
  }

  private syncValue(): void {
    const element = this.surface()?.nativeElement;
    if (element) {
      this.value.set(element.innerHTML);
    }
  }
}
