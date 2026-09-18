'use strict';
/**
 * Tests del ritmo del arco: el bucle de la vista se simula acá, en segundos
 * falsos, para poder afirmar cosas sobre la sensación al tensar sin abrir un
 * navegador.
 *
 * Existe por un bug real: con la regla vieja, cada keyup marcaba "soltó" y la
 * cuerda empezaba a aflojarse en el acto. Tensar a golpecitos con la flecha del
 * teclado era imposible: la tensión oscilaba cerca de cero para siempre.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const a = require('../js/core/arco.js');

/**
 * Corre el mismo bucle que app.js, con reloj falso.
 * @param {Array<{t:number, tipo:'gesto'|'soltar', monto?:number}>} guion
 */
function simular(guion, hasta) {
  let tension = 0;
  let arrastrando = false;
  let liberado = false;
  let ultimoGesto = 0;
  let disparoEn = null;
  const PASO = 16;                       // ~60 fps

  const eventos = guion.slice().sort((x, y) => x.t - y.t);
  let i = 0;

  for (let t = 0; t <= hasta; t += PASO) {
    while (i < eventos.length && eventos[i].t <= t) {
      const e = eventos[i++];
      if (e.tipo === 'gesto') {
        tension = a.tensar(tension, e.monto);
        ultimoGesto = e.t;
        liberado = false;
        arrastrando = Boolean(e.arrastrando);
      } else {
        arrastrando = false;
        liberado = true;
      }
    }

    if (disparoEn !== null) continue;

    const quieto = t - ultimoGesto;
    const soltado = a.estaSoltado(arrastrando, liberado, quieto);
    if (a.debeDisparar(tension, soltado)) { disparoEn = t; continue; }
    if (a.debeRelajar(quieto)) tension = a.relajar(tension, PASO);
  }

  return { tension, disparoEn };
}

/** Golpecitos de flecha del teclado, cada `cada` ms. */
function tecleo(veces, cada) {
  const guion = [];
  for (let n = 0; n < veces; n++) {
    guion.push({ t: n * cada, tipo: 'gesto', monto: a.desdeTecla() });
    guion.push({ t: n * cada + 8, tipo: 'soltar' });
  }
  return guion;
}

test('tensar a golpecitos con el teclado llega a disparar', () => {
  const r = simular(tecleo(10, 120), 4000);
  assert.notEqual(r.disparoEn, null, 'diez toques de flecha tienen que disparar');
});

test('un solo toque no dispara y la cuerda vuelve a cero', () => {
  const r = simular(tecleo(1, 0), 4000);
  assert.equal(r.disparoEn, null);
  assert.equal(r.tension, 0, 'después del respiro tiene que aflojarse del todo');
});

test('dos o tres toques tampoco disparan: hay que insistir', () => {
  assert.equal(simular(tecleo(3, 120), 4000).disparoEn, null);
});

test('el respiro aguanta entre golpe y golpe', () => {
  // Con 400 ms entre toques (por debajo de GRACIA) no se pierde lo ganado.
  const r = simular(tecleo(9, 400), 8000);
  assert.notEqual(r.disparoEn, null, 'tocar despacio pero sostenido también tiene que servir');
});

test('si se toma demasiado tiempo entre golpes, la cuerda se afloja', () => {
  // 1200 ms entre toques: más que GRACIA + lo que tarda en caer 0.085.
  const r = simular(tecleo(9, 1200), 14000);
  assert.equal(r.disparoEn, null, 'con pausas largas no debería acumular');
});

test('arrastrar de una y soltar dispara', () => {
  const guion = [];
  for (let n = 0; n < 8; n++) {
    guion.push({ t: n * 30, tipo: 'gesto', monto: a.desdeDedo(60), arrastrando: true });
  }
  guion.push({ t: 8 * 30, tipo: 'soltar' });
  const r = simular(guion, 3000);
  assert.notEqual(r.disparoEn, null);
  assert.ok(r.disparoEn <= 8 * 30 + 32, 'al soltar tiene que salir enseguida, no con demora');
});

test('mientras se arrastra sin soltar, no dispara hasta el tope', () => {
  const guion = [{ t: 0, tipo: 'gesto', monto: 0.6, arrastrando: true }];
  const r = simular(guion, 300);
  assert.equal(r.disparoEn, null, 'todavía tiene el dedo apoyado: no se suelta sola');
});

test('la rueda dispara sin evento de soltar, por silencio', () => {
  // La rueda del mouse no avisa cuándo termina: el silencio cuenta como soltar.
  const guion = [];
  for (let n = 0; n < 6; n++) {
    guion.push({ t: n * 40, tipo: 'gesto', monto: a.desdeRueda(120) });
  }
  const r = simular(guion, 3000);
  assert.notEqual(r.disparoEn, null, 'después de frenar el scroll tiene que salir');
  assert.ok(r.disparoEn < 6 * 40 + a.GRACIA,
    'tiene que salir por el silencio de la rueda, antes de empezar a aflojarse');
});

test('scroll corto y abandono: no dispara y vuelve a cero', () => {
  const r = simular([{ t: 0, tipo: 'gesto', monto: a.desdeRueda(120) }], 4000);
  assert.equal(r.disparoEn, null);
  assert.equal(r.tension, 0);
});

test('llegar al tope dispara aunque no se suelte nunca', () => {
  const guion = [];
  for (let n = 0; n < 8; n++) {
    guion.push({ t: n * 20, tipo: 'gesto', monto: 0.2, arrastrando: true });
  }
  const r = simular(guion, 1000);
  assert.notEqual(r.disparoEn, null, 'tensado completo = dispara sola');
});

test('el respiro es más largo que el silencio que cuenta como soltar', () => {
  // Si fuera al revés, la cuerda se aflojaría antes de decidir si dispara.
  assert.ok(a.GRACIA > a.ESPERA_RUEDA);
});
