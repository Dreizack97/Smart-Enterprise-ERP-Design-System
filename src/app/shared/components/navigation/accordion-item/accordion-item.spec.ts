import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { beforeEach, describe, expect, it } from 'vitest';
import { Accordion } from '../accordion/accordion';
import { AccordionItem } from './accordion-item';

/** Comprueba el contenido local y la coordinación de secciones mediante el grupo real. */
@Component({
  imports: [Accordion, AccordionItem],
  template: `
    <app-accordion [multiExpandable]="multi()" [disabled]="groupDisabled()">
      <app-accordion-item
        label="Captura"
        [summary]="summary()"
        [(expanded)]="open"
        [preserveContent]="preserve()"
        [modified]="modified()"
        [disabled]="disabled()"
      >
        <input aria-label="Captura pendiente" />
      </app-accordion-item>
      <app-accordion-item label="Otra sección" [(expanded)]="secondOpen"
        ><p>Contenido secundario</p></app-accordion-item
      >
    </app-accordion>
  `,
})
class AccordionForm {
  readonly open = signal(true);
  readonly preserve = signal(true);
  readonly modified = signal(false);
  readonly summary = signal('Datos adicionales');
  readonly disabled = signal(false);
  readonly groupDisabled = signal(false);
  readonly multi = signal(true);
  readonly secondOpen = signal(false);
}

describe('AccordionItem en formularios', () => {
  let fixture: ComponentFixture<AccordionForm>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccordionForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AccordionForm);
    root = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('sincroniza la apertura externa, el clic y sus atributos accesibles', async () => {
    const trigger = root.querySelector<HTMLButtonElement>('button')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    trigger.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('[role="region"]')?.id).toBe(trigger.getAttribute('aria-controls'));
    expect(root.querySelector('[role="region"]')?.getAttribute('aria-labelledby')).toBe(trigger.id);
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(root.querySelector('[role="region"]')?.hasAttribute('inert')).toBe(true);
  });

  it('conserva el nodo y el texto local al plegar una captura', async () => {
    const input = root.querySelector('input')!;
    input.value = 'Sin confirmar';
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('input')).toBe(input);
    expect(input.closest('[inert]')).not.toBeNull();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('input')?.value).toBe('Sin confirmar');
    expect(input.closest('[inert]')).toBeNull();
  });

  it('actualiza y retira el resumen y el aviso de cambios sin cambiar la apertura', () => {
    expect(root.querySelector('.trigger__modified')).toBeNull();
    fixture.componentInstance.modified.set(true);
    fixture.detectChanges();
    expect(root.querySelector('button')?.textContent).toContain('Datos adicionales');
    expect(root.querySelector('button')?.textContent).toContain('Sin guardar');
    fixture.componentInstance.summary.set('Resumen actualizado');
    fixture.detectChanges();
    expect(root.querySelector('.trigger__summary')?.textContent).toBe('Resumen actualizado');
    fixture.componentInstance.summary.set('');
    fixture.componentInstance.modified.set(false);
    fixture.detectChanges();
    expect(root.querySelector('.trigger__summary')).toBeNull();
    expect(root.querySelector('.trigger__modified')).toBeNull();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('inserta el contenido inicialmente cerrado al abrirlo por primera vez', async () => {
    const closedFixture = TestBed.createComponent(AccordionForm);
    closedFixture.componentInstance.open.set(false);
    closedFixture.detectChanges();
    await closedFixture.whenStable();
    expect(closedFixture.nativeElement.querySelector('input')).toBeNull();
    closedFixture.componentInstance.open.set(true);
    closedFixture.detectChanges();
    await closedFixture.whenStable();
    expect(closedFixture.nativeElement.querySelector('input')).not.toBeNull();
  });

  it('retira el contenido del panel cerrado cuando no se solicita conservarlo', async () => {
    fixture.componentInstance.preserve.set(false);
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('input')).toBeNull();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(root.querySelector('input')).not.toBeNull();
  });

  it('bloquea el clic de una sección deshabilitada y permite el de otra habilitada', async () => {
    fixture.componentInstance.open.set(false);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const triggers = root.querySelectorAll<HTMLButtonElement>('button');
    expect(triggers[0].getAttribute('aria-disabled')).toBe('true');
    triggers[0].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    triggers[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.secondOpen()).toBe(true);
  });

  it('respeta la deshabilitación del grupo completo', async () => {
    fixture.componentInstance.open.set(false);
    fixture.componentInstance.groupDisabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    for (const trigger of root.querySelectorAll<HTMLButtonElement>('button')) {
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
      trigger.click();
    }
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.secondOpen()).toBe(false);
  });

  it('sincroniza el cierre de la sección anterior en un grupo de apertura única', async () => {
    fixture.componentInstance.multi.set(false);
    fixture.detectChanges();
    const input = root.querySelector('input')!;
    input.value = 'Captura conservada';
    root.querySelectorAll<HTMLButtonElement>('button')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.secondOpen()).toBe(true);
    expect(root.querySelector('input')).toBe(input);
    expect(input.closest('[inert]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.secondOpen()).toBe(false);
    expect(root.querySelector('input')?.value).toBe('Captura conservada');
  });

  it('mantiene varias secciones abiertas cuando el grupo lo permite', async () => {
    root.querySelectorAll<HTMLButtonElement>('button')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(fixture.componentInstance.secondOpen()).toBe(true);
    const triggers = [...root.querySelectorAll<HTMLButtonElement>('button')];
    const panels = [...root.querySelectorAll<HTMLElement>('[role="region"]')];
    expect(new Set(triggers.map((trigger) => trigger.id)).size).toBe(2);
    expect(new Set(panels.map((panel) => panel.id)).size).toBe(2);
    for (const trigger of triggers) {
      const panel = panels.find(
        (candidate) => candidate.id === trigger.getAttribute('aria-controls'),
      );
      expect(panel?.getAttribute('aria-labelledby')).toBe(trigger.id);
      expect(panel?.hasAttribute('inert')).toBe(false);
    }
  });

  it.each([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'])(
    'conserva la acción nativa de %j dentro de un campo sin accionar el acordeón',
    async (key) => {
      const trigger = root.querySelector<HTMLButtonElement>('button')!;
      trigger.focus();
      const input = root.querySelector('input')!;
      input.focus();
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      input.dispatchEvent(event);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(input);
      expect(fixture.componentInstance.open()).toBe(true);
      expect(fixture.componentInstance.secondOpen()).toBe(false);
    },
  );

  it('deja llegar Tab, Escape y los atajos modificados a los diálogos y controles exteriores', () => {
    const input = root.querySelector('input')!;
    const received: KeyboardEvent[] = [];
    const listener = (event: KeyboardEvent): void => {
      received.push(event);
    };
    const keys: readonly KeyboardEventInit[] = [
      { key: 'Tab' },
      { key: 'Escape' },
      { key: 'b', ctrlKey: true },
      { key: 'Home', ctrlKey: true },
      { key: ' ', shiftKey: true },
    ];
    document.addEventListener('keydown', listener);
    try {
      for (const key of keys) {
        const event = new KeyboardEvent('keydown', { ...key, bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(received).toContain(event);
      }
    } finally {
      document.removeEventListener('keydown', listener);
    }
  });

  it.each(['Enter', ' '])('permite abrir y cerrar desde el teclado con %j', async (key) => {
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = root.querySelector<HTMLButtonElement>('button')!;
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
