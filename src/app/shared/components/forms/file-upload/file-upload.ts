import {
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlError } from '@shared/models/form-control.model';
import { nextElementId } from '@shared/utils/element-id';
import { fieldTouchMarker } from '@shared/utils/field-touch';
import { Icon } from '@shared/components/media/icon/icon';

/** `avatar` es un selector redondo para una foto de perfil; `dropzone` acepta cualquier archivo. */
export type FileUploadVariant = 'avatar' | 'dropzone';

/** Lo que se sabe del archivo elegido, una vez que pasa la validación. */
interface SelectedFile {
  readonly name: string;
  readonly size: number;
  readonly isImage: boolean;
}

const BYTES_PER_MB = 1024 * 1024;

/**
 * Selector de archivos con arrastrar y soltar.
 *
 * Generalizado a partir del `image-upload` original: el dropzone acepta
 * cualquier tipo de archivo y solo construye una vista previa cuando el
 * archivo es una imagen. Leer un PDF de 20 MB a una URL de datos en base64
 * solo para mostrar un nombre de archivo sería un desperdicio, así que para
 * cualquier otra cosa conserva el nombre y el tamaño y le entrega el `File`
 * al padre a través de `fileSelected`.
 *
 * Cumple el contrato `FormValueControl` de Signal Forms y también funciona
 * suelto con `[(value)]`.
 */
@Component({
  selector: 'app-file-upload',
  imports: [Icon],
  templateUrl: './file-upload.html',
  // Dos variantes que casi no comparten reglas. El manual interno (1.3)
  // permite que un componente cargue más de una hoja de estilos, cada una
  // nombrada con una palabra descriptiva; eso mantiene cada archivo dentro
  // del presupuesto por componente en vez de subir el presupuesto para
  // esconder el tamaño.
  styleUrls: ['./file-upload.css', './file-upload-avatar.css', './file-upload-dropzone.css'],
  host: { '[class.is-disabled]': 'disabled()' },
})
export class FileUpload {
  /** Vista previa de la imagen actual, como URL de datos. Vacío para lo que no es imagen. */
  readonly value = model('');

  readonly variant = input<FileUploadVariant>('avatar');
  readonly label = input('Archivo');
  readonly hint = input('JPG, PNG, WEBP o GIF. Máximo 2 MB.');

  /** Tipos MIME o extensiones aceptadas, como el atributo nativo `accept`. */
  readonly accept = input('image/jpeg,image/png,image/webp,image/gif');

  readonly maxSizeBytes = input(2 * BYTES_PER_MB, { transform: numberAttribute });

  /** Iniciales mostradas en la variante avatar mientras no hay imagen. */
  readonly fallbackInitials = input('');

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly uploadId = input(nextElementId('file-upload'));
  readonly error = input('');
  readonly errors = input<readonly ControlError[]>([]);
  readonly touched = input(false, { transform: booleanAttribute });

  /** Emitido cuando se elige un archivo válido. */
  readonly fileSelected = output<File>();

  /** Emitido cuando se limpia la selección. */
  readonly fileCleared = output<void>();

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly markTouched = fieldTouchMarker();
  private reader: FileReader | null = null;

  protected readonly dragging = signal(false);
  protected readonly localError = signal('');
  protected readonly reading = signal(false);
  /** Permite impedir el envío del formulario mientras se prepara la selección de imagen. */
  readonly processing = computed(() => this.reading());
  protected readonly selected = signal<SelectedFile | null>(null);

  protected readonly inputId = computed(() => `${this.uploadId()}-input`);
  protected readonly errorId = computed(() => `${this.uploadId()}-error`);
  protected readonly hintId = computed(() => `${this.uploadId()}-hint`);

  /** Un rechazo encontrado aquí siempre gana: es sobre el archivo recién soltado. */
  protected readonly activeError = computed(() => {
    if (this.localError()) {
      return this.localError();
    }
    if (this.error()) {
      return this.error();
    }
    return this.touched() ? (this.errors()[0]?.message ?? '') : '';
  });

  protected readonly hasPreview = computed(() => this.value().trim().length > 0);
  protected readonly hasFile = computed(() => this.hasPreview() || this.selected() !== null);

  protected readonly sizeLabel = computed(() => {
    const file = this.selected();
    if (!file) {
      return '';
    }
    const kb = file.size / 1024;
    return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseReader());
  }

  protected openPicker(): void {
    if (!this.disabled()) {
      this.fileInput().nativeElement.click();
    }
  }

  protected onFileChange(event: Event): void {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    if (file) {
      this.processFile(file);
    }
    // Permite volver a elegir el mismo archivo después de limpiarlo.
    field.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  protected clear(event?: Event): void {
    if (this.disabled()) {
      return;
    }
    event?.stopPropagation();
    this.releaseReader();
    this.value.set('');
    this.selected.set(null);
    this.localError.set('');
    this.markTouched();
    this.fileCleared.emit();
  }

  private processFile(file: File): void {
    if (this.disabled()) {
      return;
    }
    this.markTouched();

    if (this.reader) {
      this.releaseReader();
      this.selected.set(null);
    }

    if (!this.isAccepted(file)) {
      this.localError.set('Formato de archivo no admitido.');
      return;
    }

    if (file.size > this.maxSizeBytes()) {
      const limit = (this.maxSizeBytes() / BYTES_PER_MB).toFixed(0);
      this.localError.set(`El archivo supera el tamaño máximo de ${limit} MB.`);
      return;
    }

    this.localError.set('');
    const isImage = file.type.startsWith('image/');
    this.selected.set({ name: file.name, size: file.size, isImage });

    if (!isImage) {
      // Nada que previsualizar: el nombre y el tamaño son lo que hay que mostrar.
      this.value.set('');
      this.fileSelected.emit(file);
      return;
    }

    const reader = new FileReader();
    this.reader = reader;
    this.reading.set(true);
    reader.onload = () => {
      if (this.reader !== reader) {
        return;
      }
      this.releaseReader();
      this.value.set(reader.result as string);
      this.fileSelected.emit(file);
    };
    const fail = () => {
      if (this.reader !== reader) {
        return;
      }
      this.releaseReader();
      this.selected.set(null);
      this.localError.set('No se pudo leer el archivo.');
    };
    reader.onerror = fail;
    reader.onabort = () => {
      if (this.reader !== reader) {
        return;
      }
      this.releaseReader();
      this.selected.set(null);
    };
    try {
      reader.readAsDataURL(file);
    } catch {
      fail();
    }
  }

  /** Desvincula la lectura vigente antes de abortarla para impedir resultados y errores de selecciones anteriores. */
  private releaseReader(): void {
    const reader = this.reader;
    this.reader = null;
    this.reading.set(false);
    if (reader) {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      if (reader.readyState === FileReader.LOADING) {
        reader.abort();
      }
    }
  }

  /**
   * Refleja cómo el navegador lee `accept`: un tipo MIME exacto, una
   * extensión, o una familia comodín como `image/*`.
   */
  private isAccepted(file: File): boolean {
    const patterns = this.accept()
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

    if (patterns.length === 0) {
      return true;
    }

    const type = file.type.toLowerCase();
    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;

    return patterns.some((pattern) => {
      if (pattern.startsWith('.')) {
        return pattern === extension;
      }
      if (pattern.endsWith('/*')) {
        return type.startsWith(pattern.slice(0, -1));
      }
      return pattern === type;
    });
  }
}
