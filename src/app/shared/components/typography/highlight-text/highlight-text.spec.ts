import { TestBed } from '@angular/core/testing';
import { HighlightText } from './highlight-text';

function render(text: string, query: string): HTMLElement {
  const fixture = TestBed.createComponent(HighlightText);
  fixture.componentRef.setInput('text', text);
  fixture.componentRef.setInput('query', query);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HighlightText', () => {
  it('no agrega espacios entre los tramos marcados y los que no', () => {
    const host = render('Asistencia', 'asist');

    expect(host.textContent).toBe('Asistencia');
  });

  it('marca solo la coincidencia, con el texto original', () => {
    const marks = render('Recibo de nómina', 'nomina').querySelectorAll('mark');

    expect(Array.from(marks, (mark) => mark.textContent)).toEqual(['nómina']);
  });
});
