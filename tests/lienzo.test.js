'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/core/lienzo.js');

test('crea un lienzo vacío del tamaño pedido', () => {
  const l = L.crear(4, 3);
  assert.equal(l.ancho, 4);
  assert.equal(l.alto, 3);
  assert.deepEqual(L.aTexto(l), ['....', '....', '....']);
});

test('desdeTexto y aTexto son inversas', () => {
  const lineas = ['.XX.', 'X..X', '.XX.'];
  assert.deepEqual(L.aTexto(L.desdeTexto(lineas)), lineas);
});

test('desdeTexto rechaza filas de distinto largo', () => {
  assert.throws(() => L.desdeTexto(['..', '...']), /Fila 1/);
});

test('pintar fuera del lienzo no rompe ni crece', () => {
  const l = L.crear(3, 3);
  L.punto(l, -5, -5, 'X');
  L.punto(l, 99, 99, 'X');
  assert.deepEqual(L.aTexto(l), ['...', '...', '...']);
  assert.equal(l.filas.length, 3);
});

test('rect dibuja sólo el borde por defecto', () => {
  const l = L.crear(4, 4);
  L.rect(l, 0, 0, 4, 4, 'X', false);
  assert.deepEqual(L.aTexto(l), ['XXXX', 'X..X', 'X..X', 'XXXX']);
});

test('rect relleno pinta todo', () => {
  const l = L.crear(3, 2);
  L.rect(l, 0, 0, 3, 2, 'X', true);
  assert.deepEqual(L.aTexto(l), ['XXX', 'XXX']);
});

test('linea horizontal, vertical y diagonal sin huecos', () => {
  const l = L.crear(5, 5);
  L.linea(l, 0, 0, 4, 4, 'X');
  assert.deepEqual(L.aTexto(l), ['X....', '.X...', '..X..', '...X.', '....X']);

  const h = L.crear(5, 1);
  L.linea(h, 0, 0, 4, 0, 'X');
  assert.deepEqual(L.aTexto(h), ['XXXXX']);
});

test('una línea de pendiente suave queda conexa', () => {
  const l = L.crear(20, 6);
  L.linea(l, 0, 0, 19, 5, 'X');
  // cada fila pintada debe tocar la siguiente: sin saltos en diagonal
  const puntos = [];
  for (let y = 0; y < l.alto; y++) {
    for (let x = 0; x < l.ancho; x++) if (l.filas[y][x] === 'X') puntos.push([x, y]);
  }
  for (let i = 1; i < puntos.length; i++) {
    const dx = Math.abs(puntos[i][0] - puntos[i - 1][0]);
    const dy = Math.abs(puntos[i][1] - puntos[i - 1][1]);
    assert.ok(dx <= 1 && dy <= 1, `hueco entre ${puntos[i - 1]} y ${puntos[i]}`);
  }
});

test('curva pinta algo y no se sale del lienzo', () => {
  const l = L.crear(20, 12);
  L.curva(l, 0, 2, 10, 20, 19, 2, 'X');
  assert.ok(L.contar(l, 'X') > 15);
  assert.equal(l.filas.length, 12);
  assert.ok(l.filas.every((f) => f.length === 20));
});

test('rellenar inunda sólo la región conexa', () => {
  const l = L.desdeTexto([
    'XXXXX',
    'X...X',
    'XXXXX',
    '.....'
  ]);
  L.rellenar(l, 2, 1, 'o');
  assert.deepEqual(L.aTexto(l), ['XXXXX', 'XoooX', 'XXXXX', '.....']);
});

test('rellenar sobre el mismo color no se cuelga', () => {
  const l = L.crear(3, 3);
  L.rellenar(l, 1, 1, '.');
  assert.deepEqual(L.aTexto(l), ['...', '...', '...']);
});

test('pegar respeta la transparencia del sprite de arriba', () => {
  const fondo = L.crear(4, 2, '.');
  L.rect(fondo, 0, 0, 4, 2, 'a', true);
  const encima = L.desdeTexto(['.b', 'b.']);
  L.pegar(fondo, encima, 1, 0);
  assert.deepEqual(L.aTexto(fondo), ['aaba', 'abaa']);
});

test('espejar da vuelta sin mutar el original', () => {
  const l = L.desdeTexto(['ab.', 'c..']);
  const m = L.espejar(l);
  assert.deepEqual(L.aTexto(m), ['.ba', '..c']);
  assert.deepEqual(L.aTexto(l), ['ab.', 'c..']);
});

test('corridas agrupa píxeles contiguos del mismo color', () => {
  const l = L.desdeTexto(['aaXbb']);
  assert.deepEqual(L.corridas(l), [
    { color: 'a', x: 0, y: 0, ancho: 2 },
    { color: 'X', x: 2, y: 0, ancho: 1 },
    { color: 'b', x: 3, y: 0, ancho: 2 }
  ]);
});

test('corridas ignora los transparentes', () => {
  const l = L.desdeTexto(['.a.', '...']);
  assert.deepEqual(L.corridas(l), [{ color: 'a', x: 1, y: 0, ancho: 1 }]);
});

test('corridas reconstruye exactamente el dibujo original', () => {
  const original = L.desdeTexto([
    '..RR..RR..',
    '.RRRRRRRR.',
    '.RRRRRRRR.',
    '..RRRRRR..',
    '...RRRR...',
    '....RR....'
  ]);
  const copia = L.crear(original.ancho, original.alto);
  for (const c of L.corridas(original)) {
    for (let i = 0; i < c.ancho; i++) L.punto(copia, c.x + i, c.y, c.color);
  }
  assert.deepEqual(L.aTexto(copia), L.aTexto(original));
});

test('corridas ahorra nodos frente a un rect por píxel', () => {
  const l = L.crear(24, 18);
  L.rect(l, 0, 0, 24, 18, 'K', true);
  assert.equal(L.contar(l, 'K'), 432);
  assert.equal(L.corridas(l).length, 18, 'una corrida por fila, no 432 rects');
});
