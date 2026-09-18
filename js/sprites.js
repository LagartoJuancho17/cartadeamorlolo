/**
 * sprites.js — el pixel art de la pieza.
 *
 * El gato está escrito a mano (es una forma orgánica y se lee mejor dibujada).
 * El sobre y la flecha se construyen con las primitivas de lienzo.js, porque
 * son geometría y a mano salen torcidos.
 *
 * Los ojos son sprites aparte: así el gato parpadea y se pone feliz sin
 * redibujar la cabeza entera.
 */
(function (raiz, fabrica) {
  'use strict';
  var lienzo = (raiz.Amor && raiz.Amor.lienzo) ||
    (typeof require === 'function' ? require('./core/lienzo.js') : null);
  if (!lienzo) throw new Error('sprites.js necesita que lienzo.js se cargue antes');
  var API = fabrica(lienzo);
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { sprites: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function (L) {
  'use strict';

  var PALETA = {
    K: '#191016',   // negro del gato
    W: '#FFF7F3',   // blanco de ojos
    P: '#F0A3B7',   // rosa (rubor, oreja, plumas)
    N: '#E07A94',   // nariz
    R: '#D6455D',   // rojo corazón
    L: '#F07E92',   // brillo del corazón
    D: '#A62A42',   // sombra del corazón
    E: '#DC8A9C',   // borde del sobre
    B: '#FFF7F3',   // papel del sobre
    F: '#F6CBD6',   // solapa del sobre
    M: '#8E6244'    // madera de la flecha
  };

  // ---------------------------------------------------------------- el gato --
  // 24 x 18. Cabeza sin ojos: los ojos van encima como sprite aparte.
  var GATO = L.desdeTexto([
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

  // Los tres humores. Se pegan en (0, 8) sobre la cabeza.
  var OJOS_Y = 8;

  var OJOS = {
    normal: L.desdeTexto([
      '...WWWW..........WWWW...',
      '...WWWW..........WWWW...',
      '...WWWW..........WWWW...'
    ]),
    // Parpadeo: una línea fina.
    cerrados: L.desdeTexto([
      '........................',
      '...WWWW..........WWWW...',
      '........................'
    ]),
    // Feliz: dos arcos ◡ ◡.
    feliz: L.desdeTexto([
      '...W..W..........W..W...',
      '....WW............WW....',
      '........................'
    ])
  };

  // ------------------------------------------------------------- corazones --
  // El grande es el que sostiene el gato y el que se toca para abrir la carta.
  var CORAZON = L.desdeTexto([
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

  // El chico es el sello del sobre y la partícula que vuela.
  var CORAZON_CHICO = L.desdeTexto([
    '.RR..RR.',
    'RRRRRRRR',
    'RRRRRRRR',
    '.RRRRRR.',
    '..RRRR..',
    '...RR...'
  ]);

  // ----------------------------------------------------------------- sobre --
  function construirSobre() {
    var l = L.crear(32, 22);
    L.rect(l, 0, 0, 32, 22, 'E', false);      // marco
    L.rect(l, 1, 1, 30, 20, 'B', true);       // papel
    L.linea(l, 1, 20, 15, 12, 'E');           // pliegue inferior izquierdo
    L.linea(l, 30, 20, 16, 12, 'E');          // pliegue inferior derecho
    L.linea(l, 1, 1, 15, 13, 'E');            // solapa izquierda
    L.linea(l, 30, 1, 16, 13, 'E');           // solapa derecha
    L.rellenar(l, 16, 3, 'F');                // pinta la solapa de rosa
    L.pegar(l, CORAZON_CHICO, 12, 8);         // sello
    return l;
  }

  // Sobre abierto: la solapa levantada deja ver el papel.
  function construirSobreAbierto() {
    var l = L.crear(32, 22);
    L.rect(l, 0, 6, 32, 16, 'E', false);
    L.rect(l, 1, 7, 30, 14, 'B', true);
    L.linea(l, 1, 20, 15, 12, 'E');
    L.linea(l, 30, 20, 16, 12, 'E');
    // solapa abierta hacia arriba
    L.linea(l, 1, 7, 15, 0, 'E');
    L.linea(l, 30, 7, 16, 0, 'E');
    L.linea(l, 15, 0, 16, 0, 'E');
    L.rellenar(l, 16, 3, 'F');
    return l;
  }

  // ---------------------------------------------------------------- flecha --
  // Corta y ancha: al lado de un arco de trazo grueso, una flecha de asta fina
  // desaparece. El asta son 3 píxeles, no 1.
  function construirFlecha() {
    var l = L.crear(13, 34);

    // punta
    var punta = [[6, 1], [5, 3], [4, 5], [3, 7], [2, 9], [1, 11]];
    for (var i = 0; i < punta.length; i++) {
      L.rect(l, punta[i][0], i, punta[i][1], 1, 'R', true);
    }
    L.rect(l, 5, 6, 3, 1, 'R', true);   // cuello

    // asta: entera hasta abajo, también por dentro de las plumas
    L.rect(l, 5, 6, 3, 28, 'M', true);

    // plumas
    var bordeIzq = [4, 3, 2, 2, 3, 4];
    var bordeDer = [8, 9, 10, 10, 9, 8];
    for (var j = 0; j < bordeIzq.length; j++) {
      var y = 28 + j;
      L.linea(l, bordeIzq[j], y, 4, y, 'P');
      L.linea(l, bordeDer[j], y, 8, y, 'P');
    }
    return l;
  }

  var SOBRE = construirSobre();
  var SOBRE_ABIERTO = construirSobreAbierto();
  var FLECHA = construirFlecha();

  /**
   * Convierte un lienzo en markup SVG. Una corrida = un <rect>, no un rect por
   * píxel: el gato pasa de 432 nodos a 18.
   */
  function aSVG(lienzo, opciones) {
    var o = opciones || {};
    var paleta = o.paleta || PALETA;
    var partes = [];
    var corridas = L.corridas(lienzo);

    // Los rects se solapan un pelo. Con height="1" exacto, al escalar el SVG
    // los bordes caen en píxeles fraccionarios y aparecen costuras blancas
    // horizontales entre fila y fila; el solape las tapa y no se nota.
    var SOLAPE = 0.04;

    for (var i = 0; i < corridas.length; i++) {
      var c = corridas[i];
      var color = paleta[c.color] || c.color;
      partes.push(
        '<rect x="' + c.x + '" y="' + c.y +
        '" width="' + (c.ancho + SOLAPE) + '" height="' + (1 + SOLAPE) +
        '" fill="' + color + '"/>'
      );
    }

    var atributos = [
      'viewBox="0 0 ' + lienzo.ancho + ' ' + lienzo.alto + '"',
      'shape-rendering="crispEdges"',
      'xmlns="http://www.w3.org/2000/svg"'
    ];
    if (o.clase) atributos.push('class="' + o.clase + '"');
    if (o.id) atributos.push('id="' + o.id + '"');
    atributos.push('aria-hidden="true"', 'focusable="false"');
    if (o.preserveAspectRatio) atributos.push('preserveAspectRatio="' + o.preserveAspectRatio + '"');

    return '<svg ' + atributos.join(' ') + '>' + partes.join('') + '</svg>';
  }

  /** Dibuja un lienzo en un canvas 2D, para las partículas. */
  function aCanvas(lienzo, ctx, x, y, escala, color) {
    var corridas = L.corridas(lienzo);
    for (var i = 0; i < corridas.length; i++) {
      var c = corridas[i];
      ctx.fillStyle = color || PALETA[c.color] || c.color;
      ctx.fillRect(
        x + c.x * escala,
        y + c.y * escala,
        c.ancho * escala,
        escala
      );
    }
  }

  return {
    PALETA: PALETA,
    GATO: GATO,
    OJOS: OJOS,
    OJOS_Y: OJOS_Y,
    CORAZON: CORAZON,
    CORAZON_CHICO: CORAZON_CHICO,
    SOBRE: SOBRE,
    SOBRE_ABIERTO: SOBRE_ABIERTO,
    FLECHA: FLECHA,
    aSVG: aSVG,
    aCanvas: aCanvas
  };
});
