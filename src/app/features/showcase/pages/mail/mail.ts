import { Component, computed, inject, signal } from '@angular/core';
import { Notifications } from '@core/services/notification';
import { Button } from '@shared/components/actions/button/button';
import {
  SegmentedControl,
  SegmentOption,
} from '@shared/components/actions/segmented-control/segmented-control';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { SplitPane } from '@shared/components/containers/split-pane/split-pane';
import { DataTable } from '@shared/components/data/data-table/data-table';
import { TableColumn } from '@shared/components/data/data-table/data-table.model';
import { TableCell } from '@shared/components/data/data-table/table-cell';
import { Badge } from '@shared/components/feedback/badge/badge';
import { EmptyState } from '@shared/components/feedback/empty-state/empty-state';
import { Progress } from '@shared/components/feedback/progress/progress';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { ChipInput, ChipSuggestion } from '@shared/components/forms/chip-input/chip-input';
import { Combobox, ComboboxOption } from '@shared/components/forms/combobox/combobox';
import { DateGrid } from '@shared/components/forms/date-grid/date-grid';
import { DateRangePicker } from '@shared/components/forms/date-range-picker/date-range-picker';
import { Input } from '@shared/components/forms/input/input';
import { RichTextEditor } from '@shared/components/forms/rich-text-editor/rich-text-editor';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Select, SelectOption } from '@shared/components/forms/select/select';
import { ToggleSwitch } from '@shared/components/forms/toggle-switch/toggle-switch';
import { Avatar } from '@shared/components/media/avatar/avatar';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { TreeNav, TreeNavGroup } from '@shared/components/navigation/tree-nav/tree-nav';
import { Drawer } from '@shared/components/overlays/drawer/drawer';
import { Modal } from '@shared/components/overlays/modal/modal';
import { AttachmentChip } from '@shared/components/patterns/attachment-chip/attachment-chip';
import { ChecklistItem } from '@shared/components/patterns/checklist-item/checklist-item';
import { MessageRow, MessageRowTag } from '@shared/components/patterns/message-row/message-row';
import { SafeContentViewer } from '@shared/components/patterns/safe-content-viewer/safe-content-viewer';
import { ScheduleCard } from '@shared/components/patterns/schedule-card/schedule-card';
import {
  TimeGrid,
  TimeGridColumn,
  TimeGridEntry,
} from '@shared/components/patterns/time-grid/time-grid';
import { CodeBlock } from '@shared/components/typography/code-block/code-block';
import { Tone } from '@shared/models/tone.model';
import { normalise } from '@shared/utils/text';
import { PageHeader } from '@layout/components/page-header/page-header';

interface MailAttachment {
  readonly name: string;
  readonly size: string;
  readonly kind: string;
  readonly tone: Tone;
}

interface MailMessage {
  readonly id: string;
  readonly folderId: string;
  readonly sender: string;
  readonly email: string;
  readonly recipients: string;
  readonly subject: string;
  readonly snippet: string;
  readonly body: string;
  readonly timestamp: string;
  readonly unread: boolean;
  readonly flagged: boolean;
  readonly priority: 'high' | 'normal' | 'low';
  readonly bulk?: boolean;
  readonly hasExternalImages?: boolean;
  readonly externalUnblocked?: boolean;
  readonly isCalendarInvite?: boolean;
  readonly rsvpStatus?: string;
  readonly attachments: readonly MailAttachment[];
  readonly tags: readonly MessageRowTag[];
}

interface DirectoryContact {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly email: string;
  readonly phone: string;
  readonly scope: 'personal' | 'gal';
}

interface PimTask {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly badgeLabel: string;
  readonly badgeTone: Tone;
  readonly due: string;
  readonly done: boolean;
}

interface MailNote {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tone: Tone;
  readonly updated: string;
}

interface MailRule {
  readonly id: string;
  readonly name: string;
  readonly condition: string;
  readonly action: string;
  readonly enabled: boolean;
}

const INITIAL_MESSAGES: readonly MailMessage[] = [
  {
    id: 'm-1',
    folderId: 'inbox',
    sender: 'Isabel Barboza',
    email: 'isabel.barboza@nukabe.mx',
    recipients: 'Para: Jorge Silva <jorge.silva@nukabe.mx> · CC: Abiud Gonzalez',
    subject: 'Revisión de avances ERP y portal de correo corporativo',
    snippet:
      'Revisamos la propuesta para reemplazar el cliente actual por la interfaz moderna con paridad Outlook...',
    body: 'Confirmamos que la prioridad para la primera entrega es asegurar el diseño responsivo sin recortes horizontales, visor seguro contra rastreadores y el centro unificado de reglas y firma.',
    timestamp: '09:42',
    unread: true,
    flagged: true,
    priority: 'high',
    hasExternalImages: true,
    externalUnblocked: false,
    attachments: [
      { name: 'Propuesta-Arquitectura-Nukabe.pdf', size: '1.4 MB', kind: 'PDF', tone: 'blue' },
      { name: 'Cronograma-Q4.xlsx', size: '420 KB', kind: 'Excel', tone: 'green' },
    ],
    tags: [{ label: '2 adjuntos', tone: 'neutral' }],
  },
  {
    id: 'm-2',
    folderId: 'inbox',
    sender: 'Abiud Gonzalez',
    email: 'abiud.gonzalez@nukabe.mx',
    recipients: 'Para: Jorge Silva <jorge.silva@nukabe.mx>',
    subject: 'Minuta semanal · Infraestructura Windows Server x64',
    snippet:
      'Se validaron MailEnable.Store.dll y MailEnable.Administration.dll en bin64 para acceso co-localizado...',
    body: 'El servicio .NET 10 operará co-localizado en el Windows Server x64 para notificaciones SignalR instantáneas y lectura directa de buzones.',
    timestamp: 'Ayer 17:15',
    unread: false,
    flagged: true,
    priority: 'normal',
    attachments: [],
    tags: [],
  },
  {
    id: 'm-3',
    folderId: 'inbox',
    sender: 'Adrian Reyes',
    email: 'adrian.reyes@nukabe.mx',
    recipients: 'Para: Jorge Silva <jorge.silva@nukabe.mx> · CC: Aketzali Sanchez',
    subject: 'Invitación: Junta de Alineación Diseño UI / UX',
    snippet:
      'Revisión de tokens en modo claro y oscuro, accesibilidad WCAG AA y componentes de correo...',
    body: 'Te invitamos a revisar la plantilla interactiva en la sala ejecutiva B hoy de 11:00 a 12:00 hrs.',
    timestamp: '16 Nov',
    unread: false,
    flagged: false,
    priority: 'normal',
    isCalendarInvite: true,
    attachments: [],
    tags: [{ label: 'Cita iCal', tone: 'blue' }],
  },
  {
    id: 'm-4',
    folderId: 'inbox',
    sender: 'Sistema de Nómina',
    email: 'no-reply@nukabe.mx',
    recipients: 'Para: Personal Nukabe <todos@nukabe.mx>',
    subject: 'Aviso automático: Comprobante quincenal disponible (Masivo)',
    snippet:
      'Este es un mensaje informativo masivo generado automáticamente por Smart Enterprise ERP...',
    body: 'Tu recibo de nómina correspondiente al periodo en curso ya se encuentra disponible para descarga segura.',
    timestamp: '15 Nov',
    unread: false,
    flagged: false,
    priority: 'low',
    bulk: true,
    attachments: [],
    tags: [{ label: 'Masivo', tone: 'neutral' }],
  },
  {
    id: 'm-5',
    folderId: 'sent',
    sender: 'Para: Isabel Barboza',
    email: 'isabel.barboza@nukabe.mx',
    recipients: 'Para: isabel.barboza@nukabe.mx',
    subject: 'RE: Revisión de avances ERP y portal de correo corporativo',
    snippet:
      'Excelente, ya promovimos los componentes compartidos al Design System de Smart Enterprise ERP...',
    body: 'Los componentes nuevos ya pasan todas las auditorías de contraste, geometría y consistencia del repositorio.',
    timestamp: 'Ayer 16:05',
    unread: false,
    flagged: false,
    priority: 'normal',
    attachments: [],
    tags: [],
  },
];

const CONTACTS: readonly DirectoryContact[] = [
  {
    id: 'c1',
    name: 'Isabel Barboza',
    role: 'Gerencia General',
    email: 'isabel.barboza@nukabe.mx',
    phone: '+52 442 555 0101',
    scope: 'personal',
  },
  {
    id: 'c2',
    name: 'Abiud Gonzalez',
    role: 'Director de TI',
    email: 'abiud.gonzalez@nukabe.mx',
    phone: '+52 442 555 0114',
    scope: 'personal',
  },
  {
    id: 'c3',
    name: 'Aketzali Sanchez',
    role: 'Comunicación',
    email: 'aketzali.sanchez@nukabe.mx',
    phone: '+52 442 555 0128',
    scope: 'personal',
  },
  {
    id: 'c4',
    name: 'Adrian Reyes',
    role: 'Diseño UI / UX',
    email: 'adrian.reyes@nukabe.mx',
    phone: '+52 442 555 0139',
    scope: 'personal',
  },
  {
    id: 'c5',
    name: 'Luis Mendoza',
    role: 'Producción',
    email: 'luis.mendoza@nukabe.mx',
    phone: '+52 442 555 0152',
    scope: 'gal',
  },
  {
    id: 'c6',
    name: 'Mariana Torres',
    role: 'Recursos Humanos',
    email: 'mariana.torres@nukabe.mx',
    phone: '+52 442 555 0166',
    scope: 'gal',
  },
];

/**
 * **Plantilla Correo** — cliente web empresarial con paridad Microsoft Outlook
 * e integración funcional completa para MailEnable Enterprise v10.62, armado
 * exclusivamente con componentes del sistema de diseño.
 */
@Component({
  selector: 'app-mail',
  imports: [
    AttachmentChip,
    Avatar,
    Badge,
    Breadcrumb,
    Button,
    Checkbox,
    ChecklistItem,
    ChipInput,
    CodeBlock,
    Combobox,
    DataTable,
    DateGrid,
    DateRangePicker,
    Drawer,
    EmptyState,
    Input,
    MessageRow,
    Modal,
    PageHeader,
    Progress,
    RichTextEditor,
    SafeContentViewer,
    ScheduleCard,
    SearchInput,
    SectionCard,
    SegmentedControl,
    Select,
    SplitPane,
    TableCell,
    TimeGrid,
    ToggleSwitch,
    TreeNav,
  ],
  templateUrl: './mail.html',
  styleUrl: './mail.css',
})
export class Mail {
  private readonly notifications = inject(Notifications);

  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Correo' },
  ];

  protected readonly activeModule = signal('mail');
  protected readonly moduleSegments: readonly SegmentOption[] = [
    { value: 'mail', label: 'Correo', icon: 'mail' },
    { value: 'calendar', label: 'Calendario', icon: 'calendar' },
    { value: 'contacts', label: 'Contactos', icon: 'users' },
    { value: 'tasks', label: 'Tareas', icon: 'check-check' },
    { value: 'options', label: 'Opciones', icon: 'settings' },
  ];

  protected readonly selectedFolder = signal('inbox');
  protected readonly readingPaneMode = signal('right');
  protected readonly readingPaneOptions: readonly SelectOption[] = [
    { value: 'right', label: 'Lectura: Derecha' },
    { value: 'bottom', label: 'Lectura: Inferior' },
    { value: 'off', label: 'Lectura: Oculta' },
  ];

  protected readonly mailFilter = signal('all');
  protected readonly mailFilterOptions: readonly SegmentOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'unread', label: 'No leídos' },
    { value: 'flagged', label: 'Marcados' },
    { value: 'attachments', label: 'Adjuntos' },
  ];

  protected readonly hideBulk = signal(false);
  protected readonly mailQuery = signal('');
  protected readonly messages = signal<readonly MailMessage[]>(INITIAL_MESSAGES);
  protected readonly selectedMessageId = signal<string>('m-1');
  protected readonly checkedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly myDayOpen = signal(false);
  protected readonly headersModalOpen = signal(false);

  // Estado del Redactor
  protected readonly composerOpen = signal(false);
  protected readonly composerTo = signal<readonly string[]>([]);
  protected readonly composerCc = signal<readonly string[]>([]);
  protected readonly composerSubject = signal('');
  protected readonly composerBody = signal('');
  protected readonly composerPriority = signal('normal');
  protected readonly composerReadReceipt = signal(false);
  protected readonly priorityOptions: readonly SelectOption[] = [
    { value: 'high', label: 'Prioridad: Alta (!)' },
    { value: 'normal', label: 'Prioridad: Normal' },
    { value: 'low', label: 'Prioridad: Baja' },
  ];
  protected readonly galSuggestions: readonly ChipSuggestion[] = CONTACTS.map((c) => ({
    value: c.email,
    label: c.name,
    sublabel: c.role,
  }));

  // Calendario
  protected readonly calView = signal('week');
  protected readonly calViewOptions: readonly SegmentOption[] = [
    { value: 'week', label: 'Semana' },
    { value: 'agenda', label: 'Agenda' },
  ];
  protected readonly calMonth = signal(new Date(2026, 10, 18));
  protected readonly calSelectedDate = signal<string | null>('2026-11-18');
  protected readonly timeColumns: readonly TimeGridColumn[] = [
    { id: 'mon', label: 'Lun 16' },
    { id: 'tue', label: 'Mar 17' },
    { id: 'wed', label: 'Mié 18 (Hoy)', today: true },
    { id: 'thu', label: 'Jue 19' },
    { id: 'fri', label: 'Vie 20' },
  ];
  protected readonly timeEntries: readonly TimeGridEntry[] = [
    {
      id: 'ev-1',
      columnId: 'wed',
      hour: 9,
      title: 'Daily Sistemas & MailEnable',
      subtitle: 'Sala 2',
      tone: 'blue',
    },
    {
      id: 'ev-2',
      columnId: 'wed',
      hour: 11,
      title: 'Alineación Diseño UI/UX',
      subtitle: 'Sala B',
      tone: 'orange',
    },
    {
      id: 'ev-3',
      columnId: 'thu',
      hour: 10,
      title: 'Auditoría OWASP',
      subtitle: 'Remoto',
      tone: 'purple',
    },
    {
      id: 'ev-4',
      columnId: 'fri',
      hour: 13,
      title: 'Demo Gerencia',
      subtitle: 'Sala A',
      tone: 'green',
    },
  ];

  // Contactos + GAL
  protected readonly contactScope = signal('all');
  protected readonly contactScopeOptions: readonly SegmentOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'personal', label: 'Mis Contactos' },
    { value: 'gal', label: 'Lista Global (GAL)' },
  ];
  protected readonly contactQuery = signal('');
  protected readonly selectedContact = signal<DirectoryContact>(CONTACTS[0]);
  protected readonly contactColumns: readonly TableColumn<DirectoryContact>[] = [
    { id: 'name', header: 'Nombre', sortValue: (r) => r.name, sortable: true, hideable: false },
    { id: 'role', header: 'Puesto / Área', cell: (r) => r.role, sortable: true },
    { id: 'email', header: 'Correo electrónico', cell: (r) => r.email, sortable: true },
    { id: 'phone', header: 'Teléfono', cell: (r) => r.phone },
  ];

  // Tareas y Notas
  protected readonly pimMode = signal('tasks');
  protected readonly pimOptions: readonly SegmentOption[] = [
    { value: 'tasks', label: 'Tareas (.TSK)' },
    { value: 'notes', label: 'Notas (.NTT)' },
  ];
  protected readonly tasks = signal<readonly PimTask[]>([
    {
      id: 't-1',
      title: 'Validar plantilla /correo en Design System',
      description: 'Comprobar modo claro y oscuro + auditorías.',
      badgeLabel: 'Alta',
      badgeTone: 'red',
      due: 'Hoy 18:00',
      done: false,
    },
    {
      id: 't-2',
      title: 'Configurar adaptadores MailEnable v10.62 x64',
      description: 'Store.dll y Administration.dll en .NET 10.',
      badgeLabel: 'En curso',
      badgeTone: 'blue',
      due: '19 Nov 2026',
      done: false,
    },
    {
      id: 't-3',
      title: 'Auditar webmail nukabe.mx',
      description: 'Inventario completo de vistas y reglas 1..11.',
      badgeLabel: 'Completada',
      badgeTone: 'green',
      due: '18 Nov 2026',
      done: true,
    },
  ]);
  protected readonly notes: readonly MailNote[] = [
    {
      id: 'n-1',
      title: 'Topología Escenario 1',
      body: 'Co-localizado en Windows Server x64 con notificaciones SignalR y MimeKit.',
      tone: 'yellow',
      updated: 'Hoy 09:15',
    },
    {
      id: 'n-2',
      title: 'Regla de Design System',
      body: 'Solo tokens de Nivel 3 en component.css y verificación continua con npm run audit.',
      tone: 'blue',
      updated: 'Ayer 18:30',
    },
  ];

  // Opciones del Buzón
  protected readonly selectedOptionTab = signal('gen-regional');
  protected readonly optionGroups: readonly TreeNavGroup[] = [
    {
      label: 'General',
      items: [
        { id: 'gen-regional', label: 'Configuración regional', icon: 'settings' },
        { id: 'gen-account', label: 'Seguridad y contraseña', icon: 'lock' },
      ],
    },
    {
      label: 'Correo',
      items: [
        { id: 'mail-signature', label: 'Firma automática HTML', icon: 'pencil' },
        { id: 'mail-ooo', label: 'Respuesta automática', icon: 'clock' },
        { id: 'mail-rules', label: 'Reglas de filtrado (1..11)', icon: 'filter' },
      ],
    },
  ];
  protected readonly timezone = signal('america-mexico');
  protected readonly timezoneOptions: readonly ComboboxOption[] = [
    {
      value: 'america-mexico',
      label: '(UTC-06:00) Guadalajara, Ciudad de México, Monterrey',
      hint: 'CST',
    },
    { value: 'america-chihuahua', label: '(UTC-07:00) Chihuahua, Mazatlán', hint: 'MST' },
    { value: 'america-tijuana', label: '(UTC-08:00) Tijuana, Baja California', hint: 'PST' },
  ];
  protected readonly oooEnabled = signal(false);
  protected readonly oooStart = signal('2026-12-24');
  protected readonly oooEnd = signal('2027-01-02');
  protected readonly signatureDraft = signal(
    '<p><strong>Jorge Silva</strong> · Nukabe Corporativo</p>',
  );
  protected readonly rules = signal<readonly MailRule[]>([
    {
      id: 'r1',
      name: 'Etiquetar boletines masivos',
      condition: 'Encabezado Precedence contiene bulk',
      action: 'Mover a Proyectos Nukabe',
      enabled: true,
    },
    {
      id: 'r2',
      name: 'Facturas CFDI automáticas',
      condition: 'Asunto contiene CFDI o Adjunto .XML',
      action: 'Mover a Facturación CFDI',
      enabled: true,
    },
    {
      id: 'r3',
      name: 'Alerta Gerencia General',
      condition: 'Remitente es isabel.barboza@nukabe.mx',
      action: 'Marcar importancia Alta',
      enabled: false,
    },
  ]);

  // Computados
  protected readonly inboxUnreadCount = computed(
    () => this.messages().filter((m) => m.folderId === 'inbox' && m.unread).length,
  );

  protected readonly folderGroups = computed<readonly TreeNavGroup[]>(() => [
    {
      label: 'Favoritos y Sistema',
      items: [
        {
          id: 'inbox',
          label: 'Bandeja de entrada',
          icon: 'mail',
          badge: this.inboxUnreadCount() || undefined,
          badgeTone: this.inboxUnreadCount() > 0 ? 'blue' : undefined,
        },
        { id: 'drafts', label: 'Borradores', icon: 'pencil', badge: 2 },
        { id: 'sent', label: 'Elementos enviados', icon: 'send', badge: '1,644' },
        { id: 'junk', label: 'Correo no deseado', icon: 'shield' },
        { id: 'deleted', label: 'Elementos eliminados', icon: 'trash-2' },
      ],
    },
    {
      label: 'Mis Carpetas y Shares',
      items: [
        { id: 'proj', label: 'Proyectos Nukabe', icon: 'package', badge: 14 },
        { id: 'share-it', label: 'Soporte TI (Share)', icon: 'users', badge: 32 },
      ],
    },
  ]);

  protected readonly visibleMessages = computed(() => {
    const folder = this.selectedFolder();
    const filter = this.mailFilter();
    const hideBulk = this.hideBulk();
    const needle = normalise(this.mailQuery().trim());

    return this.messages().filter((m) => {
      if (m.folderId !== folder) return false;
      if (hideBulk && m.bulk) return false;
      if (filter === 'unread' && !m.unread) return false;
      if (filter === 'flagged' && !m.flagged) return false;
      if (filter === 'attachments' && m.attachments.length === 0) return false;
      if (!needle) return true;
      return (
        normalise(m.sender).includes(needle) ||
        normalise(m.subject).includes(needle) ||
        normalise(m.snippet).includes(needle)
      );
    });
  });

  protected readonly selectedMessage = computed<MailMessage | null>(
    () =>
      this.messages().find((m) => m.id === this.selectedMessageId()) ??
      this.visibleMessages().at(0) ??
      null,
  );

  protected readonly activeHeaders = computed(() => {
    const msg = this.selectedMessage();
    if (!msg) return '';
    return [
      'Received: from mail.nukabe.mx by MailEnable-v10.62 with ESMTP',
      'Authentication-Results: nukabe.mx; spf=pass; dkim=pass; dmarc=pass',
      `From: ${msg.sender} <${msg.email}>`,
      `Subject: ${msg.subject}`,
      `Date: ${msg.timestamp}`,
      `Message-ID: <${msg.id}@nukabe.mx>`,
    ].join('\n');
  });

  protected readonly filteredContacts = computed(() => {
    const scope = this.contactScope();
    const needle = normalise(this.contactQuery().trim());
    return CONTACTS.filter((c) => {
      if (scope !== 'all' && c.scope !== scope) return false;
      if (!needle) return true;
      return (
        normalise(c.name).includes(needle) ||
        normalise(c.email).includes(needle) ||
        normalise(c.role).includes(needle)
      );
    });
  });

  protected trackContact(row: DirectoryContact): string {
    return row.id;
  }

  protected isChecked(id: string): boolean {
    return this.checkedIds().has(id);
  }

  protected setChecked(id: string, next: boolean): void {
    this.checkedIds.update((set) => {
      const copy = new Set(set);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  protected selectMessage(message: MailMessage): void {
    this.selectedMessageId.set(message.id);
    if (message.unread) {
      this.patchMessage(message.id, { unread: false });
    }
  }

  protected toggleMessageRead(message: MailMessage): void {
    this.patchMessage(message.id, { unread: !message.unread });
  }

  protected setMessageFlag(id: string, flagged: boolean): void {
    this.patchMessage(id, { flagged });
  }

  protected deleteMessage(id: string): void {
    this.patchMessage(id, { folderId: 'deleted', unread: false });
    this.notifications.info('Mensaje movido a Elementos eliminados.');
  }

  protected unblockExternal(id: string): void {
    this.patchMessage(id, { externalUnblocked: true });
  }

  protected answerInvite(id: string, decision: string): void {
    this.patchMessage(id, { rsvpStatus: decision });
    this.notifications.success(`Invitación respondida: ${decision}.`);
  }

  protected batchMarkRead(): void {
    const ids = this.checkedIds();
    this.messages.update((list) => list.map((m) => (ids.has(m.id) ? { ...m, unread: false } : m)));
    this.checkedIds.set(new Set());
    this.notifications.success('Mensajes seleccionados marcados como leídos.');
  }

  protected openComposer(initialTo: readonly string[] = [], initialSubject = ''): void {
    this.composerTo.set([...initialTo]);
    this.composerCc.set([]);
    this.composerSubject.set(initialSubject);
    this.composerBody.set('<p></p>');
    this.composerOpen.set(true);
  }

  protected replyActive(): void {
    const msg = this.selectedMessage();
    if (!msg) return;
    this.openComposer([msg.email], `RE: ${msg.subject}`);
  }

  protected sendDraft(): void {
    const to = this.composerTo();
    if (to.length === 0) {
      this.notifications.warning('Agrega al menos un destinatario en el campo Para.');
      return;
    }
    const created: MailMessage = {
      id: `m-${Date.now()}`,
      folderId: 'sent',
      sender: `Para: ${to[0]}`,
      email: to[0],
      recipients: `Para: ${to.join(', ')}`,
      subject: this.composerSubject() || '(Sin asunto)',
      snippet: 'Mensaje enviado desde el redactor de Nukabe Mail.',
      body: this.composerBody() || 'Mensaje enviado.',
      timestamp: 'Ahora',
      unread: false,
      flagged: false,
      priority: this.composerPriority() as 'high' | 'normal' | 'low',
      attachments: [],
      tags: [],
    };
    this.messages.update((list) => [created, ...list]);
    this.composerOpen.set(false);
    this.notifications.success('Correo enviado correctamente.');
  }

  protected toggleTask(id: string, done: boolean): void {
    this.tasks.update((list) => list.map((t) => (t.id === id ? { ...t, done } : t)));
  }

  protected toggleRule(id: string): void {
    this.rules.update((list) => list.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  protected notifySaved(detail: string): void {
    this.notifications.success(detail);
  }

  private patchMessage(id: string, patch: Partial<MailMessage>): void {
    this.messages.update((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
}
