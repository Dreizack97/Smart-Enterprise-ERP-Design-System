import { Component, input } from '@angular/core';
import { Tone } from '@shared/models/tone.model';

/** Etiqueta compacta para una categoría o una prioridad. */
@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.css',
})
export class Badge {
  /** El matiz de la píldora, de la paleta de tonos compartida. */
  readonly tone = input<Tone>('neutral');
}
