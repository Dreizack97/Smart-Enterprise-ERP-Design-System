import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from './copy-button';

describe('CopyButton', () => {
  let fixture: ComponentFixture<CopyButton>;
  let writeText: ReturnType<typeof vi.fn>;
  let clipboardDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    TestBed.configureTestingModule({
      imports: [CopyButton],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    });
    fixture = TestBed.createComponent(CopyButton);
    fixture.componentRef.setInput('text', 'ABC-123');
    fixture.componentRef.setInput('label', 'Copiar identificador');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    if (clipboardDescriptor) Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  }

  it('espera la confirmación y bloquea solicitudes duplicadas mientras el portapapeles está pendiente', async () => {
    let finish!: () => void;
    writeText.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    button().click();
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('pending');
    expect(button().classList.contains('copy--copied')).toBe(false);
    button().click();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('ABC-123');

    finish();
    await settle();
    expect(button().disabled).toBe(false);
    expect(button().classList.contains('copy--copied')).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe(
      'Copiado al portapapeles',
    );
    expect(button().getAttribute('aria-label')).toBe('Copiar identificador');
  });

  it('comunica la negativa del portapapeles y permite reintentar sin mostrar éxito', async () => {
    writeText.mockRejectedValueOnce(new DOMException('Acceso denegado', 'NotAllowedError'));
    button().click();
    await settle();
    expect(button().classList.contains('copy--copied')).toBe(false);
    expect(button().classList.contains('copy--error')).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'No se pudo copiar',
    );

    button().click();
    await settle();
    expect(writeText).toHaveBeenCalledTimes(2);
    expect(button().classList.contains('copy--copied')).toBe(true);
  });

  it('comunica el fallo cuando el navegador no ofrece portapapeles', async () => {
    Reflect.deleteProperty(navigator, 'clipboard');
    button().click();
    await settle();
    expect(button().classList.contains('copy--error')).toBe(true);
    expect(button().classList.contains('copy--copied')).toBe(false);
  });

  it('copia el contenido exacto y deshabilita valores vacíos', async () => {
    fixture.componentRef.setInput('text', '  A\nB  ');
    fixture.detectChanges();
    button().click();
    await settle();
    expect(writeText).toHaveBeenCalledExactlyOnceWith('  A\nB  ');

    fixture.componentRef.setInput('text', '   ');
    fixture.detectChanges();
    expect(button().disabled).toBe(true);
    button().click();
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
  });

  it('descarta una respuesta anterior cuando la celda ya presenta otro valor', async () => {
    let rejectOld!: (reason: Error) => void;
    writeText.mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectOld = reject;
      }),
    );
    button().click();
    fixture.componentRef.setInput('text', 'Nuevo valor');
    fixture.detectChanges();
    expect(button().disabled).toBe(false);
    button().click();
    await settle();
    expect(writeText).toHaveBeenLastCalledWith('Nuevo valor');
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('copied');

    rejectOld(new Error('Respuesta tardía'));
    await settle();
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('copied');
    expect(button().classList.contains('copy--error')).toBe(false);
  });

  it('retira la confirmación al vencer el plazo y limpia su temporizador al destruirse', async () => {
    button().click();
    await settle();
    vi.advanceTimersByTime(1600);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-state')).toBe('idle');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');

    button().click();
    await settle();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('no crea temporizadores si la respuesta llega después de destruir el control', async () => {
    let finish!: () => void;
    writeText.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    button().click();
    fixture.destroy();
    const pendingTimers = vi.getTimerCount();
    const schedule = vi.spyOn(globalThis, 'setTimeout');
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(schedule).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(pendingTimers);
  });
});
