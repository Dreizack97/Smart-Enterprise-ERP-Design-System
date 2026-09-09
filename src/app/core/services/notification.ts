import { Service } from '@angular/core';
import { toast } from 'ngx-sonner';

/**
 * Toasts globales, unificados a través de `ngx-sonner`.
 *
 * La única puerta por la que el sistema emite un toast: nunca se llama a
 * `toast` directamente, ni a `window.alert`. Una sola puerta significa que la
 * librería de toasts se puede cambiar sin tocar un solo componente.
 */
@Service()
export class Notifications {
  success(message: string, duration?: number): number | string {
    return toast.success(message, duration ? { duration } : undefined);
  }

  error(message: string, duration?: number): number | string {
    return toast.error(message, duration ? { duration } : undefined);
  }

  warning(message: string, duration?: number): number | string {
    return toast.warning(message, duration ? { duration } : undefined);
  }

  info(message: string, duration?: number): number | string {
    return toast.info(message, duration ? { duration } : undefined);
  }

  dismiss(id?: number | string): void {
    toast.dismiss(id);
  }
}
