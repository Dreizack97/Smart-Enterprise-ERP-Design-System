import { TestBed } from '@angular/core/testing';
import { provideCore } from '@core/core-providers';
import { TotpSetup } from './totp-setup';

describe('TotpSetup', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TotpSetup],
      providers: [provideCore()],
    });
  });

  it('muestra el QR y agrupa la clave para facilitar su lectura', () => {
    const fixture = TestBed.createComponent(TotpSetup);
    fixture.componentRef.setInput('qrCodeDataUri', 'data:image/png;base64,qr');
    fixture.componentRef.setInput('secret', 'ABCDEFGH123');
    fixture.detectChanges();

    const image = fixture.nativeElement.querySelector('.totp-setup__qr') as HTMLImageElement;
    const code = fixture.nativeElement.querySelector('code') as HTMLElement;

    expect(image.src).toContain('data:image/png;base64,qr');
    expect(image.alt).toBe('Código QR para agregar tu cuenta a la aplicación de autenticación');
    expect(code.textContent?.trim()).toBe('ABCD EFGH 123');
  });
});
