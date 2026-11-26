import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { IconName } from '@core/icons/lucide-icons';
import { ControlSize } from '@shared/models/size.model';
import { Icon } from '@shared/components/media/icon/icon';

/**
 * El rol que juega un botón. Ortogonal a `size`.
 *
 * El original soldaba los dos ejes — cada variante cargaba su propio padding,
 * y tres de seis no declaraban tamaño de fuente alguno — así que el mismo
 * botón medía distinto según dónde estuviera. Separarlos es lo que hace que
 * una barra de herramientas se alinee.
 *
 * No existe `gradient`: la variante de ese nombre pintaba un
 * `--color-primary-600` plano, exactamente igual que `primary`, y solo
 * diferían en el padding y en la escala de presión. Dos nombres para una
 * misma apariencia es justo la deriva que este sistema existe para evitar.
 */
export type ButtonVariant =
  'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'soft-danger' | 'link';

/**
 * Toda variante, en orden de catálogo. El showcase itera sobre esto.
 *
 * Una constante y no solo un tipo, por la misma razón que `ICON_NAMES` y
 * `CONTROL_SIZES`: una matriz de variantes escrita a mano queda obsoleta el
 * día que se agrega una variante, y nada se queja.
 */
export const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'soft',
  'ghost',
  'link',
  'danger',
  'soft-danger',
] as const satisfies readonly ButtonVariant[];

/** El atributo `type` del `<button>` nativo por debajo. */
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * El botón del sistema.
 *
 * Cada medida viene de los tokens de nivel 3 `--button-*`, no de una cadena
 * de clases de utilidad, así que la escala de tamaños está a una sola
 * edición de distancia.
 */
@Component({
  selector: 'app-button',
  imports: [Icon],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  /** El rol del botón: color y énfasis. */
  readonly variant = input<ButtonVariant>('primary');

  /** El tamaño del botón: altura, padding y escalón tipográfico. */
  readonly size = input<ControlSize>('md');

  /** Comportamiento nativo dentro de un formulario. */
  readonly type = input<ButtonType>('button');

  /** Icono mostrado antes del contenido proyectado. `null` lo omite. */
  readonly icon = input<IconName | null>(null);

  /** Icono mostrado después del contenido proyectado. `null` lo omite. */
  readonly iconAfter = input<IconName | null>(null);

  /** Hace que el botón ocupe todo el ancho de su contenedor. */
  readonly fullWidth = input(false, { transform: booleanAttribute });

  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Muestra un spinner y bloquea la interacción, sin colapsar el botón.
   *
   * La etiqueta se queda en su lugar y solo pierde opacidad: sustituirla por
   * un spinner cambiaría el ancho a mitad de clic y desplazaría lo que
   * estuviera a un lado.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Muestra éxito únicamente cuando la pantalla confirma el resultado de la operación. */
  readonly success = input(false, { transform: booleanAttribute });

  /** Sustituye la etiqueta visible durante el éxito; vacía conserva el contenido original. */
  readonly successLabel = input('¡Guardado!');

  /** Etiqueta accesible para un botón que solo muestra un icono. */
  readonly ariaLabel = input('');

  readonly pressed = output<MouseEvent>();

  protected readonly isSuccess = computed(() => !this.loading() && this.success());
  protected readonly successText = computed(() => this.successLabel().trim());
  /** Anuncia el resultado sin modificar el nombre accesible del botón. */
  protected readonly feedback = computed(() =>
    this.isSuccess() ? this.successText() || 'Operación completada' : '',
  );
  protected readonly inactive = computed(
    () => this.disabled() || this.loading() || this.isSuccess(),
  );

  /** El tamaño del icono escala con el botón, para que el emparejamiento nunca se vea mal. */
  protected readonly iconSize = computed(() => ICON_SIZES[this.size()]);

  protected onClick(event: MouseEvent): void {
    if (this.inactive()) {
      return;
    }
    this.pressed.emit(event);
  }
}

const ICON_SIZES: Record<ControlSize, number> = { sm: 14, md: 16, lg: 18 };
