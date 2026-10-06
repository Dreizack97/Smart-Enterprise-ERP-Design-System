import { Component, computed, signal } from '@angular/core';
import { Checkbox } from '@shared/components/forms/checkbox/checkbox';
import { Combobox, ComboboxOption } from '@shared/components/forms/combobox/combobox';
import { DateGrid } from '@shared/components/forms/date-grid/date-grid';
import { DatePicker } from '@shared/components/forms/date-picker/date-picker';
import { DateRangePicker } from '@shared/components/forms/date-range-picker/date-range-picker';
import { Field } from '@shared/components/forms/field/field';
import { FileUpload } from '@shared/components/forms/file-upload/file-upload';
import { Input } from '@shared/components/forms/input/input';
import { NumberInput } from '@shared/components/forms/number-input/number-input';
import { OtpInput } from '@shared/components/forms/otp-input/otp-input';
import { PasswordInput } from '@shared/components/forms/password-input/password-input';
import {
  PasswordRequirement,
  PasswordRequirements,
} from '@shared/components/forms/password-requirements/password-requirements';
import { PasswordStrengthMeter } from '@shared/components/forms/password-strength-meter/password-strength-meter';
import { RadioGroup, RadioOption } from '@shared/components/forms/radio-group/radio-group';
import { Rating } from '@shared/components/forms/rating/rating';
import { SearchInput } from '@shared/components/forms/search-input/search-input';
import { Slider } from '@shared/components/forms/slider/slider';
import { Select, SelectOption } from '@shared/components/forms/select/select';
import { Textarea } from '@shared/components/forms/textarea/textarea';
import { ToggleSwitch } from '@shared/components/forms/toggle-switch/toggle-switch';
import { CONTROL_SIZES } from '@shared/models/size.model';
import { ShowcaseBlock } from '@features/showcase/components/showcase-block/showcase-block';
import { ShowcasePage } from '@features/showcase/components/showcase-page/showcase-page';
import { VariantGrid } from '@features/showcase/components/variant-grid/variant-grid';
import { VariantRow } from '@features/showcase/components/variant-row/variant-row';

/** Página de catálogo de la familia `forms/`. */
@Component({
  selector: 'app-forms',
  imports: [
    Checkbox,
    Combobox,
    DateGrid,
    DatePicker,
    DateRangePicker,
    Field,
    FileUpload,
    Input,
    NumberInput,
    OtpInput,
    PasswordInput,
    PasswordRequirements,
    PasswordStrengthMeter,
    RadioGroup,
    Rating,
    SearchInput,
    Slider,
    Select,
    ShowcaseBlock,
    ShowcasePage,
    Textarea,
    ToggleSwitch,
    VariantGrid,
    VariantRow,
  ],
  templateUrl: './forms.html',
  styleUrl: './forms.css',
})
export class Forms {
  protected readonly sizes = CONTROL_SIZES;

  protected readonly company = signal('Industrias Vega');
  protected readonly email = signal('');
  protected readonly notes = signal('');
  /** 37 de 40 caracteres: pasado el 90 %, así que el contador muestra su advertencia. */
  protected readonly nearLimitNote = signal('Entrega en el andén norte, puerta 4 B');
  protected readonly quickNote = signal('');
  protected readonly country = signal('mx');
  protected readonly plan = signal('pro');
  protected readonly terms = signal(false);
  protected readonly partial = signal(false);
  protected readonly notify = signal(true);
  protected readonly offline = signal(false);
  protected readonly shift = signal('am');
  protected readonly quantity = signal(12);
  protected readonly discount = signal(15);
  protected readonly query = signal('');
  protected readonly budget = signal(35000);
  protected readonly tolerance = signal(15);
  protected readonly score = signal(4);
  protected readonly client = signal('c2');
  protected readonly product = signal('');
  protected readonly invoiceDate = signal('2026-09-08');
  protected readonly gridMonth = signal(new Date());
  protected readonly periodStart = signal('2026-09-01');
  protected readonly periodEnd = signal('2026-09-15');

  /** Lo que muestra la fila de demo: el rango, o cuánto de él está elegido. */
  protected readonly rangeNote = computed(() => {
    const start = this.periodStart();
    const end = this.periodEnd();
    if (!start) {
      return 'sin periodo';
    }
    return end ? `${start} → ${end}` : `${start} → …`;
  });

  protected readonly clientOptions: readonly ComboboxOption[] = [
    { value: 'c1', label: 'Ángela Ruiz', hint: 'angela@vega.mx' },
    { value: 'c2', label: 'Industrias Vega', hint: 'compras@vega.mx' },
    { value: 'c3', label: 'Bruno Díaz', hint: 'bruno@diaz.mx' },
    { value: 'c4', label: 'Carmen Ibáñez', hint: 'carmen@ibanez.mx' },
    { value: 'c5', label: 'Distribuidora Norte', hint: 'pedidos@norte.mx' },
    { value: 'c6', label: 'Héctor Naranjo', hint: 'hector@naranjo.mx' },
    { value: 'c7', label: 'Grupo Salazar', hint: 'cuentas@salazar.mx', disabled: true },
  ];

  protected readonly productOptions: readonly ComboboxOption[] = [
    { value: 'p1', label: 'Teclado mecánico RX', hint: 'SKU-1188' },
    { value: 'p2', label: 'Monitor 27" QHD', hint: 'SKU-2043' },
    { value: 'p3', label: 'Base para portátil', hint: 'SKU-3310' },
  ];

  /** Lo que la fila de demo muestra junto a la etiqueta. */
  protected readonly pickedLabel = computed(() => {
    const picked = this.clientOptions.find((option) => option.value === this.client());
    return picked ? picked.label : 'sin elegir';
  });
  protected readonly password = signal('');

  /** Una política de ejemplo evaluada en vivo; en una aplicación las reglas vienen de su servidor. */
  protected readonly passwordRules = computed<readonly PasswordRequirement[]>(() => {
    const value = this.password();
    return [
      { label: 'Al menos 8 caracteres', met: value.length >= 8 },
      {
        label: 'Una letra mayúscula y una minúscula',
        met: /[a-z]/.test(value) && /[A-Z]/.test(value),
      },
      { label: 'Un número', met: /\d/.test(value) },
      { label: 'Un carácter especial', met: /[^a-zA-Z\d]/.test(value) },
    ];
  });
  protected readonly code = signal('');
  protected readonly shortCode = signal('');
  protected readonly avatar = signal('');
  protected readonly document = signal('');
  protected readonly lastCode = signal('');

  protected readonly countries: readonly SelectOption[] = [
    { value: 'mx', label: 'México', group: 'Norteamérica' },
    { value: 'us', label: 'Estados Unidos', group: 'Norteamérica' },
    { value: 'ca', label: 'Canadá', group: 'Norteamérica' },
    { value: 'es', label: 'España', group: 'Europa' },
    { value: 'pt', label: 'Portugal', group: 'Europa' },
    { value: 'fr', label: 'Francia', group: 'Europa', disabled: true },
  ];

  protected readonly plans: readonly RadioOption[] = [
    {
      value: 'basic',
      label: 'Básico',
      description: 'Hasta 3 usuarios y un almacén.',
      icon: 'package',
    },
    {
      value: 'pro',
      label: 'Profesional',
      description: 'Usuarios ilimitados, varios almacenes y facturación.',
      icon: 'briefcase',
      badge: 'Recomendado',
    },
    {
      value: 'enterprise',
      label: 'Corporativo',
      description: 'Requiere contrato marco.',
      icon: 'shield',
      disabled: true,
    },
  ];

  protected readonly shifts: readonly RadioOption[] = [
    { value: 'am', label: 'Matutino' },
    { value: 'pm', label: 'Vespertino' },
  ];

  /**
   * Una contraseña por nivel de fortaleza.
   *
   * Los cinco niveles de otro modo solo se alcanzan escribiendo hasta que
   * zxcvbn le atine a calificar cada uno, que no es algo que un catálogo
   * pueda mostrar en una captura fija.
   *
   * Las muestras se ELIGIERON POR MEDICIÓN, no adivinando: un primer
   * conjunto calificó 0-1-3-4-4 en el navegador, saltándose «Aceptable» y
   * repitiendo «Excelente», mientras que un zxcvbn puro en Node calificaba
   * los mismos strings distinto — la app carga más diccionarios, así que
   * aquí la misma contraseña se juzga más adivinable. Las etiquetas de
   * abajo son los niveles que la app en ejecución realmente renderiza.
   */
  protected readonly passwordSamples = [
    { label: 'Muy débil', password: '123456' },
    { label: 'Débil', password: 'empresa2024' },
    { label: 'Aceptable', password: 'tornillo.94' },
    { label: 'Buena', password: 'Almacen.2026' },
    { label: 'Excelente', password: 'caja verde con nueve tornillos' },
  ];

  protected onCodeComplete(code: string): void {
    this.lastCode.set(code);
  }
}
