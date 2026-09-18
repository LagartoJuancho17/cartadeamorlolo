/**
 * lienzo.js — un mini editor de pixel art en memoria.
 *
 * Un lienzo es una grilla de caracteres. Cada carácter es un color de la paleta
 * ('.' = transparente). Dibujar el sobre o la flecha a mano, píxel por píxel,
 * es propenso a errores; acá se construyen con primitivas (rect, línea, curva,
 * relleno) que son deterministas y están testeadas.
 *
 * El gato sí es una matriz escrita a mano: es una forma orgánica y se lee mejor
 * dibujada que generada.
 */
(function (raiz, fabrica) {
  'use strict';
  var API = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { lienzo: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VACIO = '.';

  function crear(ancho, alto, vacio) {
    var relleno = vacio || VACIO;
    var filas = [];
    for (var y = 0; y < alto; y++) {
      filas.push(new Array(ancho).fill(relleno));
    }
    return { ancho: ancho, alto: alto, vacio: relleno, filas: filas };
  }

  function desdeTexto(lineas, vacio) {
    var alto = lineas.length;
    var ancho = alto ? lineas[0].length : 0;
    for (var i = 0; i < alto; i++) {
      if (lineas[i].length !== ancho) {
        throw new Error('Fila ' + i + ' mide ' + lineas[i].length + ', se esperaba ' + ancho);
      }
    }
    return {
      ancho: ancho,
      alto: alto,
      vacio: vacio || VACIO,
      filas: lineas.map(function (l) { return l.split(''); })
    };
  }

  function aTexto(l) {
    return l.filas.map(function (f) { return f.join(''); });
  }

  function dentro(l, x, y) {
    return x >= 0 && y >= 0 && x < l.ancho && y < l.alto;
  }

  function leer(l, x, y) {
    return dentro(l, x, y) ? l.filas[y][x] : null;
  }

  function punto(l, x, y, color) {
    var px = Math.round(x);
    var py = Math.round(y);
    if (dentro(l, px, py)) l.filas[py][px] = color;
    return l;
  }

  function rect(l, x, y, ancho, alto, color, relleno) {
    for (var j = 0; j < alto; j++) {
      for (var i = 0; i < ancho; i++) {
        var borde = i === 0 || j === 0 || i === ancho - 1 || j === alto - 1;
        if (relleno || borde) punto(l, x + i, y + j, color);
      }
    }
    return l;
  }

  /** Bresenham entero: líneas parejas, sin huecos. */
  function linea(l, x0, y0, x1, y1, color) {
    var ax = Math.round(x0), ay = Math.round(y0);
    var bx = Math.round(x1), by = Math.round(y1);
    var dx = Math.abs(bx - ax), sx = ax < bx ? 1 : -1;
    var dy = -Math.abs(by - ay), sy = ay < by ? 1 : -1;
    var err = dx + dy;
    for (;;) {
      punto(l, ax, ay, color);
      if (ax === bx && ay === by) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; ax += sx; }
      if (e2 <= dx) { err += dx; ay += sy; }
    }
    return l;
  }

  /** Bézier cuadrática muestreada; se apoya en linea() para no dejar huecos. */
  function curva(l, x0, y0, cx, cy, x1, y1, color, pasos) {
    var n = pasos || 48;
    var px = x0, py = y0;
    for (var i = 1; i <= n; i++) {
      var t = i / n;
      var u = 1 - t;
      var x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      var y = u * u * y0 + 2 * u * t * cy + t * t * y1;
      linea(l, px, py, x, y, color);
      px = x; py = y;
    }
    return l;
  }

  /** Relleno por inundación de 4 vecinos, desde un punto semilla. */
  function rellenar(l, x, y, color) {
    var objetivo = leer(l, x, y);
    if (objetivo === null || objetivo === color) return l;
    var pila = [[Math.round(x), Math.round(y)]];
    while (pila.length) {
      var p = pila.pop();
      var px = p[0], py = p[1];
      if (!dentro(l, px, py)) continue;
      if (l.filas[py][px] !== objetivo) continue;
      l.filas[py][px] = color;
      pila.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
    }
    return l;
  }

  /** Pega otro lienzo encima, respetando su transparencia. */
  function pegar(l, otro, x, y) {
    for (var j = 0; j < otro.alto; j++) {
      for (var i = 0; i < otro.ancho; i++) {
        var c = otro.filas[j][i];
        if (c !== otro.vacio) punto(l, x + i, y + j, c);
      }
    }
    return l;
  }

  /** Espeja horizontalmente: sirve para dibujar media figura y duplicarla. */
  function espejar(l) {
    return {
      ancho: l.ancho,
      alto: l.alto,
      vacio: l.vacio,
      filas: l.filas.map(function (f) { return f.slice().reverse(); })
    };
  }

  function contar(l, color) {
    var n = 0;
    for (var y = 0; y < l.alto; y++) {
      for (var x = 0; x < l.ancho; x++) if (l.filas[y][x] === color) n++;
    }
    return n;
  }

  /**
   * Agrupa los píxeles por color en rectángulos horizontales (run-length).
   * Un <rect> por corrida en vez de uno por píxel: mismo dibujo, muchos menos
   * nodos en el DOM.
   * @returns {Array<{color:string,x:number,y:number,ancho:number}>}
   */
  function corridas(l) {
    var salida = [];
    for (var y = 0; y < l.alto; y++) {
      var x = 0;
      while (x < l.ancho) {
        var c = l.filas[y][x];
        if (c === l.vacio) { x++; continue; }
        var inicio = x;
        while (x < l.ancho && l.filas[y][x] === c) x++;
        salida.push({ color: c, x: inicio, y: y, ancho: x - inicio });
      }
    }
    return salida;
  }

  return {
    VACIO: VACIO,
    crear: crear,
    desdeTexto: desdeTexto,
    aTexto: aTexto,
    dentro: dentro,
    leer: leer,
    punto: punto,
    rect: rect,
    linea: linea,
    curva: curva,
    rellenar: rellenar,
    pegar: pegar,
    espejar: espejar,
    contar: contar,
    corridas: corridas
  };
});
