import { Service } from '@angular/core';
import type { PasswordScore, PasswordStrength } from './password-strength.model';

/** Firma mínima de `zxcvbnAsync`, para mantener sus tipos fuera del bundle. */
type ZxcvbnAsync = (
  password: string,
  userInputs?: readonly (string | number)[],
) => Promise<{
  score: number;
  feedback: { warning: string | null; suggestions: string[] };
  crackTimesDisplay: { offlineSlowHashing1e4PerSecond: string };
}>;

/**
 * Evalúa la fortaleza de una contraseña con zxcvbn.
 *
 * El motor y sus diccionarios pesan varios cientos de kilobytes, así que se
 * traen con un `import()` dinámico la primera vez que alguien pide una
 * evaluación, y se configuran una sola vez. Nada de zxcvbn entra al bundle
 * inicial.
 */
@Service()
export class PasswordStrengthEvaluator {
  private ready?: Promise<ZxcvbnAsync>;

  /**
   * @param password La contraseña a analizar.
   * @param userInputs Datos del usuario (correo, nombre…) que zxcvbn
   *   penaliza si aparecen dentro de la contraseña.
   */
  async evaluate(password: string, userInputs: readonly string[] = []): Promise<PasswordStrength> {
    const check = await this.loadEngine();
    const result = await check(password, userInputs);

    return {
      score: result.score as PasswordScore,
      warning: result.feedback.warning || null,
      suggestions: result.feedback.suggestions,
      crackTime: result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
    };
  }

  /** Siempre la misma promesa: los diccionarios se cargan una sola vez. */
  private loadEngine(): Promise<ZxcvbnAsync> {
    return (this.ready ??= this.createEngine());
  }

  private async createEngine(): Promise<ZxcvbnAsync> {
    const [core, common, spanish] = await Promise.all([
      import('@zxcvbn-ts/core'),
      import('@zxcvbn-ts/language-common'),
      import('@zxcvbn-ts/language-es-es'),
    ]);

    core.zxcvbnOptions.setOptions({
      translations: spanish.translations,
      graphs: common.adjacencyGraphs,
      dictionary: { ...common.dictionary, ...spanish.dictionary },
      // Detecta contraseñas a un par de caracteres de distancia de una palabra de diccionario.
      useLevenshteinDistance: true,
    });

    return core.zxcvbnAsync as unknown as ZxcvbnAsync;
  }
}
