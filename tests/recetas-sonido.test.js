'use strict';
/**
 * Los bugs de Web Audio no se ven, se escuchan: un clic seco al empezar una
 * nota, un corte abrupto al terminarla, una automatización que va para atrás y
 * tira excepción, un chillido fuera de rango. Todo eso se puede revisar sobre
 * las recetas antes de que suene una sola nota.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/core/recetas-sonido.js');

const nombres = Object.keys(R.RECETAS);

test('hay recetas para todos los momentos de la pieza', () => {
  for (const n of ['trinquete', 'disparo', 'vuelo', 'impacto', 'abrir',
    'si', 'corazon', 'foto', 'pasar', 'reinicio', 'encender']) {
    assert.ok(R.RECETAS[n], `falta la receta "${n}"`);
  }
});

test('ninguna receta tiene defectos que se escuchen', () => {
  const fallas = nombres.flatMap((n) => R.revisar(n, R.RECETAS[n]));
  assert.deepEqual(fallas, [], 'problemas encontrados:\n  ' + fallas.join('\n  '));
});

test('toda envolvente arranca y termina en silencio', () => {
  for (const n of nombres) {
    for (const [i, voz] of R.RECETAS[n].voces.entries()) {
      const g = voz.ganancia;
      assert.ok(g[0][1] <= 0.001, `${n} voz ${i} arranca en ${g[0][1]}: clic al empezar`);
      assert.ok(g.at(-1)[1] <= 0.001, `${n} voz ${i} termina en ${g.at(-1)[1]}: corte seco`);
    }
  }
});

test('las curvas nunca van para atrás en el tiempo', () => {
  // Web Audio tira excepción si una automatización retrocede.
  for (const n of nombres) {
    for (const voz of R.RECETAS[n].voces) {
      for (const curva of [voz.ganancia, voz.frecuencia, voz.filtro?.frecuencia]) {
        if (!curva) continue;
        for (let k = 1; k < curva.length; k++) {
          assert.ok(curva[k][0] > curva[k - 1][0], `${n}: tiempo repetido o hacia atrás`);
        }
      }
    }
  }
});

test('ninguna voz suena después de que la receta terminó', () => {
  for (const n of nombres) {
    const receta = R.RECETAS[n];
    for (const [i, voz] of receta.voces.entries()) {
      assert.ok(R.finDeVoz(voz) <= receta.duracion + 0.001,
        `${n} voz ${i} se corta a mitad de camino`);
    }
  }
});

test('ninguna receta satura aunque suenen todas sus voces juntas', () => {
  for (const n of nombres) {
    const pico = R.picoDeReceta(R.RECETAS[n]);
    assert.ok(pico * R.MAESTRO < 0.95, `${n} llega a ${(pico * R.MAESTRO).toFixed(2)}: distorsiona`);
  }
});

test('ninguna receta queda tan baja que no se escuche en un teléfono', () => {
  for (const n of nombres) {
    const nivel = R.picoDeReceta(R.RECETAS[n]) * R.MAESTRO;
    assert.ok(nivel >= 0.05, `${n} llega a ${nivel.toFixed(3)}: en un parlante de teléfono no se oye`);
  }
});

test('el zumbido del arco se oye pero no tapa a los demás', () => {
  const tensado = R.gananciaTension(1) * R.MAESTRO;
  assert.ok(tensado >= 0.05, `el arco tensado llega a ${tensado.toFixed(3)}: inaudible`);
  assert.ok(tensado <= R.picoDeReceta(R.RECETAS.disparo) * R.MAESTRO,
    'el zumbido de fondo no puede sonar más fuerte que el flechazo');
});

test('nada suena fuera del rango audible', () => {
  for (const n of nombres) {
    for (const voz of R.RECETAS[n].voces) {
      if (voz.onda === 'ruido' || !voz.frecuencia) continue;
      for (const [, hz] of voz.frecuencia) {
        assert.ok(hz >= 20 && hz <= 20000, `${n}: ${hz} Hz`);
      }
    }
  }
});

test('las ondas son formas que Web Audio conoce', () => {
  const validas = new Set(['sine', 'square', 'sawtooth', 'triangle', 'ruido']);
  for (const n of nombres) {
    for (const voz of R.RECETAS[n].voces) {
      assert.ok(validas.has(voz.onda), `${n}: onda "${voz.onda}" no existe`);
    }
  }
});

test('ninguna receta dura tanto como para pisarse con la siguiente', () => {
  for (const n of nombres) {
    assert.ok(R.RECETAS[n].duracion <= 1.5, `${n} dura ${R.RECETAS[n].duracion}s: demasiado`);
    assert.ok(R.RECETAS[n].duracion >= 0.02, `${n} dura ${R.RECETAS[n].duracion}s: no se va a oír`);
  }
});

// ------------------------------------------------------------- el arco -----

test('el zumbido del arco sube con la tensión, siempre', () => {
  let previo = -Infinity;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const hz = R.frecuenciaTension(t);
    assert.ok(hz > previo, `en tensión ${t.toFixed(2)} el tono bajó`);
    previo = hz;
  }
});

test('el zumbido del arco queda en un grave cómodo', () => {
  assert.equal(R.frecuenciaTension(0), R.TENSAR.grave);
  assert.equal(R.frecuenciaTension(1), R.TENSAR.agudo);
  assert.ok(R.TENSAR.grave >= 30, 'por debajo de 30 Hz un parlante de teléfono no lo reproduce');
  assert.ok(R.TENSAR.agudo <= 400, 'tensar un arco no puede sonar a silbido');
});

test('el arco arranca en silencio y sube de volumen al tensarse', () => {
  assert.equal(R.gananciaTension(0), 0);
  assert.ok(R.gananciaTension(1) > R.gananciaTension(0.5));
  assert.ok(R.gananciaTension(1) <= 0.16, 'tensar es un fondo, no el protagonista');
});

test('la tensión fuera de rango no rompe nada', () => {
  assert.equal(R.frecuenciaTension(-5), R.TENSAR.grave);
  assert.equal(R.frecuenciaTension(9), R.TENSAR.agudo);
  assert.equal(R.gananciaTension(-1), 0);
  assert.ok(Number.isFinite(R.filtroTension(3)));
});

test('el trinquete suena varias veces al tensar, pero no sin parar', () => {
  const escalones = new Set();
  for (let t = 0; t <= 1.0001; t += 0.005) escalones.add(R.escalonTrinquete(t));
  assert.ok(escalones.size >= 8, `sólo ${escalones.size} clics: se siente mudo`);
  assert.ok(escalones.size <= 20, `${escalones.size} clics: es una ametralladora`);
});

test('el trinquete no repite el mismo escalón dentro del mismo tramo', () => {
  assert.equal(R.escalonTrinquete(0.01), R.escalonTrinquete(0.05));
  assert.notEqual(R.escalonTrinquete(0.01), R.escalonTrinquete(0.2));
});

test('el volumen maestro deja aire sin quedarse corto', () => {
  assert.ok(R.MAESTRO > 0 && R.MAESTRO <= 1, 'por encima de 1 satura el maestro solo');
  // El techo real lo fija la receta más fuerte: con ese margen entra todo.
  const masFuerte = Math.max(...nombres.map((n) => R.picoDeReceta(R.RECETAS[n])));
  assert.ok(masFuerte * R.MAESTRO < 0.95, 'la receta más fuerte distorsiona');
  assert.ok(masFuerte * R.MAESTRO > 0.15, 'la receta más fuerte apenas se oye');
});
