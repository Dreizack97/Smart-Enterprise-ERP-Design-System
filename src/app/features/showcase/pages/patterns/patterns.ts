import { Component, signal } from '@angular/core';
import { Button } from '@shared/components/actions/button/button';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { AttachmentChip } from '@shared/components/patterns/attachment-chip/attachment-chip';
import { CalendarCell } from '@shared/components/patterns/calendar-cell/calendar-cell';
import {
  ChecklistItem,
  ChecklistMeta,
} from '@shared/components/patterns/checklist-item/checklist-item';
import {
  IdentityCard,
  IdentityFact,
} from '@shared/components/patterns/identity-card/identity-card';
import { MediaCard } from '@shared/components/patterns/media-card/media-card';
import { MessageRow } from '@shared/components/patterns/message-row/message-row';
import { SafeContentViewer } from '@shared/components/patterns/safe-content-viewer/safe-content-viewer';
import { ScheduleCard } from '@shared/components/patterns/schedule-card/schedule-card';
import { ScheduleChip } from '@shared/components/patterns/schedule-chip/schedule-chip';
import {
  TimeGrid,
  TimeGridColumn,
  TimeGridEntry,
} from '@shared/components/patterns/time-grid/time-grid';
import { TotpSetup } from '@shared/components/patterns/totp-setup/totp-setup';
import { TONES, Tone } from '@shared/models/tone.model';
import { DaySlot, WEEKDAY_HEADINGS, monthGrid, monthTitle } from '@shared/utils/calendar';

interface CalendarEntry {
  readonly label: string;
  readonly tone: Tone;
}

/** Un día de la cuadrícula compartida, más las entradas de ejemplo que esta demo le cuelga. */
interface CalendarSlot extends DaySlot {
  readonly entries: readonly CalendarEntry[];
}

/**
 * Entradas de ejemplo estáticas, indexadas por día del mes.
 *
 * Solo se usan los días del 1 al 28, para que la muestra esté completa
 * tanto en febrero como en un mes de 31 días; la entrada de fin de mes se
 * coloca por número al construirse.
 */
const SAMPLE_ENTRIES: ReadonlyMap<number, readonly CalendarEntry[]> = new Map([
  [2, [{ label: 'Alta de proveedores', tone: 'blue' }]],
  [
    4,
    [
      { label: 'Auditoría de almacén', tone: 'orange' },
      { label: 'Junta de ventas', tone: 'purple' },
    ],
  ],
  [6, [{ label: 'Corte de caja', tone: 'red' }]],
  [9, [{ label: 'Inventario cíclico', tone: 'green' }]],
  [11, [{ label: 'Revisión de crédito', tone: 'blue' }]],
  [
    13,
    [
      { label: 'Cierre contable', tone: 'blue' },
      { label: 'Comité de precios', tone: 'purple' },
      { label: 'Pago a proveedores', tone: 'orange' },
    ],
  ],
  [17, [{ label: 'Capacitación', tone: 'green' }]],
  [19, [{ label: 'Conciliación bancaria', tone: 'blue' }]],
  [
    23,
    [
      { label: 'Inventario físico', tone: 'green' },
      { label: 'Mantenimiento', tone: 'yellow' },
    ],
  ],
  [26, [{ label: 'Facturación quincenal', tone: 'orange' }]],
  [28, [{ label: 'Nómina', tone: 'purple' }]],
]);

/**
 * La cuadrícula de mes compartida, con las entradas de ejemplo de esta demo
 * colgadas de cada día.
 *
 * La distribución en sí — cuántos días de encabezado, dónde se cortan las
 * semanas, qué día es hoy — es `monthGrid` en `shared/utils/calendar`, la
 * misma que dibujan ambos pickers de fecha. Lo que se queda aquí es lo
 * único particular de la demo: qué se escribe dentro de las casillas.
 */
function buildMonth(reference: Date): readonly (readonly CalendarSlot[])[] {
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();

  return monthGrid(reference).map((week) =>
    week.map((slot) => ({
      ...slot,
      // Un día de un mes vecino se muestra, nunca se llena: las entradas
      // pertenecen al mes en pantalla.
      entries: slot.muted ? [] : entriesFor(slot.day, lastDay),
    })),
  );
}

function entriesFor(day: number, lastDay: number): readonly CalendarEntry[] {
  if (day === lastDay) {
    return [{ label: 'Cierre de mes', tone: 'red' }];
  }
  return SAMPLE_ENTRIES.get(day) ?? [];
}

/** Un marcador de posición plano, para que la vista previa no necesite red ni activos binarios. */
function placeholder(hue: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320">` +
    `<rect width="480" height="320" fill="${hue}"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** La página de Patrones del catálogo: las cinco composiciones generalizadas. */
@Component({
  selector: 'app-patterns',
  imports: [
    AttachmentChip,
    Button,
    CalendarCell,
    ChecklistItem,
    IdentityCard,
    MediaCard,
    MessageRow,
    SafeContentViewer,
    ScheduleCard,
    ScheduleChip,
    ShowcaseBlock,
    ShowcasePage,
    TimeGrid,
    TotpSetup,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './patterns.html',
  styleUrl: './patterns.css',
})
export class Patterns {
  protected readonly images = {
    press: placeholder('#1d4ed8'),
    lathe: placeholder('#0d9488'),
    crate: placeholder('#c2410c'),
  };

  protected readonly done = signal(false);
  protected readonly reviewed = signal(true);

  protected readonly auditMeta: readonly ChecklistMeta[] = [
    { icon: 'calendar', text: '12 de septiembre' },
    { icon: 'user', text: 'Lucía Fernández' },
  ];

  protected readonly shipmentMeta: readonly ChecklistMeta[] = [
    { icon: 'clock', text: 'Hoy, 17:00' },
    { icon: 'package', text: '3 pedidos' },
  ];

  protected readonly tones = TONES;

  protected readonly weekdays = WEEKDAY_HEADINGS;

  /**
   * El mes en el que se abre el catálogo, distribuido en semanas completas.
   *
   * Construido una sola vez al inicializarse y no en un `computed`: nada en
   * esta página cambia el mes, y un signal solo sugeriría que puede
   * cambiar.
   */
  protected readonly weeks = buildMonth(new Date());

  /**
   * «Septiembre de 2026». El español mantiene los nombres de mes en
   * minúscula a mitad de oración, pero este abre un encabezado, así que la
   * primera letra se sube a mayúscula.
   */
  protected readonly monthTitle = monthTitle(new Date());

  protected readonly demoMsgUnread = signal(true);
  protected readonly demoMsgFlagged = signal(true);
  protected readonly demoExternalBlocked = signal(true);

  protected readonly timeGridColumns: readonly TimeGridColumn[] = [
    { id: 'mon', label: 'Lun 16' },
    { id: 'tue', label: 'Mar 17' },
    { id: 'wed', label: 'Mié 18 (Hoy)', today: true },
    { id: 'thu', label: 'Jue 19' },
    { id: 'fri', label: 'Vie 20' },
  ];

  protected readonly timeGridEntries: readonly TimeGridEntry[] = [
    {
      id: 'e1',
      columnId: 'wed',
      hour: 9,
      title: 'Daily Sistemas',
      subtitle: 'Sala 2',
      tone: 'blue',
    },
    {
      id: 'e2',
      columnId: 'wed',
      hour: 11,
      title: 'Revisión UI/UX',
      subtitle: 'Sala B',
      tone: 'orange',
    },
    {
      id: 'e3',
      columnId: 'thu',
      hour: 10,
      title: 'Seguridad OWASP',
      subtitle: 'Remoto',
      tone: 'purple',
    },
  ];

  protected readonly identityFacts: readonly IdentityFact[] = [
    { label: 'Área', value: 'Tecnología' },
    { label: 'Puesto', value: 'Arquitecta de plataforma' },
  ];

  protected readonly totpQr = placeholder('#1e293b');
  protected readonly totpSecret = 'JBSWY3DPEHPK3PXP';
}
