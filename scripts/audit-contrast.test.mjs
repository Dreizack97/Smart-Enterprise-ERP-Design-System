import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseColour, report } from './audit-contrast.mjs';
import { readThemeTokens } from './token-map.mjs';

test('resuelve el alfa de hexadecimales de cuatro y ocho dígitos', () => {
  assert.deepEqual(parseColour('#fff8'), { r: 255, g: 255, b: 255, a: 136 / 255 });
  assert.deepEqual(parseColour('#eaeaeef5'), { r: 234, g: 234, b: 238, a: 245 / 255 });
  assert.equal(parseColour('#12345'), null);
});

test('detecta una regresión conocida del texto secundario', () => {
  const tokens = new Map(readThemeTokens()[0].tokens);
  tokens.set('--ink-muted', '#ffffff');
  assert.ok(
    report('defecto conocido', tokens).some(
      (row) => row.ink === '--ink-muted' && row.surface === '--surface-1',
    ),
  );
});

test('aplica el umbral de icono sobre la superficie real del control', () => {
  const tokens = new Map([
    ['--surface-1', '#ffffff'],
    ['--surface-field', '#ffffff'],
    ['--field-toggle-ink-hover', '#888888'],
  ]);
  assert.deepEqual(report('icono', tokens), []);
  tokens.set('--field-toggle-ink-hover', '#bbbbbb');
  const [failure] = report('icono', tokens);
  assert.equal(failure.surface, '--surface-field');
  assert.equal(failure.minimum, 3);
});

test('el texto de requisitos se contrasta con el fondo del bloque de requisitos', () => {
  const tokens = new Map([
    ['--surface-1', '#ffffff'],
    ['--surface-3', '#000000'],
    ['--form-card-surface', '#000000'],
    ['--requirements-surface', '#ffffff'],
    ['--requirements-met-ink', '#ffffff'],
  ]);
  const failures = report('requisitos', tokens);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].surface, '--requirements-surface');
  assert.equal(failures[0].minimum, 4.5);
});

test('no omite una superficie expresada con alfa hexadecimal', () => {
  const tokens = new Map([
    ['--surface-1', '#ffffff'],
    ['--surface-3', '#ffffff80'],
    ['--ink-muted', '#ffffff'],
  ]);
  assert.ok(report('alfa', tokens).some((row) => row.surface === '--surface-3'));
});
