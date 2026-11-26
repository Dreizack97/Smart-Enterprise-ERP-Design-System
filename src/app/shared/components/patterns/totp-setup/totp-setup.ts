import { Component, computed, input } from '@angular/core';
import { CodeBlock } from '@shared/components/typography/code-block/code-block';

/** Caracteres por grupo al mostrar el secreto, para copiarlo a mano sin perderse. */
const SECRET_GROUP_SIZE = 4;

/** Presenta el QR y la clave Base32 que se usan para configurar una cuenta TOTP. */
@Component({
  selector: 'app-totp-setup',
  imports: [CodeBlock],
  templateUrl: './totp-setup.html',
  styleUrl: './totp-setup.css',
})
export class TotpSetup {
  /** El código QR como URI de datos, tal como lo devuelve el backend. */
  readonly qrCodeDataUri = input.required<string>();

  /** La clave en Base32, para quien no puede escanear el código. */
  readonly secret = input.required<string>();

  /** La clave en grupos de cuatro: `ABCD EFGH IJKL`. */
  protected readonly groupedSecret = computed(() =>
    (this.secret().match(new RegExp(`.{1,${SECRET_GROUP_SIZE}}`, 'g')) ?? []).join(' '),
  );
}
