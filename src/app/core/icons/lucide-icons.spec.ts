import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Icon } from '@shared/components/media/icon/icon';
import { APP_ICON_DATA } from './app-icon-data';
import { ICON_NAMES, provideAppIcons } from './lucide-icons';

/** Valida todos los iconos registrados usando el componente dinámico real. */
@Component({
  selector: 'app-icons-test-host',
  imports: [Icon],
  template: `
    @for (name of names; track name) {
      <app-icon [name]="name" />
    }
  `,
})
class IconsTestHost {
  readonly names = ICON_NAMES;
}

describe('Catálogo de iconos como datos', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [IconsTestHost],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppIcons(),
      ],
    }),
  );

  it('conserva todos los nombres registrados y sus dibujos', async () => {
    const registered = new Set(
      APP_ICON_DATA.flatMap((icon) => [icon.name, ...(icon.aliases ?? [])]),
    );
    for (const name of ICON_NAMES) expect(registered.has(name)).toBe(true);
    const fixture = TestBed.createComponent(IconsTestHost);
    await fixture.whenStable();
    const icons = [...fixture.nativeElement.querySelectorAll('app-icon svg')] as SVGElement[];
    expect(icons.length).toBe(ICON_NAMES.length);
    for (const icon of icons)
      expect(icon.querySelector('path,line,polyline,polygon,circle,rect,ellipse')).not.toBeNull();
  });
});
