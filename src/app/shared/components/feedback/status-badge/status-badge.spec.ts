import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { StatusTone } from '@shared/models/status-tone.model';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusBadge } from './status-badge';

@Component({
  selector: 'app-status-badge-test-host',
  imports: [StatusBadge],
  template: ` <app-status-badge [tone]="tone()" [label]="label()" [pulse]="pulse()" /> `,
})
class StatusBadgeTestHost {
  readonly tone = signal<StatusTone>('success');
  readonly label = signal('Activo');
  readonly pulse = signal<boolean | undefined>(undefined);
}

describe('StatusBadge (Status Radar Pulse)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }).compileComponents();
  });

  it('activa el pulso de radar automáticamente cuando tone es "success" y lo desactiva en otros tonos', () => {
    const fixture = TestBed.createComponent(StatusBadgeTestHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-status-indicator circle')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.indicator__wave')).not.toBeNull();

    host.tone.set('neutral');
    host.label.set('Inactivo');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.indicator__wave')).toBeNull();
  });

  it('permite forzar u ocultar el pulso mediante el input [pulse]', () => {
    const fixture = TestBed.createComponent(StatusBadgeTestHost);
    const host = fixture.componentInstance;
    host.tone.set('success');
    host.pulse.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.indicator__wave')).toBeNull();

    host.tone.set('warning');
    host.pulse.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.indicator__wave')).not.toBeNull();
  });

  it('conserva la etiqueta textual al desactivar el pulso', () => {
    const fixture = TestBed.createComponent(StatusBadgeTestHost);
    fixture.componentInstance.pulse.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activo');
    expect(
      fixture.nativeElement.querySelector('app-status-indicator')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });
});
