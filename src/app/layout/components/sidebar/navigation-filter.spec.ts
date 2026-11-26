import { NavSection } from './navigation.model';
import { filterNavigation } from './navigation-filter';

const SECTIONS: readonly NavSection[] = [
  {
    title: 'Operaciones',
    items: [
      {
        id: 'produccion',
        label: 'Producción',
        children: [
          { id: 'scrap', label: 'Scrap', route: '/produccion/scrap' },
          { id: 'cambios', label: 'Control de cambios', route: '/produccion/cambios' },
        ],
      },
    ],
  },
  {
    title: 'Personal',
    items: [{ id: 'permisos', label: 'Permisos', route: '/rh/permisos' }],
  },
];

describe('filterNavigation', () => {
  it('conserva un grupo con solo los descendientes que coinciden', () => {
    const result = filterNavigation(SECTIONS, 'scrap');

    expect(result).toHaveLength(1);
    expect(result[0].items[0].children?.map((child) => child.id)).toEqual(['scrap']);
  });

  it('prefiere los descendientes que coinciden aunque el grupo también coincida', () => {
    const attendance: readonly NavSection[] = [
      {
        items: [
          {
            id: 'asistencia',
            label: 'Asistencia',
            children: [
              { id: 'lista', label: 'Lista de asistencias', route: '/rh/asistencia/lista' },
              { id: 'incidencias', label: 'Incidencias', route: '/rh/asistencia/incidencias' },
            ],
          },
        ],
      },
    ];

    const result = filterNavigation(attendance, 'asist');

    expect(result[0].items[0].children?.map((child) => child.id)).toEqual(['lista']);
  });

  it('conserva un grupo entero cuando solo coincide su propio nombre', () => {
    const result = filterNavigation(SECTIONS, 'produccion');

    expect(result[0].items[0].children).toHaveLength(2);
  });

  it('descarta las secciones sin coincidencias', () => {
    expect(filterNavigation(SECTIONS, 'permisos').map((section) => section.title)).toEqual([
      'Personal',
    ]);
  });

  it('devuelve vacío cuando nada coincide', () => {
    expect(filterNavigation(SECTIONS, 'zzz')).toEqual([]);
  });
});
