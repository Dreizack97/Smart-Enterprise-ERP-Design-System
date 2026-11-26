import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionPreference } from './motion-preference';
import { ThemeStore } from './theme-store';

describe('MotionPreference', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('combina cambios de preferencias y retira el listener al destruir el inyector', () => {
    const appReduced = signal(false);
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false, addEventListener, removeEventListener })),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
        { provide: ThemeStore, useValue: { reducedMotion: appReduced } },
      ],
    });
    const preference = TestBed.inject(MotionPreference);
    expect(preference.reduced()).toBe(false);
    appReduced.set(true);
    expect(preference.reduced()).toBe(true);
    appReduced.set(false);
    const listener = addEventListener.mock.calls[0][1] as (event: MediaQueryListEvent) => void;
    listener({ matches: true } as MediaQueryListEvent);
    expect(preference.reduced()).toBe(true);
    listener({ matches: false } as MediaQueryListEvent);
    expect(preference.reduced()).toBe(false);
    TestBed.resetTestingModule();
    expect(removeEventListener).toHaveBeenCalledExactlyOnceWith('change', listener);
  });
});
