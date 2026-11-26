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
  private readonly pendingWrites = new Set<string>();

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
    this.persist(key, raw);
  }

  remove(key: string): void {
    this.fallback.delete(key);
    this.persist(key, null);
  }

  /** Descarta escrituras pendientes en memoria para resincronizar con `localStorage`. */
  clearPendingWrite(key?: string): void {
    if (key === undefined) {
      this.pendingWrites.clear();
      return;
    }
    this.pendingWrites.delete(key);
  }

  private persist(key: string, raw: string | null): void {
    try {
      const storage = this.document.defaultView?.localStorage;
      if (storage) {
        if (raw === null) storage.removeItem(key);
        else storage.setItem(key, raw);
        this.pendingWrites.delete(key);
        return;
      }
    } catch {
      // Si la escritura falla, la copia local tiene prioridad sobre el valor anterior.
    }
    this.pendingWrites.add(key);
  }

  private readRaw(key: string): string | null {
    if (this.pendingWrites.has(key)) return this.fallback.get(key) ?? null;

    try {
      const value = this.document.defaultView?.localStorage.getItem(key);
      if (value !== undefined) {
        if (value === null) this.fallback.delete(key);
        else this.fallback.set(key, value);
        return value;
      }
    } catch {
      // Si el almacenamiento falla al leer, se utiliza la copia en memoria.
    }
    return this.fallback.get(key) ?? null;
  }
}
