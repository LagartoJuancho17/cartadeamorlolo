import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { armar } from '../bin/armar-artifact.mjs';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const salida = armar(html);

test('saca el envoltorio del documento', () => {
  // Un Artifact ya viene envuelto: si la página trae el suyo, se rompe.
  assert.ok(!/<!doctype/i.test(salida), 'no puede quedar doctype');
  assert.ok(!/<html[\s>]/i.test(salida), 'no puede quedar <html>');
  assert.ok(!/<head[\s>]/i.test(salida), 'no puede quedar <head>');
  assert.ok(!/<body[\s>]/i.test(salida), 'no puede quedar <body>');
});

test('el título va al principio, donde se lo busca', () => {
  assert.ok(salida.startsWith('<title>'), 'sólo se leen los primeros 8 kB');
  assert.match(salida, /<title>Feliz 2 años<\/title>/);
});

test('se lleva las hojas de estilo', () => {
  assert.match(salida, /<link[^>]+css\/estilos\.css/);
  assert.match(salida, /fonts\.googleapis\.com/);
});

test('no se lleva el favicon ni los meta del envoltorio', () => {
  assert.ok(!/rel="icon"/.test(salida), 'el ícono lo pone el parámetro icon');
  assert.ok(!/<meta/i.test(salida), 'charset y viewport los pone el envoltorio');
});

test('conserva todos los scripts de la página, en orden', () => {
  const orden = [...salida.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(orden, [
    'contenido.js',
    'js/fotos-generado.js',
    'js/core/lienzo.js',
    'js/core/duracion.js',
    'js/core/esquivar.js',
    'js/core/arco.js',
    'js/core/recetas-sonido.js',
    'js/sprites.js',
    'js/corazones.js',
    'js/sonido.js',
    'js/galeria.js',
    'js/app.js'
  ]);
});

test('conserva las tres escenas y los ids que usa app.js', () => {
  for (const id of ['escena-arco', 'escena-gato', 'escena-carta', 'sobre', 'arco-svg',
    'flecha', 'tension-barra', 'gato-corazon', 'boton-si', 'boton-no',
    'carta-cuerpo', 'galeria-grilla', 'visor', 'reiniciar', 'particulas',
    'sonido', 'cancion', 'ventana-titulo']) {
    assert.ok(salida.includes(`id="${id}"`), `falta #${id} en la versión del Artifact`);
  }
});

test('todas las rutas son relativas y sin barra inicial', () => {
  const rutas = [...salida.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^(https?:|data:|#)/.test(r));
  assert.ok(rutas.length > 0);
  for (const r of rutas) {
    assert.ok(!r.startsWith('/'), `"${r}" arranca con barra: no resuelve en el Artifact`);
  }
});

test('entra holgado en el límite de tamaño', () => {
  assert.ok(Buffer.byteLength(salida) < 16 * 1024 * 1024);
});

test('falla fuerte si index.html deja de tener la forma esperada', () => {
  assert.throws(() => armar('<p>hola</p>'), /<head>/);
  assert.throws(() => armar('<head></head>'), /<body>/);
});

test('el sonido se carga antes que app.js, que lo usa', () => {
  const orden = [...salida.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(orden.indexOf('js/core/recetas-sonido.js') < orden.indexOf('js/sonido.js'),
    'el reproductor necesita las recetas ya cargadas');
  assert.ok(orden.indexOf('js/sonido.js') < orden.indexOf('js/app.js'));
});

test('el marcado no duplica textos que pone contenido.js', () => {
  // Si el HTML trae una copia del texto, se edita ahí y app.js la pisa en
  // silencio: el cambio parece no hacer nada.
  for (const id of ['ventana-titulo', 'reiniciar', 'titulo-sobre', 'pregunta']) {
    const etiqueta = new RegExp(`id="${id}"[^>]*>([^<]*)<`);
    const dentro = salida.match(etiqueta);
    assert.ok(dentro && dentro[1].trim() === '',
      `#${id} trae texto en el HTML: se va a editar ahí y app.js lo va a pisar`);
  }
});
