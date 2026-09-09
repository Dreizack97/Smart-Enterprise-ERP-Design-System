import { Component, computed, inject, input, resource } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Icon } from '@shared/components/media/icon/icon';
import { PasswordStrengthEvaluator } from './password-strength-evaluator';
import { PasswordScore, STRENGTH_LEVELS } from './password-strength.model';

/** Milisegundos de quietud antes de analizar. */
const ANALYSIS_DEBOUNCE_MS = 200;

/**
 * Medidor de fortaleza de contraseña.
 *
 * Analiza la contraseña con zxcvbn (cargado bajo demanda) y muestra una
 * barra de cinco segmentos, la etiqueta del nivel y, con `showFeedback`
 * activo, el tiempo estimado para romperla y sugerencias concretas.
 * Complementa la validación del formulario: informa, no bloquea.
 */
@Component({
  selector: 'app-password-strength-meter',
  imports: [Icon],
  templateUrl: './password-strength-meter.html',
  styleUrl: './password-strength-meter.css',
})
export class PasswordStrengthMeter {
  private readonly evaluator = inject(PasswordStrengthEvaluator);

  readonly password = input.required<string>();

  /** Datos del usuario (correo, nombre…) que arrastran el puntaje hacia abajo. */
  readonly userInputs = input<readonly string[]>([]);

  /** Reduce el medidor a la barra, sin advertencia ni sugerencias. */
  readonly showFeedback = input(true);

  private readonly debouncedPassword = toSignal(
    toObservable(this.password).pipe(debounceTime(ANALYSIS_DEBOUNCE_MS), distinctUntilChanged()),
    { initialValue: '' },
  );

  /** El `resource` descarta por su cuenta los análisis obsoletos. */
  private readonly strength = resource({
    params: () => ({ password: this.debouncedPassword(), userInputs: this.userInputs() }),
    loader: ({ params }) =>
      params.password.length === 0
        ? Promise.resolve(null)
        : this.evaluator.evaluate(params.password, params.userInputs),
    defaultValue: null,
  });

  /** Sin contraseña no hay nada que medir: el medidor se oculta por completo. */
  protected readonly hasPassword = computed(() => this.password().length > 0);

  /** Cubre tanto la descarga del diccionario como el cálculo en sí. */
  protected readonly analyzing = computed(
    () => this.hasPassword() && (this.strength.isLoading() || this.strength.value() === null),
  );

  /** El resultado ya asentado; `null` mientras se analiza, para que los dos nunca se mezclen. */
  protected readonly result = computed(() => (this.analyzing() ? null : this.strength.value()));

  protected readonly score = computed<PasswordScore>(() => this.strength.value()?.score ?? 0);

  protected readonly level = computed(() => STRENGTH_LEVELS[this.score()]);

  /** Un segmento por nivel; se rellenan los que llegan hasta el puntaje. */
  protected readonly segments = computed(() =>
    STRENGTH_LEVELS.map((_, index) => index <= this.score()),
  );
}
