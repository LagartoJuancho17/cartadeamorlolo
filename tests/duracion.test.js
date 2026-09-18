'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const d = require('../js/core/duracion.js');

test('parsea YYYY-MM-DD como fecha local, no UTC', () => {
  const f = d.parsearFecha('2024-09-18');
  assert.equal(f.getFullYear(), 2024);
  assert.equal(f.getMonth(), 8);
  assert.equal(f.getDate(), 18);   // en UTC daría 17 en Argentina
  assert.equal(f.getHours(), 0);
});

test('parsea fecha con hora', () => {
  const f = d.parsearFecha('2024-09-18T21:30');
  assert.equal(f.getHours(), 21);
  assert.equal(f.getMinutes(), 30);
});

test('rechaza basura y fechas imposibles', () => {
  assert.equal(d.parsearFecha('18/09/2024'), null);
  assert.equal(d.parsearFecha('2024-02-30'), null);   // febrero no tiene 30
  assert.equal(d.parsearFecha('2024-13-01'), null);
  assert.equal(d.parsearFecha(''), null);
  assert.equal(d.parsearFecha(null), null);
});

test('acepta 29 de febrero sólo en año bisiesto', () => {
  assert.notEqual(d.parsearFecha('2024-02-29'), null);
  assert.equal(d.parsearFecha('2023-02-29'), null);
});

test('dos años exactos', () => {
  const r = d.calcular('2024-09-18', new Date(2026, 8, 18, 0, 0, 0));
  assert.equal(r.anios, 2);
  assert.equal(r.meses, 0);
  assert.equal(r.dias, 0);
  assert.equal(r.diasTotales, 730);   // 2024 fue bisiesto: 366 + 364
});

test('presta días del mes anterior al calcular', () => {
  // 2025-01-15 -> 2026-03-01 = 1 año, 1 mes y 14 días (febrero 2026 = 28 días)
  const r = d.calcular('2025-01-15', new Date(2026, 2, 1));
  assert.equal(r.anios, 1);
  assert.equal(r.meses, 1);
  assert.equal(r.dias, 14);
});

test('presta meses cuando el mes destino es menor', () => {
  const r = d.calcular('2024-11-30', new Date(2026, 0, 5));  // 5 ene 2026
  assert.equal(r.anios, 1);
  assert.equal(r.meses, 1);
  assert.equal(r.dias, 6);   // 30 nov +1a = 30 nov 25, +1m = 30 dic, +6d = 5 ene
});

test('presta a través del cambio de año en el mes anterior', () => {
  // 2024-12-31 -> 2025-01-01 : un día
  const r = d.calcular('2024-12-31', new Date(2025, 0, 1));
  assert.equal(r.anios, 0);
  assert.equal(r.meses, 0);
  assert.equal(r.dias, 1);
  assert.equal(r.diasTotales, 1);
});

test('descuenta el día cuando todavía no llegó la hora', () => {
  const r = d.calcular('2024-09-18T22:00', new Date(2026, 8, 18, 10, 0, 0));
  assert.equal(r.anios, 1);
  assert.equal(r.meses, 11);
  assert.equal(r.dias, 30);
  assert.equal(r.horas, 12);
});

test('el conteo de días no se rompe con el horario de verano', () => {
  // Rango largo que cruza varios cambios de hora en ambos hemisferios.
  const r = d.calcular('2020-01-01', new Date(2026, 0, 1));
  assert.equal(r.diasTotales, 2192);  // 2020 y 2024 bisiestos
});

test('fecha futura no devuelve negativos', () => {
  const r = d.calcular('2030-01-01', new Date(2026, 0, 1));
  assert.equal(r.futuro, true);
  assert.ok(r.anios >= 0 && r.meses >= 0 && r.dias >= 0);
  assert.equal(r.anios, 4);
});

test('mismo instante = todo en cero', () => {
  const ahora = new Date(2026, 5, 10, 12, 0, 0);
  const r = d.calcular('2026-06-10T12:00', ahora);
  assert.deepEqual(
    [r.anios, r.meses, r.dias, r.horas, r.minutos, r.segundos, r.diasTotales],
    [0, 0, 0, 0, 0, 0, 0]
  );
});

test('fecha inválida devuelve null en vez de NaN', () => {
  assert.equal(d.calcular('no soy fecha', new Date()), null);
});

test('formato largo en castellano', () => {
  assert.equal(d.fechaLarga('2024-09-18'), '18 de septiembre de 2024');
  assert.equal(d.fechaLarga('2023-01-01'), '1 de enero de 2023');
});

test('enPalabras saltea las unidades en cero y usa singular', () => {
  assert.equal(d.enPalabras({ anios: 2, meses: 0, dias: 1 }), '2 años y 1 día');
  assert.equal(d.enPalabras({ anios: 1, meses: 1, dias: 1 }), '1 año, 1 mes y 1 día');
  assert.equal(d.enPalabras({ anios: 0, meses: 0, dias: 5 }), '5 días');
  assert.equal(d.enPalabras({ anios: 0, meses: 0, dias: 0 }), 'hoy mismo');
});

test('reloj con dos dígitos', () => {
  assert.equal(d.reloj({ horas: 7, minutos: 4, segundos: 9 }), '07:04:09');
  assert.equal(d.reloj(null), '00:00:00');
});

test('miles con punto', () => {
  assert.equal(d.miles(730), '730');
  assert.equal(d.miles(1234), '1.234');
  assert.equal(d.miles(1234567), '1.234.567');
});

test('días del mes conoce los bisiestos', () => {
  assert.equal(d.diasDelMes(2024, 1), 29);
  assert.equal(d.diasDelMes(2025, 1), 28);
  assert.equal(d.diasDelMes(2025, 3), 30);
});
