/**
 * esquivar.js — la geometría del botón "NO" que se escapa.
 *
 * Espacio determinista puro: no toca el DOM, no lee el reloj, y la aleatoriedad
 * entra inyectada para poder testearla. La vista sólo aplica la posición.
 *
 * Garantías que los tests verifican:
 *  1. La posición devuelta siempre queda dentro del contenedor.
 *  2. Nunca se superpone con los rectángulos a evitar (el botón "SÍ"), si existe
 *     al menos una posición libre.
 *  3. Se aleja del puntero: elige la mejor de N candidatas por distancia.
 */
(function (raiz, fabrica) {
  'use strict';
  var API = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { esquivar: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CANDIDATAS = 24;      // cuántas posiciones se prueban por salto
  var MARGEN = 6;           // px de aire contra el borde del contenedor
  var SEPARACION = 10;      // px de aire contra los rectángulos a evitar

  function limitar(valor, min, max) {
    if (max < min) return min;
    return Math.min(Math.max(valor, min), max);
  }

  function seSuperponen(a, b, aire) {
    var s = aire || 0;
    return !(
      a.x + a.ancho + s <= b.x ||
      b.x + b.ancho + s <= a.x ||
      a.y + a.alto + s <= b.y ||
      b.y + b.alto + s <= a.y
    );
  }

  /** Distancia del puntero al punto más cercano del rectángulo. 0 si está adentro. */
  function distanciaAlRect(punto, rect) {
    var dx = Math.max(rect.x - punto.x, 0, punto.x - (rect.x + rect.ancho));
    var dy = Math.max(rect.y - punto.y, 0, punto.y - (rect.y + rect.alto));
    return Math.hypot(dx, dy);
  }

  /** ¿El puntero está lo bastante cerca como para que el botón salte? */
  function debeEsquivar(puntero, rect, radio) {
    if (!puntero || !rect) return false;
    return distanciaAlRect(puntero, rect) <= (radio == null ? 70 : radio);
  }

  /**
   * Elige la próxima posición del botón que huye.
   *
   * @param {object} o
   * @param {{ancho:number,alto:number}} o.contenedor  caja donde puede moverse
   * @param {{ancho:number,alto:number}} o.boton       tamaño del botón
   * @param {{x:number,y:number}}        o.puntero     dedo o mouse, coords del contenedor
   * @param {Array<{x,y,ancho,alto}>}    [o.evitar]    zonas prohibidas (el botón "SÍ")
   * @param {function():number}          [o.aleatorio] inyectable para tests
   * @returns {{x:number,y:number}}
   */
  function nuevaPosicion(o) {
    var cont = o.contenedor;
    var boton = o.boton;
    var puntero = o.puntero || { x: cont.ancho / 2, y: cont.alto / 2 };
    var evitar = o.evitar || [];
    var rnd = o.aleatorio || Math.random;

    var minX = MARGEN;
    var minY = MARGEN;
    var maxX = Math.max(MARGEN, cont.ancho - boton.ancho - MARGEN);
    var maxY = Math.max(MARGEN, cont.alto - boton.alto - MARGEN);

    var mejor = null;
    var mejorPuntaje = -Infinity;
    var mejorLibre = null;
    var mejorPuntajeLibre = -Infinity;

    for (var i = 0; i < CANDIDATAS; i++) {
      var x = limitar(minX + rnd() * (maxX - minX), minX, maxX);
      var y = limitar(minY + rnd() * (maxY - minY), minY, maxY);
      var rect = { x: x, y: y, ancho: boton.ancho, alto: boton.alto };

      var choca = false;
      for (var j = 0; j < evitar.length; j++) {
        if (seSuperponen(rect, evitar[j], SEPARACION)) { choca = true; break; }
      }

      // Lejos del puntero es bueno; pegarse al borde, un poco menos.
      var puntaje = distanciaAlRect(puntero, rect);
      var centroX = x + boton.ancho / 2;
      var centroY = y + boton.alto / 2;
      puntaje -= Math.hypot(centroX - cont.ancho / 2, centroY - cont.alto / 2) * 0.15;

      if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = rect; }
      if (!choca && puntaje > mejorPuntajeLibre) { mejorPuntajeLibre = puntaje; mejorLibre = rect; }
    }

    var elegido = mejorLibre || mejor || { x: minX, y: minY };
    return { x: elegido.x, y: elegido.y };
  }

  /** El "NO" se va achicando y cambiando de humor a medida que lo persiguen. */
  var BURLAS = [
    'no',
    'nop',
    'ni ahí',
    'jaja no',
    'probá de nuevo',
    'nunca',
    'imposible',
    'ya fue',
    'dale que no'
  ];

  function burla(intentos) {
    if (intentos <= 0) return BURLAS[0];
    return BURLAS[Math.min(intentos, BURLAS.length - 1)];
  }

  /** Escala del botón "NO" (se achica) y del "SÍ" (crece) según los intentos. */
  function escalas(intentos) {
    var n = Math.max(0, intentos);
    return {
      no: Math.max(0.55, 1 - n * 0.06),
      si: Math.min(1.45, 1 + n * 0.05)
    };
  }

  return {
    nuevaPosicion: nuevaPosicion,
    debeEsquivar: debeEsquivar,
    seSuperponen: seSuperponen,
    distanciaAlRect: distanciaAlRect,
    burla: burla,
    escalas: escalas,
    BURLAS: BURLAS,
    MARGEN: MARGEN,
    SEPARACION: SEPARACION
  };
});
