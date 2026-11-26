import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { Combobox } from '@shared/components/forms/combobox/combobox';
import { Modal } from './modal';

/** Consumidor mínimo para ejercitar la proyección, los diálogos superpuestos y los eventos del DOM. */
@Component({
  selector: 'app-modal-test-host',
  imports: [Modal, Combobox],
  template: `
    <button id="opener" (click)="open.set(true)">Abrir</button>
    <app-modal [(open)]="open" title="Formulario" [dirty]="dirty()" [dismissible]="dismissible()">
      <button id="field">Campo</button>
      <app-combobox label="Departamento" />
      @if (footer()) {
        <ng-container footer><button id="save">Guardar</button></ng-container>
      }
    </app-modal>
    <app-modal [(open)]="secondOpen" title="Detalle"><button>Detalle</button></app-modal>
  `,
})
class ModalTestHost {
  readonly open = signal(false);
  readonly secondOpen = signal(false);
  readonly dirty = signal(false);
  readonly dismissible = signal(true);
  readonly footer = signal(true);
}

describe('Modal', () => {
  let fixture: ComponentFixture<ModalTestHost>;
  let host: ModalTestHost;
  let modal: Modal;
  let frames: Map<number, FrameRequestCallback>;

  beforeEach(async () => {
    frames = new Map();
    let frameId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    await TestBed.configureTestingModule({
      imports: [ModalTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalTestHost);
    host = fixture.componentInstance;
    await fixture.whenStable();
    modal = fixture.debugElement.query(By.directive(Modal)).componentInstance;
    host.open.set(true);
    await fixture.whenStable();
  });
  afterEach(() => vi.restoreAllMocks());

  function paint(): void {
    for (let i = 0; i < 2; i++) {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(0));
    }
  }

  function escape(target: EventTarget = document): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  }

  it('Escape cierra únicamente el último modal abierto', async () => {
    host.secondOpen.set(true);
    await fixture.whenStable();
    escape();
    await fixture.whenStable();
    expect(host.secondOpen()).toBe(false);
    expect(host.open()).toBe(true);
    escape();
    await fixture.whenStable();
    expect(host.open()).toBe(false);
  });

  it('Escape cancela la confirmación y conserva el formulario con cambios', async () => {
    host.dirty.set(true);
    await fixture.whenStable();
    modal.requestClose();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('app-confirm-dialog .is-open')).not.toBeNull();
    escape();
    await fixture.whenStable();
    expect(host.open()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-confirm-dialog .is-open')).toBeNull();
  });

  it('un combobox abierto consume Escape antes que el modal', async () => {
    const combobox = fixture.debugElement.query(By.directive(Combobox))
      .componentInstance as Combobox;
    // Comprueba la propagación de la tecla sin depender de la geometría del popup en jsdom.
    combobox['expanded'].set(true);
    escape(fixture.nativeElement.querySelector('app-combobox input'));
    expect(combobox['expanded']()).toBe(false);
    await fixture.whenStable();
    expect(host.open()).toBe(true);
  });

  it('no ejecuta una salida interna si se cancela la confirmación', async () => {
    host.dirty.set(true);
    await fixture.whenStable();
    const exit = vi.fn();
    modal.requestDiscard(exit);
    await fixture.whenStable();
    escape();
    await fixture.whenStable();
    expect(exit).not.toHaveBeenCalled();
    expect(host.open()).toBe(true);
  });

  it('revalida el bloqueo de guardado antes de confirmar el descarte', async () => {
    host.dirty.set(true);
    await fixture.whenStable();
    const exit = vi.fn();
    modal.requestDiscard(exit);
    await fixture.whenStable();
    host.dismissible.set(false);
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll(
      'app-confirm-dialog .is-open button',
    ) as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    await fixture.whenStable();
    expect(exit).not.toHaveBeenCalled();
    expect(host.open()).toBe(true);
  });

  it('proyecta el footer condicional fuera del cuerpo del modal', async () => {
    const overlay = fixture.nativeElement.querySelector('app-modal > .overlay') as HTMLElement;
    expect(overlay.querySelector('.panel__footer #save')).not.toBeNull();
    expect(overlay.querySelector('.panel__body #save')).toBeNull();
    host.footer.set(false);
    await fixture.whenStable();
    expect(overlay.querySelector('.panel__footer #save')).toBeNull();
  });

  it('devuelve el foco a quien abrió el modal', async () => {
    host.open.set(false);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    host.open.set(true);
    await fixture.whenStable();
    paint();
    expect(
      fixture.nativeElement
        .querySelector('app-modal > .overlay .panel')
        .contains(document.activeElement),
    ).toBe(true);
    modal.requestClose();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('un frame pendiente no roba el foco después de cerrar', async () => {
    host.open.set(false);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLButtonElement;
    opener.focus();
    paint();
    expect(document.activeElement).toBe(opener);
  });
});
