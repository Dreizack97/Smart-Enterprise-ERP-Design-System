import { Component } from '@angular/core';
import { Button } from '@shared/components/actions/button/button';
import { Divider } from '@shared/components/containers/divider/divider';
import { FormCard } from '@shared/components/containers/form-card/form-card';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { StatCard, StatVariant } from '@shared/components/containers/stat-card/stat-card';
import { ActivityItem } from '@shared/components/media/activity-item/activity-item';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { AvatarGroup } from '@shared/components/media/avatar-group/avatar-group';
import { Timeline, TimelineEntry } from '@shared/components/media/timeline/timeline';
import { CodeBlock } from '@shared/components/typography/code-block/code-block';
import { Kbd } from '@shared/components/typography/kbd/kbd';
import { Icon } from '@shared/components/media/icon/icon';
import { Input } from '@shared/components/forms/input/input';
import { CONTROL_SIZES } from '@shared/models/size.model';
import { IconName } from '@core/icons/lucide-icons';
import { Tone } from '@shared/models/tone.model';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/** Una entrada del feed de actividad. */
interface Activity {
  readonly icon: IconName;
  readonly tone: Tone;
  readonly title: string;
  readonly description: string;
  readonly time: string;
}

/** Página de catálogo de las familias `containers/` y `media/`. */
@Component({
  selector: 'app-containers',
  imports: [
    ActivityItem,
    Avatar,
    AvatarGroup,
    Button,
    CodeBlock,
    Divider,
    Kbd,
    Timeline,
    FormCard,
    Icon,
    Input,
    SectionCard,
    ShowcaseBlock,
    ShowcasePage,
    StatCard,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './containers.html',
  styleUrl: './containers.css',
})
export class Containers {
  protected readonly sizes = CONTROL_SIZES;

  protected readonly statVariants: readonly StatVariant[] = ['metric', 'tile', 'report'];

  /**
   * Nombres elegidos para que los matices derivados caigan lejos entre sí,
   * y uno lo bastante largo para probar que las iniciales solo toman las
   * primeras dos palabras.
   */
  protected readonly people = [
    'Ángela Ruiz',
    'Bruno Díaz',
    'Lucía Fernández Herrera',
    'Zoe Márquez',
    'Industrias Vega',
  ];

  protected readonly team = [
    'Ana Torres',
    'Bruno Díaz',
    'Carmen Ibáñez',
    'Diego Salazar',
    'Elena Prado',
    'Fernando Gil',
  ];

  protected readonly history: readonly TimelineEntry[] = [
    {
      icon: 'shopping-cart',
      tone: 'blue',
      title: 'Pedido recibido',
      description: 'PED-2481 entró por el portal de clientes.',
      time: '8 sep · 09:14',
    },
    {
      icon: 'circle-check',
      tone: 'green',
      title: 'Pago confirmado',
      description: 'Transferencia conciliada con la factura FAC-1190.',
      time: '8 sep · 11:02',
    },
    {
      icon: 'package-open',
      tone: 'orange',
      title: 'En preparación',
      description: 'Almacén central, andén norte.',
      time: '8 sep · 14:30',
    },
    {
      icon: 'send',
      tone: 'neutral',
      title: 'Pendiente de envío',
      time: 'estimado 9 sep',
    },
  ];

  /** Mostrado por `code-block`. Un fragmento real de este catálogo. */
  protected readonly snippet = [
    '<app-avatar-group',
    '  [names]="asignados"',
    '  [max]="3"',
    '  label="Asignados a la tarea"',
    '/>',
  ].join('\n');

  protected readonly activity: readonly Activity[] = [
    {
      icon: 'user-plus',
      tone: 'blue',
      title: 'Alta de cliente',
      description: 'Ana Torres completó su registro en el portal.',
      time: 'hace 5 minutos',
    },
    {
      icon: 'shopping-cart',
      tone: 'green',
      title: 'Pedido confirmado',
      description: 'PED-2481 pasó a preparación en el almacén central.',
      time: 'hace 22 minutos',
    },
    {
      icon: 'triangle-alert',
      tone: 'yellow',
      title: 'Inventario bajo',
      description: 'Quedan 4 unidades de «Teclado mecánico RX».',
      time: 'hace 1 hora',
    },
    {
      icon: 'circle-alert',
      tone: 'red',
      title: 'Pago rechazado',
      description: 'La tarjeta de Grupo Vega fue declinada.',
      time: 'ayer',
    },
    {
      icon: 'package-open',
      tone: 'orange',
      title: 'Devolución recibida',
      description: 'DEV-0142 entró al almacén central pendiente de revisión.',
      time: 'ayer',
    },
    {
      icon: 'shield',
      tone: 'purple',
      title: 'Permisos actualizados',
      description: 'Lucía Fernández pasó a perfil de supervisión.',
      time: 'hace 2 días',
    },
    {
      icon: 'clock',
      tone: 'neutral',
      title: 'Periodo cerrado',
      description: 'Agosto quedó cerrado para captura.',
      time: 'hace 8 días',
    },
  ];
}
