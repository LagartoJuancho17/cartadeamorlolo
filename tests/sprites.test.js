'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/core/lienzo.js');
const S = require('../js/sprites.js');

test('todos los sprites son rectangulares', () => {
  const todos = {
    GATO: S.GATO, CORAZON: S.CORAZON, CORAZON_CHICO: S.CORAZON_CHICO,
    SOBRE: S.SOBRE, SOBRE_ABIERTO: S.SOBRE_ABIERTO, FLECHA: S.FLECHA,
    'OJOS.normal': S.OJOS.normal, 'OJOS.cerrados': S.OJOS.cerrados, 'OJOS.feliz': S.OJOS.feliz
  };
  for (const [nombre, sp] of Object.entries(todos)) {
    assert.ok(sp.alto > 0, `${nombre} está vacío`);
    for (const fila of sp.filas) {
      assert.equal(fila.length, sp.ancho, `${nombre} tiene una fila de largo distinto`);
    }
  }
});

test('todos los colores usados existen en la paleta', () => {
  const sprites = [S.GATO, S.CORAZON, S.CORAZON_CHICO, S.SOBRE, S.SOBRE_ABIERTO, S.FLECHA,
    S.OJOS.normal, S.OJOS.cerrados, S.OJOS.feliz];
  for (const sp of sprites) {
    for (const c of L.corridas(sp)) {
      assert.ok(S.PALETA[c.color], `color "${c.color}" sin definir en la paleta`);
    }
  }
});

test('los tres humores de ojos calzan sobre la cabeza del gato', () => {
  for (const [humor, ojos] of Object.entries(S.OJOS)) {
    assert.equal(ojos.ancho, S.GATO.ancho, `los ojos "${humor}" no calzan de ancho`);
    assert.ok(S.OJOS_Y + ojos.alto <= S.GATO.alto, `los ojos "${humor}" se salen de la cabeza`);
  }
});

test('la zona de los ojos del gato es negra maciza', () => {
  // Si no lo fuera, al parpadear quedarían ojos viejos abajo.
  for (let y = S.OJOS_Y; y < S.OJOS_Y + 3; y++) {
    for (let x = 0; x < S.GATO.ancho; x++) {
      assert.equal(S.GATO.filas[y][x], 'K',
        `el gato tiene un píxel "${S.GATO.filas[y][x]}" en (${x},${y}); debería ser negro`);
    }
  }
});

test('el gato tiene los ojos simétricos', () => {
  for (const [humor, ojos] of Object.entries(S.OJOS)) {
    assert.deepEqual(L.aTexto(L.espejar(ojos)), L.aTexto(ojos), `los ojos "${humor}" están chuecos`);
  }
});

test('la cabeza del gato es simétrica', () => {
  assert.deepEqual(L.aTexto(L.espejar(S.GATO)), L.aTexto(S.GATO));
});

test('el corazón es simétrico y tiene punta abajo', () => {
  const sinBrillo = L.desdeTexto(L.aTexto(S.CORAZON).map((f) => f.replace(/L/g, 'R')));
  assert.deepEqual(L.aTexto(L.espejar(sinBrillo)), L.aTexto(sinBrillo));
  const ultima = L.aTexto(S.CORAZON).at(-1);
  assert.equal(ultima.replace(/\./g, '').length, 2, 'la última fila debería ser la punta');
});

test('el sobre tiene solapa rosa y sello rojo', () => {
  assert.ok(L.contar(S.SOBRE, 'F') > 40, 'falta la solapa');
  assert.ok(L.contar(S.SOBRE, 'R') > 15, 'falta el corazón del sello');
  assert.ok(L.contar(S.SOBRE, 'E') > 60, 'falta el marco');
});

test('el sobre abierto no tiene sello y deja el papel a la vista', () => {
  assert.equal(L.contar(S.SOBRE_ABIERTO, 'R'), 0, 'el sello ya se rompió');
  assert.ok(L.contar(S.SOBRE_ABIERTO, 'B') > 100, 'se tiene que ver el papel');
  assert.equal(S.SOBRE_ABIERTO.ancho, S.SOBRE.ancho, 'los dos sobres miden lo mismo');
  assert.equal(S.SOBRE_ABIERTO.alto, S.SOBRE.alto);
});

test('la flecha apunta para arriba: punta roja arriba, plumas rosas abajo', () => {
  const texto = L.aTexto(S.FLECHA);
  assert.ok(texto[0].includes('R'), 'arriba va la punta');
  assert.ok(!texto[0].includes('P'), 'arriba no van las plumas');
  assert.ok(texto.at(-1).includes('P'), 'abajo van las plumas');
  assert.ok(!texto.at(-1).includes('R'), 'abajo no va la punta');
});

test('la flecha tiene asta continua de punta a plumas', () => {
  const col = Math.floor(S.FLECHA.ancho / 2);
  for (let y = 6; y < S.FLECHA.alto; y++) {
    assert.notEqual(S.FLECHA.filas[y][col], '.', `el asta se corta en y=${y}`);
  }
});

test('el asta de la flecha es lo bastante gruesa para verse al lado del arco', () => {
  const medio = S.FLECHA.filas[20].join('');
  assert.ok((medio.match(/M/g) || []).length >= 3,
    'con un asta de 1 píxel la flecha desaparece contra el arco');
});

test('aSVG produce un svg con viewBox del tamaño del sprite', () => {
  const svg = S.aSVG(S.CORAZON_CHICO);
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 8 6"/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.match(svg, /<\/svg>$/);
});

test('aSVG traduce las claves de paleta a colores reales', () => {
  const svg = S.aSVG(S.CORAZON_CHICO);
  assert.ok(svg.includes(S.PALETA.R), 'el rojo tiene que salir como hex');
  assert.ok(!/fill="R"/.test(svg), 'no puede quedar la letra de la paleta');
});

test('aSVG emite una corrida por rect, no un rect por píxel', () => {
  const rects = (S.aSVG(S.GATO).match(/<rect/g) || []).length;
  const pixeles = L.corridas(S.GATO).reduce((n, c) => n + c.ancho, 0);
  assert.equal(rects, L.corridas(S.GATO).length);
  assert.ok(rects < pixeles / 4, `${rects} rects para ${pixeles} píxeles: se puede comprimir más`);
});

test('aSVG acepta id y clase', () => {
  const svg = S.aSVG(S.CORAZON, { id: 'corazon-gato', clase: 'late' });
  assert.match(svg, /id="corazon-gato"/);
  assert.match(svg, /class="late"/);
});

test('aSVG no deja píxeles transparentes en el markup', () => {
  const svg = S.aSVG(S.CORAZON_CHICO);
  assert.ok(!svg.includes('fill="."'), 'los transparentes no se dibujan');
});
