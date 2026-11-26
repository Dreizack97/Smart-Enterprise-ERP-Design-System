import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { MotionPreference } from '@core/theme/motion-preference';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StatCard } from './stat-card';

describe('StatCard: animación de cifras', () => {
  let fixture: ComponentFixture<StatCard>;
  const reduced = signal(false);
  let now: number;
  let sequence: number;
  let frames: Map<number, FrameRequestCallback>;

  beforeEach(() => {
    vi.useFakeTimers();
    reduced.set(false);
    now = 0;
    sequence = 0;
    frames = new Map();
    vi.spyOn(window.performance, 'now').mockImplementation(() => now);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++sequence, callback);
      return sequence;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      frames.delete(id);
    });
    TestBed.configureTestingModule({
      imports: [StatCard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        { provide: LOCALE_ID, useValue: 'es-MX' },
        { provide: MotionPreference, useValue: { reduced } },
      ],
    });
    fixture = TestBed.createComponent(StatCard);
    fixture.componentRef.setInput('label', 'Productos');
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function frame(timestamp: number): void {
    now = timestamp;
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(timestamp));
    fixture.detectChanges();
  }

  function visibleValue(): string {
    return fixture.nativeElement.querySelector('.stat__value [aria-hidden]')?.textContent.trim();
  }

  it('anima hasta el valor final y mantiene estable la cifra accesible', () => {
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    expect(visibleValue()).toBe('0');
    expect(fixture.nativeElement.querySelector('.stat__value .sr-only').textContent).toBe('100');
    frame(375);
    expect(Number(visibleValue())).toBeGreaterThan(0);
    expect(Number(visibleValue())).toBeLessThan(100);
    frame(750);
    expect(visibleValue()).toBe('100');
    expect(frames.size).toBe(0);
  });

  it('continúa desde la cifra mostrada cuando llega una actualización durante el conteo', () => {
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    frame(200);
    const previous = Number(visibleValue());
    fixture.componentRef.setInput('value', 200);
    fixture.detectChanges();
    expect(visibleValue()).toBe(String(previous));
    expect(frames.size).toBe(1);
    frame(950);
    expect(visibleValue()).toBe('200');
  });

  it('preserva fechas y textos formateados sin interpretar sus números', () => {
    for (const value of ['2026-11-10', '1.234,56 €', '+12%', '—']) {
      fixture.componentRef.setInput('value', value);
      fixture.detectChanges();
      expect(visibleValue()).toBe(value);
      expect(frames.size).toBe(0);
    }
  });

  it('respeta negativos, cero y el formato monetario explícito', () => {
    fixture.componentRef.setInput('value', -12.5);
    fixture.componentRef.setInput('numberFormat', { style: 'currency', currency: 'MXN' });
    fixture.detectChanges();
    frame(750);
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    expect(visibleValue()).toBe(formatter.format(-12.5));
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    frame(1500);
    expect(visibleValue()).toBe(formatter.format(0));
  });

  it('cancela el conteo en curso al reducir movimiento y permite desactivar la animación', () => {
    fixture.componentRef.setInput('value', 20);
    fixture.detectChanges();
    expect(frames.size).toBe(1);
    reduced.set(true);
    fixture.detectChanges();
    expect(visibleValue()).toBe('20');
    expect(frames.size).toBe(0);
    reduced.set(false);
    fixture.componentRef.setInput('animatedValue', false);
    fixture.componentRef.setInput('value', 40);
    fixture.detectChanges();
    expect(visibleValue()).toBe('40');
    expect(frames.size).toBe(0);
  });

  it('retira fotogramas y temporizadores al destruir la tarjeta', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();
    expect(frames.size).toBe(1);
    fixture.destroy();
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancela una entrada escalonada antes de iniciar y descarta progresos anteriores', () => {
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('progress', 25);
    fixture.componentRef.setInput('index', 2);
    fixture.detectChanges();
    expect(frames.size).toBe(0);
    fixture.componentRef.setInput('progress', 75);
    fixture.detectChanges();
    vi.advanceTimersByTime(160);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.stat__fill').style.width).toBe('75%');
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),
    ).toBe('75');
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
    expect(frames.size).toBe(0);
  });
});
