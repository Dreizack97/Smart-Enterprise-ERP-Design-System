import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { DatePicker } from '@shared/components/forms/date-picker/date-picker';
import { Tabs } from '@shared/components/navigation/tabs/tabs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppTabPanel } from './tab-panel';

@Component({
  imports: [Tabs, AppTabPanel, DatePicker],
  template: `
    <app-tabs [tabs]="tabs" [(selected)]="selected">
      <app-tab-panel value="a" [preserveContent]="preserve()">
        <app-date-picker label="Fecha" />
      </app-tab-panel>
      <app-tab-panel value="b">
        <p>Historial</p>
      </app-tab-panel>
    </app-tabs>
  `,
})
class TabHost {
  readonly selected = signal<string | undefined>('a');
  readonly preserve = signal(true);
  readonly tabs = [
    { value: 'a', label: 'Captura' },
    { value: 'b', label: 'Historial' },
  ];
}

describe('AppTabPanel: preservación de contenido entre pestañas', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it('conserva la instancia del input y el texto inválido de una fecha visitada cuando preserveContent está activo', async () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '31/02/2026';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    fixture.componentInstance.selected.set('b');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('input')).toBe(input);

    fixture.componentInstance.selected.set('a');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('31/02/2026');
  });

  it('desmonta el contenido al cambiar de pestaña cuando preserveContent es false (por defecto)', async () => {
    const fixture = TestBed.createComponent(TabHost);
    fixture.componentInstance.preserve.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input')).not.toBeNull();

    fixture.componentInstance.selected.set('b');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });
});
