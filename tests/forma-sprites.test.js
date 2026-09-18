'use strict';
/**
 * Test de forma exacta ("golden") para el pixel art.
 *
 * Por qué existe: los otros tests verifican propiedades (simetría, colores,
 * bordes). Una propiedad puede seguir cumpliéndose con un dibujo roto — un
 * corazón con el escote el doble de hondo sigue siendo simétrico. Acá se fija
 * el dibujo carácter por carácter.
 *
 * Si cambiás un sprite a propósito, actualizá el esperado de este archivo.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/core/lienzo.js');
const S = require('../js/sprites.js');

test('el corazón grande mantiene su forma exacta', () => {
  assert.deepEqual(L.aTexto(S.CORAZON), [
    '.RRRR....RRRR.',
    'RRLLRR..RRRRRR',
    'RRLLRRRRRRRRRR',
    'RRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRR',
    '.RRRRRRRRRRRR.',
    '..RRRRRRRRRR..',
    '...RRRRRRRR...',
    '....RRRRRR....',
    '.....RRRR.....',
    '......RR......'
  ]);
});

test('el escote del corazón tiene una sola fila de hondo', () => {
  const filasConEscote = L.aTexto(S.CORAZON)
    .filter((f) => /R\.\.R/.test(f) || /^\.RRRR\.{4}RRRR\.$/.test(f));
  assert.equal(filasConEscote.length, 2,
    'el escote son la fila de las dos jorobas más una: si son más, se ve partido');
});

test('el corazón chico mantiene su forma exacta', () => {
  assert.deepEqual(L.aTexto(S.CORAZON_CHICO), [
    '.RR..RR.',
    'RRRRRRRR',
    'RRRRRRRR',
    '.RRRRRR.',
    '..RRRR..',
    '...RR...'
  ]);
});

test('la cabeza del gato mantiene su forma exacta', () => {
  assert.deepEqual(L.aTexto(S.GATO), [
    '..KK................KK..',
    '.KKKK..............KKKK.',
    '.KKPKKK..........KKKPKK.',
    '.KKPPKKK........KKKPPKK.',
    '.KKPPKKKKKKKKKKKKKKPPKK.',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    'KPPPKKKKKKKNNKKKKKKKPPPK',
    'KPPPKKKKKKKNNKKKKKKKPPPK',
    'KKKKKKKKKKKKKKKKKKKKKKKK',
    '.KKKKKKKKKKKKKKKKKKKKKK.',
    '..KKKKKKKKKKKKKKKKKKKK..',
    '....KKKKKKKKKKKKKKKK....'
  ]);
});

test('el sobre cerrado mantiene su forma exacta', () => {
  assert.deepEqual(L.aTexto(S.SOBRE), [
    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE',
    'EEFFFFFFFFFFFFFFFFFFFFFFFFFFFFEE',
    'EBEFFFFFFFFFFFFFFFFFFFFFFFFFFEBE',
    'EBBEFFFFFFFFFFFFFFFFFFFFFFFFEBBE',
    'EBBBEEFFFFFFFFFFFFFFFFFFFFEEBBBE',
    'EBBBBBEFFFFFFFFFFFFFFFFFFEBBBBBE',
    'EBBBBBBEFFFFFFFFFFFFFFFFEBBBBBBE',
    'EBBBBBBBEFFFFFFFFFFFFFFEBBBBBBBE',
    'EBBBBBBBBEFFFRRFFRRFFFEBBBBBBBBE',
    'EBBBBBBBBBEFRRRRRRRRFEBBBBBBBBBE',
    'EBBBBBBBBBBERRRRRRRREBBBBBBBBBBE',
    'EBBBBBBBBBBBBRRRRRRBBBBBBBBBBBBE',
    'EBBBBBBBBBBBBBRRRRBBBBBBBBBBBBBE',
    'EBBBBBBBBBBBBEERREEBBBBBBBBBBBBE',
    'EBBBBBBBBBBEEBBBBBBEEBBBBBBBBBBE',
    'EBBBBBBBBEEBBBBBBBBBBEEBBBBBBBBE',
    'EBBBBBBBEBBBBBBBBBBBBBBEBBBBBBBE',
    'EBBBBBEEBBBBBBBBBBBBBBBBEEBBBBBE',
    'EBBBEEBBBBBBBBBBBBBBBBBBBBEEBBBE',
    'EBEEBBBBBBBBBBBBBBBBBBBBBBBBEEBE',
    'EEBBBBBBBBBBBBBBBBBBBBBBBBBBBBEE',
    'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE'
  ]);
});

test('el sello del sobre está centrado', () => {
  const filas = L.aTexto(S.SOBRE);
  const conRojo = filas.map((f, i) => [i, f.indexOf('R'), f.lastIndexOf('R')])
    .filter(([, a]) => a >= 0);
  assert.ok(conRojo.length > 0, 'el sobre tiene que tener sello');
  for (const [i, primero, ultimo] of conRojo) {
    const centro = (primero + ultimo + 1) / 2;
    assert.ok(Math.abs(centro - S.SOBRE.ancho / 2) <= 0.5,
      `la fila ${i} del sello está corrida: centro ${centro}`);
  }
});

test('la flecha mantiene su forma exacta en punta y plumas', () => {
  const t = L.aTexto(S.FLECHA);
  assert.deepEqual(t.slice(0, 6), [
    '......R......',
    '.....RRR.....',
    '....RRRRR....',
    '...RRRRRRR...',
    '..RRRRRRRRR..',
    '.RRRRRRRRRRR.'
  ]);
  // El asta (M) tiene que seguir visible dentro de las plumas: si queda un '.'
  // en la columna del medio, la flecha se ve partida al vuelo.
  assert.deepEqual(t.slice(28), [
    '....PMMMP....',
    '...PPMMMPP...',
    '..PPPMMMPPP..',
    '..PPPMMMPPP..',
    '...PPMMMPP...',
    '....PMMMP....'
  ]);
  assert.equal(S.FLECHA.alto, 34);
});
