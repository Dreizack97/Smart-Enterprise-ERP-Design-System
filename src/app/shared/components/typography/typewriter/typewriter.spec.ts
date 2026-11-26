import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Typewriter } from './typewriter';

describe('Typewriter: texto accesible y animación por sesión', () => {
  const sessionKey = 'erp_welcome_animated';
  let previousSessionValue: string | null;

  beforeEach(async () => {
    previousSessionValue = sessionStorage.getItem(sessionKey);
    sessionStorage.removeItem(sessionKey);
    await TestBed.configureTestingModule({
      imports: [Typewriter],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousSessionValue === null) {
      sessionStorage.removeItem(sessionKey);
    } else {
      sessionStorage.setItem(sessionKey, previousSessionValue);
    }
  });

  /** Monta el componente mediante sus entradas públicas sin inspeccionar señales internas. */
  function render(text = 'Hola, Ana', animate?: boolean): ComponentFixture<Typewriter> {
    const fixture = TestBed.createComponent(Typewriter);
    fixture.componentRef.setInput('text', text);
    if (animate !== undefined) fixture.componentRef.setInput('animate', animate);
    fixture.detectChanges();
    return fixture;
  }

  it('ofrece el texto completo desde el primer render y oculta las copias decorativas a la accesibilidad', () => {
    const fixture = render();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.typewriter-text')?.textContent).toBe('Hola, Ana');
    expect(root.querySelectorAll('.typewriter-text')).toHaveLength(1);
    expect(root.querySelector('.typewriter-revealer')?.closest('[aria-hidden="true"]')).toBeNull();
    expect(root.querySelector('.typewriter-ghost')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.typewriter-cursor')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('anima una sola vez en el modo automático aunque la vista se vuelva a montar', () => {
    const first = render();
    expect(first.nativeElement.querySelector('.typewriter-revealer')).not.toBeNull();
    first.destroy();
    const second = render();
    expect(second.nativeElement.querySelector('.typewriter-revealer')).toBeNull();
    expect(second.nativeElement.textContent?.trim()).toBe('Hola, Ana');
  });

  it('muestra texto estático si otra vista ya consumió la animación automática en esta sesión', () => {
    sessionStorage.setItem(sessionKey, 'true');
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).toBeNull();
    expect(fixture.nativeElement.textContent?.trim()).toBe('Hola, Ana');
  });

  it('permite forzar la animación aunque ya se haya mostrado durante la sesión', () => {
    sessionStorage.setItem(sessionKey, 'true');
    const fixture = render('Bienvenida, Ana', true);
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.typewriter-text')?.textContent).toBe(
      'Bienvenida, Ana',
    );
  });

  it('respeta el modo estático explícito sin mostrar cursor ni capa animada', () => {
    const fixture = render('Hola, Ana', false);
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).toBeNull();
    expect(fixture.nativeElement.querySelector('.typewriter-cursor')).toBeNull();
    expect(fixture.nativeElement.textContent?.trim()).toBe('Hola, Ana');
  });

  it('no consume la animación automática al mostrar una instancia explícitamente estática', () => {
    const first = render('Texto estático', false);
    first.destroy();
    const automatic = render();
    expect(automatic.nativeElement.querySelector('.typewriter-revealer')).not.toBeNull();
  });

  it('actualiza el texto y su espacio reservado sin conservar el contenido anterior', () => {
    const fixture = render('Ana', true);
    fixture.componentRef.setInput('text', 'María Elena');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.typewriter-text')?.textContent).toBe('María Elena');
    expect(root.querySelector('.typewriter-ghost')?.textContent).toBe('María Elena');
    expect(
      root
        .querySelector<HTMLElement>('.typewriter-revealer')
        ?.style.getPropertyValue('--char-count'),
    ).toBe('11');
    expect(
      root.querySelector<HTMLElement>('.typewriter-cursor')?.style.getPropertyValue('--char-count'),
    ).toBe('11');
  });

  it('permite alternar el modo explícito sin duplicar ni perder el texto', () => {
    const fixture = render('Hola, Ana', false);
    fixture.componentRef.setInput('animate', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).not.toBeNull();
    fixture.componentRef.setInput('animate', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.typewriter-text')).toHaveLength(1);
    expect(fixture.nativeElement.textContent?.trim()).toBe('Hola, Ana');
  });

  it.each(['getItem', 'setItem'] as const)(
    'conserva el texto cuando el navegador rechaza sessionStorage.%s',
    (method) => {
      vi.spyOn(Storage.prototype, method).mockImplementation(() => {
        throw new DOMException('Almacenamiento no disponible', 'SecurityError');
      });
      let fixture: ComponentFixture<Typewriter> | undefined;
      expect(() => {
        fixture = render();
      }).not.toThrow();

      expect(fixture?.nativeElement.querySelector('.typewriter-text')?.textContent).toBe(
        'Hola, Ana',
      );
    },
  );

  it('maneja cadenas vacías y emojis sin romper el cálculo de caracteres ni el espacio reservado', () => {
    const fixture = render('¡Hola, Ana! 👋', true);
    const root = fixture.nativeElement as HTMLElement;
    const revealer = root.querySelector<HTMLElement>('.typewriter-revealer');
    const ghost = root.querySelector('.typewriter-ghost');

    expect(ghost?.textContent).toBe('¡Hola, Ana! 👋');
    expect(revealer?.textContent?.trim()).toBe('¡Hola, Ana! 👋');
    expect(revealer?.style.getPropertyValue('--char-count')).toBe(String('¡Hola, Ana! 👋'.length));

    fixture.componentRef.setInput('text', '');
    fixture.detectChanges();
    expect(root.querySelector('.typewriter-ghost')?.textContent).toBe('');
    expect(
      root
        .querySelector<HTMLElement>('.typewriter-revealer')
        ?.style.getPropertyValue('--char-count'),
    ).toBe('0');
  });

  it('mantiene sincronizada la variable CSS --char-count entre el revelador y el cursor', () => {
    const fixture = render('Smart Enterprise ERP', true);
    const root = fixture.nativeElement as HTMLElement;
    const revealer = root.querySelector<HTMLElement>('.typewriter-revealer');
    const cursor = root.querySelector<HTMLElement>('.typewriter-cursor');

    const expectedLength = 'Smart Enterprise ERP'.length.toString();
    expect(revealer?.style.getPropertyValue('--char-count')).toBe(expectedLength);
    expect(cursor?.style.getPropertyValue('--char-count')).toBe(expectedLength);
  });

  it('garantiza que el cursor y el texto fantasma estén ocultos a tecnologías de asistencia', () => {
    const fixture = render('Bienvenido', true);
    const root = fixture.nativeElement as HTMLElement;

    const cursor = root.querySelector('.typewriter-cursor');
    const ghost = root.querySelector('.typewriter-ghost');
    const visibleText = root.querySelector('.typewriter-revealer .typewriter-text');

    expect(cursor?.getAttribute('aria-hidden')).toBe('true');
    expect(ghost?.getAttribute('aria-hidden')).toBe('true');
    expect(visibleText?.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('mantiene la sesión consumida si una instancia automática cambia a estática y regresa a automática', () => {
    const fixture = render('Hola, Ana');
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).not.toBeNull();

    fixture.componentRef.setInput('animate', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).toBeNull();

    fixture.componentRef.setInput('animate', undefined);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.typewriter-revealer')).toBeNull();
    expect(fixture.nativeElement.querySelector('.typewriter-text')?.textContent).toBe('Hola, Ana');
  });
});
