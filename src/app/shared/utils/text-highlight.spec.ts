import { matchesQuery, normalizeText, segmentMatchedText } from './text-highlight';

describe('normalizeText', () => {
  it('quita acentos y pasa a minúsculas sin cambiar la longitud', () => {
    const text = 'Recibo de Nómina';

    expect(normalizeText(text)).toBe('recibo de nomina');
    expect(normalizeText(text)).toHaveLength(text.length);
  });
});

describe('matchesQuery', () => {
  it('ignora mayúsculas y acentos', () => {
    expect(matchesQuery('Recibo de nómina', 'NOMINA')).toBe(true);
  });

  it('exige todas las palabras, en cualquier orden', () => {
    expect(matchesQuery('Lista de asistencias', 'asist lista')).toBe(true);
    expect(matchesQuery('Lista de asistencias', 'asist turnos')).toBe(false);
  });

  it('una consulta vacía coincide con todo', () => {
    expect(matchesQuery('Inicio', '   ')).toBe(true);
  });
});

describe('segmentMatchedText', () => {
  it('marca la coincidencia conservando el texto original', () => {
    expect(segmentMatchedText('Nómina', 'nom')).toEqual([
      { text: 'Nóm', match: true },
      { text: 'ina', match: false },
    ]);
  });

  it('une coincidencias que se enciman', () => {
    expect(segmentMatchedText('abcdef', 'abc cde')).toEqual([
      { text: 'abcde', match: true },
      { text: 'f', match: false },
    ]);
  });

  it('sin consulta devuelve el texto completo sin marcar', () => {
    expect(segmentMatchedText('Inicio', '')).toEqual([{ text: 'Inicio', match: false }]);
  });
});
