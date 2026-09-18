'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const e = require('../js/core/esquivar.js');

/** Generador pseudoaleatorio determinista, para que el test no sea flaky. */
function rngFijo(semilla) {
  let s = semilla >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CONTENEDOR = { ancho: 420, alto: 260 };
const BOTON = { ancho: 110, alto: 48 };
const SI = { x: 60, y: 180, ancho: 120, alto: 52 };

test('la posición siempre queda dentro del contenedor', () => {
  for (let semilla = 1; semilla <= 200; semilla++) {
    const p = e.nuevaPosicion({
      contenedor: CONTENEDOR,
      boton: BOTON,
      puntero: { x: (semilla * 37) % CONTENEDOR.ancho, y: (semilla * 53) % CONTENEDOR.alto },
      evitar: [SI],
      aleatorio: rngFijo(semilla)
    });
    assert.ok(p.x >= 0, `x=${p.x} se salió por la izquierda`);
    assert.ok(p.y >= 0, `y=${p.y} se salió por arriba`);
    assert.ok(p.x + BOTON.ancho <= CONTENEDOR.ancho, `x=${p.x} se salió por la derecha`);
    assert.ok(p.y + BOTON.alto <= CONTENEDOR.alto, `y=${p.y} se salió por abajo`);
  }
});

test('nunca se sienta encima del botón SÍ', () => {
  for (let semilla = 1; semilla <= 200; semilla++) {
    const p = e.nuevaPosicion({
      contenedor: CONTENEDOR,
      boton: BOTON,
      puntero: { x: 210, y: 130 },
      evitar: [SI],
      aleatorio: rngFijo(semilla)
    });
    const rect = { x: p.x, y: p.y, ancho: BOTON.ancho, alto: BOTON.alto };
    assert.equal(e.seSuperponen(rect, SI, e.SEPARACION), false,
      `semilla ${semilla}: quedó pisando el SÍ en ${JSON.stringify(p)}`);
  }
});

test('huye del puntero: nunca aterriza debajo del dedo', () => {
  const puntero = { x: 200, y: 120 };
  for (let semilla = 1; semilla <= 120; semilla++) {
    const p = e.nuevaPosicion({
      contenedor: CONTENEDOR,
      boton: BOTON,
      puntero,
      evitar: [SI],
      aleatorio: rngFijo(semilla)
    });
    const rect = { x: p.x, y: p.y, ancho: BOTON.ancho, alto: BOTON.alto };
    assert.ok(e.distanciaAlRect(puntero, rect) > 0,
      `semilla ${semilla}: el botón saltó justo bajo el puntero`);
  }
});

test('con el contenedor más chico que el botón no explota', () => {
  const p = e.nuevaPosicion({
    contenedor: { ancho: 40, alto: 20 },
    boton: BOTON,
    puntero: { x: 10, y: 10 },
    aleatorio: rngFijo(7)
  });
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.ok(p.x >= 0 && p.y >= 0);
});

test('si no hay ningún lugar libre igual devuelve una posición válida', () => {
  const todoOcupado = { x: -500, y: -500, ancho: 2000, alto: 2000 };
  const p = e.nuevaPosicion({
    contenedor: CONTENEDOR,
    boton: BOTON,
    puntero: { x: 10, y: 10 },
    evitar: [todoOcupado],
    aleatorio: rngFijo(3)
  });
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.ok(p.x + BOTON.ancho <= CONTENEDOR.ancho);
});

test('el mismo generador da siempre la misma posición', () => {
  const args = {
    contenedor: CONTENEDOR, boton: BOTON, puntero: { x: 100, y: 100 }, evitar: [SI]
  };
  const a = e.nuevaPosicion(Object.assign({}, args, { aleatorio: rngFijo(42) }));
  const b = e.nuevaPosicion(Object.assign({}, args, { aleatorio: rngFijo(42) }));
  assert.deepEqual(a, b);
});

test('debeEsquivar se activa cerca y no lejos', () => {
  const rect = { x: 100, y: 100, ancho: 100, alto: 40 };
  assert.equal(e.debeEsquivar({ x: 150, y: 120 }, rect, 70), true);   // adentro
  assert.equal(e.debeEsquivar({ x: 150, y: 160 }, rect, 70), true);   // 20px abajo
  assert.equal(e.debeEsquivar({ x: 150, y: 400 }, rect, 70), false);  // lejos
  assert.equal(e.debeEsquivar(null, rect, 70), false);
});

test('distanciaAlRect es 0 adentro y exacta afuera', () => {
  const rect = { x: 0, y: 0, ancho: 10, alto: 10 };
  assert.equal(e.distanciaAlRect({ x: 5, y: 5 }, rect), 0);
  assert.equal(e.distanciaAlRect({ x: 13, y: 5 }, rect), 3);
  assert.equal(e.distanciaAlRect({ x: 13, y: 14 }, rect), 5);  // 3-4-5
});

test('las burlas escalan y después se quedan en la última', () => {
  assert.equal(e.burla(0), 'no');
  assert.equal(e.burla(1), 'nop');
  assert.equal(e.burla(999), e.BURLAS[e.BURLAS.length - 1]);
  assert.equal(e.burla(-5), 'no');
});

test('el NO se achica y el SÍ crece, pero con tope', () => {
  const a = e.escalas(0);
  assert.equal(a.no, 1);
  assert.equal(a.si, 1);
  const b = e.escalas(5);
  assert.ok(b.no < 1 && b.si > 1);
  const c = e.escalas(500);
  assert.ok(c.no >= 0.55, 'el NO no puede desaparecer del todo');
  assert.ok(c.si <= 1.45, 'el SÍ no puede tapar la pantalla');
});
