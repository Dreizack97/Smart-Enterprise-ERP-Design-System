import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppIcons } from '@core/icons/lucide-icons';
import { describe, expect, it } from 'vitest';
import { StatusIndicator } from './status-indicator';

describe('StatusIndicator', () => {
  it('mantiene el indicador decorativo y permite retirar el pulso sin perder el punto', () => {
    TestBed.configureTestingModule({
      imports: [StatusIndicator],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    });
    const fixture = TestBed.createComponent(StatusIndicator);
    fixture.componentRef.setInput('tone', 'success');
    fixture.componentRef.setInput('pulse', true);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('data-tone')).toBe('green');
    expect(element.querySelector('svg')?.getAttribute('focusable')).toBe('false');
    expect(element.querySelectorAll('circle')).toHaveLength(2);

    fixture.componentRef.setInput('tone', 'neutral');
    fixture.componentRef.setInput('pulse', false);
    fixture.detectChanges();

    expect(element.getAttribute('data-tone')).toBe('neutral');
    expect(element.querySelector('.indicator__wave')).toBeNull();
    expect(element.querySelectorAll('circle')).toHaveLength(1);
  });
});
