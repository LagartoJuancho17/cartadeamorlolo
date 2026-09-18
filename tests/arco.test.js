'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const a = require('../js/core/arco.js');

test('la tensión vive entre 0 y 1', () => {
  assert.equal(a.tensar(0.9, 0.5), 1);
  assert.equal(a.tensar(0.1, -0.5), 0);
  assert.equal(a.tensar(0.5, 0.25), 0.75);
});

test('ningún evento suelto puede tensar el arco entero', () => {
  assert.ok(a.desdeRueda(99999) <= 0.22, 'un scroll bestia no debería disparar solo');
  assert.ok(a.desdeDedo(99999) <= 0.22);
  assert.ok(a.desdeRueda(-99999) >= -0.22);
});

test('scroll hacia abajo tensa, hacia arriba afloja', () => {
  assert.ok(a.desdeRueda(100) > 0);
  assert.ok(a.desdeRueda(-100) < 0);
});

test('normaliza la rueda por deltaMode', () => {
  // Firefox manda ~3 "líneas" por muesca donde Chrome manda ~100 píxeles.
  // Sin normalizar, en Firefox el arco no se tensa nunca.
  const chrome = a.desdeRueda(100, 0);
  const firefox = a.desdeRueda(3, 1);
  assert.ok(firefox > chrome * 0.3,
    `una muesca en Firefox (${firefox}) tiene que valer parecido a una en Chrome (${chrome})`);
  assert.ok(a.desdeRueda(1, 2) > a.desdeRueda(1, 1), 'una página tensa más que una línea');
  assert.equal(a.desdeRueda(100), a.desdeRueda(100, 0), 'sin deltaMode se asume píxeles');
});

test('en Firefox también se llega a disparar con pocas muescas', () => {
  let t = 0;
  let muescas = 0;
  while (t < 1 && muescas < 200) { t = a.tensar(t, a.desdeRueda(3, 1)); muescas++; }
  assert.ok(muescas <= 25, `hacen falta ${muescas} muescas de rueda: es un calvario`);
});

test('tensar de 0 a 1 requiere varios gestos, no uno', () => {
  let t = 0;
  let gestos = 0;
  while (t < 1 && gestos < 100) { t = a.tensar(t, a.desdeRueda(120)); gestos++; }
  assert.ok(gestos >= 4, `alcanzó el tope en ${gestos} gestos: se siente gratis`);
  assert.ok(gestos <= 25, `hacen falta ${gestos} gestos: se siente un trámite`);
});

test('la cuerda se relaja sola y nunca baja de cero', () => {
  assert.ok(a.relajar(0.5, 100) < 0.5);
  assert.equal(a.relajar(0.01, 100000), 0);
});

test('dispara al llegar al tope aunque no se suelte', () => {
  assert.equal(a.debeDisparar(1, false), true);
});

test('dispara si se suelta por encima del umbral', () => {
  assert.equal(a.debeDisparar(a.UMBRAL, true), true);
  assert.equal(a.debeDisparar(0.9, true), true);
});

test('no dispara si se suelta con poca tensión', () => {
  assert.equal(a.debeDisparar(a.UMBRAL - 0.01, true), false);
  assert.equal(a.debeDisparar(0, true), false);
});

test('no dispara sola mientras se sigue tensando por debajo del tope', () => {
  assert.equal(a.debeDisparar(0.99, false), false);
});

test('al tensar, las puntas se juntan y el enganche baja', () => {
  const reposo = a.geometria(0, 0.5);
  const tenso = a.geometria(1, 0.5);
  assert.ok(tenso.puntaIzq.x > reposo.puntaIzq.x, 'la punta izquierda debe entrar');
  assert.ok(tenso.puntaDer.x < reposo.puntaDer.x, 'la punta derecha debe entrar');
  assert.ok(tenso.enganche.y > reposo.enganche.y, 'el enganche debe bajar al tensar');
  assert.ok(tenso.panza.y < reposo.panza.y, 'la panza se hace menos honda');
});

test('la flecha siempre apunta para arriba', () => {
  for (let t = 0; t <= 1.0001; t += 0.1) {
    const g = a.geometria(t, 0.5);
    assert.ok(g.flecha.puntaY < g.flecha.colaY, `tensión ${t}: la flecha quedó dada vuelta`);
  }
});

test('el temblor aparece recién cuando el arco ya está sufriendo', () => {
  assert.equal(a.geometria(0.3, 0.5).temblor, 0);
  assert.equal(a.geometria(0.6, 0.5).temblor, 0);
  assert.ok(a.geometria(1, 0.5).temblor > 0);
});

test('sin ruido el dibujo es exactamente reproducible', () => {
  assert.deepEqual(a.geometria(0.42, 0), a.geometria(0.42, 0));
  assert.equal(a.geometria(0.8, 0.5).enganche.x, a.G.centro, 'ruido 0.5 = sin desvío');
});

test('la geometría no se rompe con valores fuera de rango', () => {
  assert.equal(a.geometria(5).tension, 1);
  assert.equal(a.geometria(-5).tension, 0);
});

test('marca listo recién a partir del umbral', () => {
  assert.equal(a.geometria(a.UMBRAL - 0.01).listo, false);
  assert.equal(a.geometria(a.UMBRAL).listo, true);
});

test('el vuelo sale rápido y llega frenando', () => {
  assert.ok(a.vuelo(0, 500) === 0, 'en reposo la flecha no se desplaza');
  assert.equal(Math.round(a.vuelo(1, 500)), -500);
  const mitad = Math.abs(a.vuelo(0.5, 500));
  assert.ok(mitad > 250, `a mitad de tiempo ya recorrió ${mitad}/500: debería ir más de la mitad`);
  // monotónica: nunca vuelve para atrás
  let previo = 0;
  for (let p = 0; p <= 1.0001; p += 0.05) {
    const v = a.vuelo(p, 500);
    assert.ok(v <= previo + 1e-9, `retrocedió en p=${p}`);
    previo = v;
  }
});

test('el estado inicial arranca en reposo', () => {
  const e = a.crear();
  assert.equal(e.tension, 0);
  assert.equal(e.disparado, false);
  assert.equal(e.soltado, false);
});
