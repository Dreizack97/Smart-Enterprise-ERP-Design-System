import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserStorage } from './browser-storage';

const TEST_KEY = 'seerp:test-storage';

describe('BrowserStorage', () => {
  let storage: BrowserStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(BrowserStorage);
    window.localStorage.removeItem(TEST_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.removeItem(TEST_KEY);
  });

  it('persiste, lee y elimina valores serializados en localStorage', () => {
    expect(storage.read(TEST_KEY, 'vacio')).toBe('vacio');

    storage.write(TEST_KEY, { count: 2 });
    expect(storage.read<{ count: number } | null>(TEST_KEY, null)).toEqual({ count: 2 });

    storage.remove(TEST_KEY);
    expect(storage.read(TEST_KEY, 'vacio')).toBe('vacio');
  });

  it('devuelve el respaldo cuando localStorage contiene JSON corrupto', () => {
    window.localStorage.setItem(TEST_KEY, '{invalido');
    expect(storage.read(TEST_KEY, ['respaldo'])).toEqual(['respaldo']);
  });

  it('conserva escrituras en memoria si setItem falla y permite resincronizar con clearPendingWrite', () => {
    storage.write(TEST_KEY, ['inicial']);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Cuota agotada', 'QuotaExceededError');
    });

    storage.write(TEST_KEY, ['en-memoria']);
    expect(storage.read(TEST_KEY, [])).toEqual(['en-memoria']);

    window.localStorage.setItem(TEST_KEY, JSON.stringify(['desde-otra-pestana']));
    storage.clearPendingWrite(TEST_KEY);
    expect(storage.read(TEST_KEY, [])).toEqual(['desde-otra-pestana']);
  });
});
