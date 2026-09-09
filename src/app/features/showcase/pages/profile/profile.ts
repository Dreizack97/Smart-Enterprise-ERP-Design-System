import { Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { Notifications } from '@core/services/notification';
import { ThemeStore } from '@core/theme/theme-store';
import { Theme } from '@core/theme/theme.model';
import { Button } from '@shared/components/actions/button/button';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { DataTable } from '@shared/components/data/data-table/data-table';
import { TableColumn } from '@shared/components/data/data-table/data-table.model';
import { TableCell } from '@shared/components/data/data-table/table-cell';
import { Alert } from '@shared/components/feedback/alert/alert';
import { Badge } from '@shared/components/feedback/badge/badge';
import { ResendTimer } from '@shared/components/feedback/resend-timer/resend-timer';
import { StatusBadge } from '@shared/components/feedback/status-badge/status-badge';
import { DatePicker } from '@shared/components/forms/date-picker/date-picker';
import { FileUpload } from '@shared/components/forms/file-upload/file-upload';
import { Input } from '@shared/components/forms/input/input';
import { OtpInput } from '@shared/components/forms/otp-input/otp-input';
import { PasswordInput } from '@shared/components/forms/password-input/password-input';
import { PasswordStrengthMeter } from '@shared/components/forms/password-strength-meter/password-strength-meter';
import { RadioGroup, RadioOption } from '@shared/components/forms/radio-group/radio-group';
import { Select, SelectOption } from '@shared/components/forms/select/select';
import { Textarea } from '@shared/components/forms/textarea/textarea';
import { ToggleSwitch } from '@shared/components/forms/toggle-switch/toggle-switch';
import { Timeline, TimelineEntry } from '@shared/components/media/timeline/timeline';
import { Breadcrumb, BreadcrumbItem } from '@shared/components/navigation/breadcrumb/breadcrumb';
import { AppTabPanel } from '@shared/components/navigation/tab-panel/tab-panel';
import { TabItem, Tabs } from '@shared/components/navigation/tabs/tabs';
import { ConfirmDialog } from '@shared/components/overlays/confirm-dialog/confirm-dialog';
import { PageHeader } from '@layout/components/page-header/page-header';

/** Los campos que la pestaña «Datos» deja editar. */
interface ProfileFields {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly area: string;
  readonly timezone: string;
  readonly since: string;
  readonly note: string;
}

/**
 * Lo que la cuenta trae al abrirse.
 *
 * Es a la vez el valor inicial de cada campo y la línea contra la que se
 * compara para saber si hay cambios sin guardar — una sola declaración, así
 * que no existe la posibilidad de que el formulario arranque con un valor y el
 * comparador crea que era otro.
 */
const ORIGINAL: ProfileFields = {
  fullName: 'Lucía Fernández Herrera',
  email: 'lucia.fernandez@smartenterprise.mx',
  phone: '33 1122 3344',
  area: 'operaciones',
  timezone: 'mx-centro',
  since: '2023-09-04',
  note: 'Supervisión de almacén central y conciliación de inventarios.',
};

/** El formulario: un signal escribible por campo, con la forma de `ProfileFields`. */
type ProfileForm = { readonly [K in keyof ProfileFields]: WritableSignal<ProfileFields[K]> };

/** Un dato de la cuenta que se lee y no se edita. */
interface AccountFact {
  readonly label: string;
  readonly value: string;
}

/** Un aviso que se puede encender o apagar. */
interface Notice {
  readonly key: string;
  readonly label: string;
  readonly enabled: WritableSignal<boolean>;
}

/** Una sesión abierta con la cuenta, como la lista la pestaña de seguridad. */
interface Session {
  readonly id: number;
  readonly device: string;
  readonly place: string;
  readonly lastSeen: string;
  readonly current: boolean;
}

const SESSIONS: readonly Session[] = [
  { id: 1, device: 'Chrome · Windows', place: 'Guadalajara, MX', lastSeen: 'Ahora', current: true },
  {
    id: 2,
    device: 'Safari · iPhone',
    place: 'Guadalajara, MX',
    lastSeen: 'hace 2 horas',
    current: false,
  },
  {
    id: 3,
    device: 'Edge · Windows',
    place: 'Monterrey, MX',
    lastSeen: 'hace 3 días',
    current: false,
  },
];

/**
 * **Plantilla Perfil** — la pantalla de cuenta, ensamblada solo con piezas del
 * sistema.
 *
 * Es la cuarta plantilla, y la única a la que se llega desde el armazón: el
 * menú de cuenta de la barra superior lleva aquí. Esa ruta importa más de lo
 * que parece — es la primera vez que el catálogo demuestra que el navbar
 * **navega**, y no solo que se ve bien.
 *
 * ## Por qué pestañas y no una sola columna
 *
 * Un perfil de ERP junta cuatro asuntos que no se leen juntos: quién eres, cómo
 * entras, cómo quieres que se comporte, y qué has hecho. Apilados son una
 * página de scroll infinito en la que nadie encuentra el interruptor de la
 * verificación en dos pasos. `tabs` los separa sin esconderlos, y cada panel
 * difiere su plantilla, así que abrir el perfil no construye las cuatro.
 *
 * ## Guardar solo cuando hay algo que guardar
 *
 * `dirty` compara el formulario contra `ORIGINAL`, y de ahí salen tres cosas a
 * la vez: la insignia «Cambios sin guardar», si los botones del encabezado
 * están vivos, y qué restaura «Descartar». Un botón de guardar siempre
 * habilitado no dice nada; uno que se enciende cuando tocas un campo dice
 * exactamente qué está pendiente.
 *
 * ## Lo único que aquí es de verdad
 *
 * El tema. El `radio-group` de preferencias lee y escribe `ThemeStore`, el
 * mismo estado que conmuta la barra superior — así que cambiarlo aquí repinta
 * la aplicación entera de inmediato. Todo lo demás es vitrina: los guardados
 * son un retraso y un toast, porque no hay servidor y fingir uno sería
 * documentar una promesa que el sistema no cumple.
 */
@Component({
  selector: 'app-profile',
  imports: [
    Alert,
    AppTabPanel,
    Badge,
    Breadcrumb,
    Button,
    ConfirmDialog,
    DataTable,
    DatePicker,
    FileUpload,
    Input,
    OtpInput,
    PageHeader,
    PasswordInput,
    PasswordStrengthMeter,
    RadioGroup,
    ResendTimer,
    SectionCard,
    Select,
    StatusBadge,
    TableCell,
    Tabs,
    Textarea,
    Timeline,
    ToggleSwitch,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private readonly notifications = inject(Notifications);
  protected readonly theme = inject(ThemeStore);

  protected readonly trail: readonly BreadcrumbItem[] = [
    { label: 'Inicio', route: '/inicio' },
    { label: 'Mi perfil' },
  ];

  protected readonly tabs: readonly TabItem[] = [
    { value: 'datos', label: 'Datos', icon: 'user' },
    { value: 'seguridad', label: 'Seguridad', icon: 'shield' },
    { value: 'preferencias', label: 'Preferencias', icon: 'settings' },
    { value: 'actividad', label: 'Actividad', icon: 'clock' },
  ];

  protected readonly tab = signal<string | undefined>('datos');

  // --- Datos personales ----------------------------------------------------
  protected readonly form: ProfileForm = {
    fullName: signal(ORIGINAL.fullName),
    email: signal(ORIGINAL.email),
    phone: signal(ORIGINAL.phone),
    area: signal(ORIGINAL.area),
    timezone: signal(ORIGINAL.timezone),
    since: signal(ORIGINAL.since),
    note: signal(ORIGINAL.note),
  };

  /**
   * Si algún campo dejó de coincidir con lo que traía la cuenta.
   *
   * Recorre el formulario en vez de comparar campo por campo a mano: agregar
   * un campo al perfil no debe obligar a acordarse de una segunda lista.
   */
  protected readonly dirty = computed(() =>
    fieldNames().some((name) => this.form[name]() !== ORIGINAL[name]),
  );

  protected readonly photo = signal('');
  protected readonly saving = signal(false);

  /** Las iniciales del avatar salen del nombre, no de un campo aparte. */
  protected readonly initials = computed(() =>
    this.form
      .fullName()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  /** Lo que la cuenta sabe de sí misma y nadie edita desde aquí. */
  protected readonly accountFacts: readonly AccountFact[] = [
    { label: 'Clave de empleado', value: 'EMP-0428' },
    { label: 'Alta en el sistema', value: '4 sep 2023' },
    { label: 'Último acceso', value: 'Hoy, 08:12' },
  ];

  protected readonly areas: readonly SelectOption[] = [
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'compras', label: 'Compras' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'ventas', label: 'Ventas' },
  ];

  protected readonly timezones: readonly SelectOption[] = [
    { value: 'mx-centro', label: 'Centro (CDMX, Guadalajara)', group: 'México' },
    { value: 'mx-pacifico', label: 'Pacífico (Tijuana)', group: 'México' },
    { value: 'mx-noroeste', label: 'Noroeste (Hermosillo)', group: 'México' },
    { value: 'es-madrid', label: 'Madrid', group: 'Europa' },
  ];

  // --- Seguridad -----------------------------------------------------------
  protected readonly currentPassword = signal('');
  protected readonly newPassword = signal('');
  protected readonly twoFactor = signal(false);
  protected readonly code = signal('');
  protected readonly resendReset = signal(0);
  protected readonly resending = signal(false);
  protected readonly sessions = signal<readonly Session[]>(SESSIONS);
  protected readonly deactivateOpen = signal(false);

  /** Cambiar una contraseña pide las dos: la de hoy y la de mañana. */
  protected readonly canUpdatePassword = computed(
    () => this.currentPassword().length > 0 && this.newPassword().length > 0,
  );

  /** El medidor no debe usar el nombre ni el correo de la persona a su favor. */
  protected readonly ownWords = computed(() => [
    this.form.fullName(),
    this.form.email().split('@')[0],
  ]);

  protected readonly sessionColumns: readonly TableColumn<Session>[] = [
    {
      id: 'device',
      header: 'Dispositivo',
      cell: (row) => row.device,
      sortable: true,
      hideable: false,
    },
    { id: 'place', header: 'Ubicación', cell: (row) => row.place, sortable: true },
    { id: 'lastSeen', header: 'Última actividad', cell: (row) => row.lastSeen },
    { id: 'state', header: 'Estado', sortValue: (row) => (row.current ? 'a' : 'b') },
  ];

  // --- Preferencias --------------------------------------------------------
  protected readonly themeOptions: readonly RadioOption[] = [
    { value: 'light', label: 'Claro', description: 'Fondo claro a toda hora.', icon: 'sun' },
    { value: 'dark', label: 'Oscuro', description: 'Fondo oscuro a toda hora.', icon: 'moon' },
    {
      value: 'system',
      label: 'Seguir al sistema',
      description: 'Cambia con la preferencia del equipo.',
      icon: 'sun-moon',
    },
  ];

  protected readonly notices: readonly Notice[] = [
    { key: 'digest', label: 'Resumen diario por correo', enabled: signal(true) },
    { key: 'stock', label: 'Alertas de inventario bajo', enabled: signal(true) },
    { key: 'weekly', label: 'Reporte semanal del área', enabled: signal(false) },
  ];

  // --- Actividad -----------------------------------------------------------
  protected readonly history: readonly TimelineEntry[] = [
    {
      icon: 'key',
      tone: 'blue',
      title: 'Inicio de sesión',
      description: 'Chrome · Windows, desde Guadalajara.',
      time: 'hoy, 08:12',
    },
    {
      icon: 'pencil',
      tone: 'neutral',
      title: 'Perfil actualizado',
      description: 'Cambió su número de teléfono.',
      time: 'ayer, 17:40',
    },
    {
      icon: 'shield',
      tone: 'green',
      title: 'Contraseña cambiada',
      description: 'Desde la pantalla de perfil.',
      time: '2 sep, 09:05',
    },
    {
      icon: 'package-open',
      tone: 'orange',
      title: 'Inventario cerrado',
      description: 'Conteo cíclico del almacén central.',
      time: '31 ago, 19:22',
    },
    {
      icon: 'user-plus',
      tone: 'purple',
      title: 'Permisos actualizados',
      description: 'Pasó a perfil de supervisión.',
      time: '28 ago, 11:00',
    },
  ];

  protected trackSession(row: Session): number {
    return row.id;
  }

  protected setTheme(value: string): void {
    this.theme.set(value as Theme);
  }

  /** Guardar es un retraso y un aviso: no hay servidor detrás de esta pantalla. */
  protected save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.notifications.success('Perfil guardado. Esto es una vitrina: nada se envió.');
    }, 1200);
  }

  /** Devuelve cada campo a lo que traía la cuenta, que es lo que «descartar» significa. */
  protected discard(): void {
    for (const name of fieldNames()) {
      this.form[name].set(ORIGINAL[name]);
    }
    this.notifications.info('Cambios descartados.');
  }

  protected onTwoFactorChange(enabled: boolean): void {
    this.code.set('');
    this.notifications.info(
      enabled
        ? 'Escribe el código de seis dígitos para terminar de activarla.'
        : 'Verificación en dos pasos desactivada.',
    );
  }

  protected onCodeComplete(): void {
    this.notifications.success('Verificación en dos pasos activada.');
  }

  protected onResend(): void {
    this.resending.set(true);
    setTimeout(() => {
      this.resending.set(false);
      this.notifications.info('Código reenviado.');
    }, 1000);
  }

  /** La fila se va de la tabla: cerrar una sesión que sigue listada no cerró nada. */
  protected closeSession(row: Session): void {
    this.sessions.update((sessions) => sessions.filter((session) => session.id !== row.id));
    this.notifications.info(`Se cerró la sesión de ${row.device}.`);
  }

  protected updatePassword(): void {
    this.currentPassword.set('');
    this.newPassword.set('');
    this.notifications.success('Contraseña actualizada. Esto es una vitrina: nada cambió.');
  }

  protected askDeactivate(): void {
    this.deactivateOpen.set(true);
  }

  protected onDeactivated(): void {
    this.notifications.error('La cuenta seguiría activa: esto es una vitrina.');
  }
}

/**
 * Los nombres de los campos editables, tipados contra `ProfileFields`.
 *
 * Se derivan de `ORIGINAL` en vez de escribirse aparte: una lista a mano se
 * queda corta el día que alguien agrega un campo, y el formulario se marcaría
 * como limpio con un cambio pendiente adentro.
 */
function fieldNames(): readonly (keyof ProfileFields)[] {
  return Object.keys(ORIGINAL) as (keyof ProfileFields)[];
}
