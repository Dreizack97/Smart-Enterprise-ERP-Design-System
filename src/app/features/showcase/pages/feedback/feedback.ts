import { Component, inject, signal } from '@angular/core';
import { Notifications } from '@core/services/notification';
import { Button } from '@shared/components/actions/button/button';
import { Alert } from '@shared/components/feedback/alert/alert';
import { Badge } from '@shared/components/feedback/badge/badge';
import { EmptyState } from '@shared/components/feedback/empty-state/empty-state';
import { ErrorState } from '@shared/components/feedback/error-state/error-state';
import { Progress } from '@shared/components/feedback/progress/progress';
import { ResendTimer } from '@shared/components/feedback/resend-timer/resend-timer';
import { Skeleton } from '@shared/components/feedback/skeleton/skeleton';
import { StatusBadge } from '@shared/components/feedback/status-badge/status-badge';
import { STATUS_TONES } from '@shared/models/status-tone.model';
import { TONES } from '@shared/models/tone.model';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/** La etiqueta que cada estado lleva en la interfaz. */
const STATUS_LABELS: Record<string, string> = {
  success: 'Pagada',
  warning: 'Por vencer',
  danger: 'Rechazada',
  neutral: 'Borrador',
  info: 'En revisión',
};

/** Página de catálogo de la familia `feedback/`. */
@Component({
  selector: 'app-feedback',
  imports: [
    Alert,
    Badge,
    Button,
    EmptyState,
    ErrorState,
    Progress,
    ResendTimer,
    ShowcaseBlock,
    ShowcasePage,
    Skeleton,
    StatusBadge,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './feedback.html',
  styleUrl: './feedback.css',
})
export class Feedback {
  private readonly notifications = inject(Notifications);

  protected readonly statuses = STATUS_TONES;
  protected readonly tones = TONES;
  protected readonly labels = STATUS_LABELS;

  protected readonly dismissed = signal(false);
  protected readonly retrying = signal(false);
  protected readonly resending = signal(false);
  protected readonly resendReset = signal(0);
  protected readonly progress = signal(64);

  protected onDismiss(): void {
    this.dismissed.set(true);
    this.notifications.info('El aviso se cerró. Recarga el bloque para verlo otra vez.');
  }

  protected restore(): void {
    this.dismissed.set(false);
  }

  protected onRetry(): void {
    this.retrying.set(true);
    setTimeout(() => {
      this.retrying.set(false);
      this.notifications.error('Sigue sin haber conexión. Esto es una vitrina.');
    }, 1600);
  }

  protected onResend(): void {
    this.resending.set(true);
    setTimeout(() => {
      this.resending.set(false);
      this.notifications.success('Código reenviado.');
    }, 1200);
  }

  /** Reinicia la espera sin volver a montar el componente. */
  protected resetTimer(): void {
    this.resendReset.update((run) => run + 1);
  }

  protected nudgeProgress(): void {
    this.progress.update((value) => (value >= 100 ? 0 : Math.min(100, value + 18)));
  }
}
