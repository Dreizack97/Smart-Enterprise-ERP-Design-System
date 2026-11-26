import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileUpload } from './file-upload';

/** Controla el orden de finalización de las lecturas sin acceder a los métodos internos del selector. */
class ControlledFileReader extends FileReader {
  static instances: ControlledFileReader[] = [];
  aborted = false;
  file: Blob | null = null;

  constructor() {
    super();
    ControlledFileReader.instances.push(this);
  }

  /** Deja pendiente la lectura hasta que la prueba simule su resultado. */
  override readAsDataURL(file: Blob): void {
    this.file = file;
    this.setResult(null, FileReader.LOADING);
  }

  /** Simula la finalización correcta de la lectura actual. */
  resolve(result: string): void {
    this.setResult(result, FileReader.DONE);
    this.onload?.(this.event('load'));
  }

  /** Simula el fallo asíncrono de la lectura actual. */
  reject(): void {
    this.setResult(null, FileReader.DONE);
    this.onerror?.(this.event('error'));
  }

  /** Reproduce la notificación de cancelación que genera el navegador. */
  override abort(): void {
    this.aborted = true;
    this.setResult(null, FileReader.DONE);
    this.onabort?.(this.event('abort'));
  }

  /** Construye el evento con el mismo emisor que tendría una notificación nativa. */
  event(type: string): ProgressEvent<FileReader> {
    const event = new ProgressEvent(type) as ProgressEvent<FileReader>;
    Object.defineProperty(event, 'target', { value: this });
    return event;
  }

  /** Actualiza las propiedades de solo lectura que normalmente administra FileReader. */
  private setResult(result: string | null, readyState: FileReader['readyState']): void {
    Object.defineProperties(this, {
      result: { configurable: true, value: result },
      readyState: { configurable: true, value: readyState },
    });
  }
}

describe('FileUpload: lecturas pendientes', () => {
  let fixture: ComponentFixture<FileUpload>;
  let input: HTMLInputElement;
  let selected: File[];

  beforeEach(async () => {
    ControlledFileReader.instances = [];
    vi.stubGlobal('FileReader', ControlledFileReader);
    await TestBed.configureTestingModule({
      imports: [FileUpload],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FileUpload);
    selected = [];
    fixture.componentInstance.fileSelected.subscribe((file) => selected.push(file));
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input[type="file"]');
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Selecciona un archivo mediante el evento nativo del campo. */
  function select(file: File): void {
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  /** Obtiene la lectura que controla el navegador simulado. */
  function reader(): ControlledFileReader {
    const active = ControlledFileReader.instances.at(-1);
    expect(active).toBeDefined();
    return active!;
  }

  it('comienza sin lecturas pendientes ni notificaciones de archivo', () => {
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(ControlledFileReader.instances).toHaveLength(0);
    expect(selected).toEqual([]);
  });

  it.each(['avatar', 'dropzone'] as const)(
    'informa del procesamiento hasta disponer de la imagen en la variante %s',
    (variant) => {
      fixture.componentRef.setInput('variant', variant);
      fixture.componentRef.setInput('value', 'data:image/png;base64,anterior');
      fixture.detectChanges();
      const file = new File(['imagen'], 'foto.png', { type: 'image/png' });
      const statesAtEmission: boolean[] = [];
      fixture.componentInstance.fileSelected.subscribe(() =>
        statesAtEmission.push(fixture.componentInstance.processing()),
      );

      select(file);
      expect(reader().file).toBe(file);
      expect(fixture.componentInstance.processing()).toBe(true);
      expect(fixture.componentInstance.value()).toBe('data:image/png;base64,anterior');
      expect(selected).toEqual([]);
      expect(fixture.nativeElement.querySelector('.upload__status')?.textContent).toContain(
        'Leyendo el archivo',
      );

      reader().resolve('data:image/png;base64,nueva');
      fixture.detectChanges();
      expect(fixture.componentInstance.processing()).toBe(false);
      expect(fixture.componentInstance.value()).toBe('data:image/png;base64,nueva');
      expect(selected).toEqual([file]);
      expect(statesAtEmission).toEqual([false]);
      expect(fixture.nativeElement.querySelector('.upload__status')).toBeNull();
    },
  );

  it('conserva el resultado al finalizar con el FileReader real del entorno', async () => {
    vi.unstubAllGlobals();
    const file = new File(['imagen'], 'foto.png', { type: 'image/png' });
    const completed = new Promise<File>((resolve) =>
      fixture.componentInstance.fileSelected.subscribe(resolve),
    );
    select(file);
    expect(fixture.componentInstance.processing()).toBe(true);
    expect(await completed).toBe(file);
    fixture.detectChanges();
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(fixture.componentInstance.value()).toBe('data:image/png;base64,aW1hZ2Vu');
    expect(selected).toEqual([file]);
  });

  it('libera el procesamiento si falla la lectura y conserva la vista previa confirmada', () => {
    fixture.componentRef.setInput('value', 'data:image/png;base64,anterior');
    fixture.detectChanges();
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    reader().reject();
    fixture.detectChanges();
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(fixture.componentInstance.value()).toBe('data:image/png;base64,anterior');
    expect(selected).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo leer el archivo.',
    );
  });

  it.each(['formato', 'tamaño'])(
    'rechaza un archivo por %s antes de iniciar su lectura',
    (reason) => {
      const file =
        reason === 'formato'
          ? new File(['texto'], 'foto.txt', { type: 'text/plain' })
          : new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'foto.png', { type: 'image/png' });
      select(file);
      expect(ControlledFileReader.instances).toHaveLength(0);
      expect(fixture.componentInstance.processing()).toBe(false);
      expect(selected).toEqual([]);
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        reason === 'formato' ? 'Formato de archivo no admitido.' : 'supera el tamaño máximo',
      );
    },
  );

  it.each(['avatar', 'dropzone'] as const)(
    'descarta una lectura tardía después de quitar la imagen en la variante %s',
    (variant) => {
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      let cleared = 0;
      fixture.componentInstance.fileCleared.subscribe(() => cleared++);
      select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
      const pending = reader();
      const queuedLoad = pending.onload!;
      const remove = fixture.nativeElement.querySelector(
        variant === 'avatar' ? '[aria-label="Quitar imagen"]' : '.preview__action--danger',
      ) as HTMLButtonElement;
      remove.click();
      fixture.detectChanges();
      expect(pending.aborted).toBe(true);
      expect(fixture.componentInstance.processing()).toBe(false);
      expect(cleared).toBe(1);

      pending.resolve('data:image/png;base64,obsoleta');
      queuedLoad.call(pending, pending.event('load'));
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe('');
      expect(selected).toEqual([]);
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
      expect(fixture.nativeElement.querySelector('.upload__status')).toBeNull();
    },
  );

  it('ignora los resultados y errores antiguos mientras procesa la sustitución y después de confirmarla', () => {
    select(new File(['primera'], 'primera.png', { type: 'image/png' }));
    const previous = reader();
    const queuedLoad = previous.onload!;
    const queuedError = previous.onerror!;
    const latest = new File(['segunda'], 'segunda.png', { type: 'image/png' });
    select(latest);
    const current = reader();
    expect(previous.aborted).toBe(true);
    expect(current).not.toBe(previous);

    previous.resolve('data:image/png;base64,obsoleta');
    queuedLoad.call(previous, previous.event('load'));
    queuedError.call(previous, previous.event('error'));
    fixture.detectChanges();
    expect(fixture.componentInstance.processing()).toBe(true);
    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();

    current.resolve('data:image/png;base64,actual');
    queuedLoad.call(previous, previous.event('load'));
    queuedError.call(previous, previous.event('error'));
    fixture.detectChanges();
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(fixture.componentInstance.value()).toBe('data:image/png;base64,actual');
    expect(selected).toEqual([latest]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('cancela la imagen pendiente al sustituirla por un documento que no requiere vista previa', () => {
    fixture.componentRef.setInput('variant', 'dropzone');
    fixture.componentRef.setInput('accept', 'image/png,application/pdf');
    fixture.detectChanges();
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    const pending = reader();
    const queuedLoad = pending.onload!;
    const document = new File(['documento'], 'contrato.pdf', { type: 'application/pdf' });
    select(document);
    pending.resolve('data:image/png;base64,obsoleta');
    queuedLoad.call(pending, pending.event('load'));
    fixture.detectChanges();
    expect(pending.aborted).toBe(true);
    expect(ControlledFileReader.instances).toHaveLength(1);
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).toEqual([document]);
    expect(fixture.nativeElement.querySelector('.preview__file-name')?.textContent).toContain(
      'contrato.pdf',
    );
  });

  it('cancela la lectura anterior aunque el archivo sustituto sea rechazado', () => {
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    const pending = reader();
    const queuedLoad = pending.onload!;
    select(new File(['texto'], 'foto.txt', { type: 'text/plain' }));
    pending.resolve('data:image/png;base64,obsoleta');
    queuedLoad.call(pending, pending.event('load'));
    fixture.detectChanges();
    expect(pending.aborted).toBe(true);
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(fixture.componentInstance.value()).toBe('');
    expect(selected).toEqual([]);
    expect(fixture.nativeElement.querySelector('[aria-label="Quitar imagen"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Formato de archivo no admitido.',
    );
  });

  it('libera la lectura si el navegador notifica su cancelación', () => {
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    reader().abort();
    fixture.detectChanges();
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(selected).toEqual([]);
    expect(fixture.nativeElement.querySelector('.upload__status')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Quitar imagen"]')).toBeNull();
  });

  it('libera el procesamiento cuando no puede iniciarse la lectura', () => {
    vi.spyOn(ControlledFileReader.prototype, 'readAsDataURL').mockImplementationOnce(() => {
      throw new DOMException('Lectura no disponible', 'NotReadableError');
    });
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(selected).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo leer el archivo.',
    );
  });

  it('aborta la lectura al destruir el control sin emitir un archivo después', () => {
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    const pending = reader();
    const queuedLoad = pending.onload!;
    fixture.destroy();
    pending.resolve('data:image/png;base64,obsoleta');
    queuedLoad.call(pending, pending.event('load'));
    expect(pending.aborted).toBe(true);
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(selected).toEqual([]);
  });

  it('ignora una selección enviada al campo deshabilitado', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    select(new File(['imagen'], 'foto.png', { type: 'image/png' }));
    expect(ControlledFileReader.instances).toHaveLength(0);
    expect(fixture.componentInstance.processing()).toBe(false);
    expect(selected).toEqual([]);
  });
});
