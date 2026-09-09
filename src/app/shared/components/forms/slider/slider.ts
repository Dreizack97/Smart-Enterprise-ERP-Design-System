import {
  Component,
  booleanAttribute,
  computed,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { nextElementId } from '@shared/utils/element-id';
import { Field } from '@shared/components/forms/field/field';

/**
 * Un valor elegido a lo largo de un rango, para los casos donde el rango en
 * sí es la información: un monto máximo, un descuento, un umbral.
 *
 * Construido sobre `<input type="range">`. El navegador ya implementa el
 * arrastre, las flechas, Home/End, Re Pág/Av Pág y el anuncio del valor —
 * reimplementar eso con un div y un listener de puntero es cómo los
 * sliders terminan siendo inusables por teclado.
 *
 * ## La parte rellena de la pista
 *
 * Un range nativo pinta su pista de un solo color, y la convención que todo
 * mundo lee es que la parte detrás del control está rellena. No hay
 * pseudo-elemento estándar para eso, así que el relleno es un degradado
 * cuyo punto de corte gobierna una propiedad personalizada que este
 * componente mantiene en sincronía con el valor — la única pieza del
 * control que toma para sí.
 */
@Component({
  selector: 'app-slider',
  imports: [Field],
  templateUrl: './slider.html',
  styleUrl: './slider.css',
})
export class Slider {
  readonly value = model(0);

  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly step = input(1, { transform: numberAttribute });

  readonly label = input('');
  readonly hint = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly sliderId = input(nextElementId('slider'));

  /** Nombre accesible para un slider mostrado sin etiqueta visible. */
  readonly ariaLabel = input('');

  /** Unidad mostrada junto al valor, p. ej. «%» o «cajas». */
  readonly suffix = input('');

  /** Oculta la lectura, para un slider cuyo valor se muestra en otro lugar. */
  readonly showValue = input(true, { transform: booleanAttribute });

  /** El valor con su unidad, para la lectura y para `aria-valuetext`. */
  protected readonly display = computed(() => {
    const suffix = this.suffix();
    return suffix ? `${this.value()} ${suffix}` : `${this.value()}`;
  });

  /**
   * Cuánto de la pista está detrás del control, como porcentaje.
   *
   * Protegido contra `max === min`: un rango de ancho cero dividiría entre
   * cero y pintaría `NaN%`, que en silencio tira todo el degradado.
   */
  protected readonly progress = computed(() => {
    const span = this.max() - this.min();
    if (span <= 0) {
      return 0;
    }
    return ((this.value() - this.min()) / span) * 100;
  });

  protected onInput(event: Event): void {
    this.value.set(Number((event.target as HTMLInputElement).value));
  }
}
