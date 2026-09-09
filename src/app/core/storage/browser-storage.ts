import { DOCUMENT, Service, inject } from '@angular/core';

/**
 * Acceso tolerante a fallos a `localStorage`.
 *
 * En modo privado, con el almacenamiento deshabilitado, o al agotarse la
 * cuota, `localStorage` lanza una excepción. Perder una preferencia guardada
 * nunca debe tumbar una pantalla, así que se degrada a estado en memoria para
 * la sesión actual.
 */
@Service()
export class BrowserStorage {
  private readonly document = inject(DOCUMENT);

  /** Respaldo para cuando el navegador se niega a persistir. */
  private readonly fallback = new Map<string, string>();

  read<T>(key: string, fallbackValue: T): T {
    const raw = this.readRaw(key);
    if (raw === null) {
      return fallbackValue;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Valor corrupto de una versión anterior: se descarta en silencio.
      return fallbackValue;
    }
  }

  write(key: string, value: unknown): void {
    const raw = JSON.stringify(value);
    this.fallback.set(key, raw);
    try {
      this.document.defaultView?.localStorage.setItem(key, raw);
    } catch {
      /* se conserva en memoria solo para esta sesión */
    }
  }

  remove(key: string): void {
    this.fallback.delete(key);
    try {
      this.document.defaultView?.localStorage.removeItem(key);
    } catch {
      /* no hay nada más que hacer */
    }
  }

  private readRaw(key: string): string | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(key);
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      /* continúa hacia la copia en memoria */
    }
    return this.fallback.get(key) ?? null;
  }
}
