/**
 * arco.js — tensar el arco y soltar la flecha.
 *
 * Todo lo que decide "cuánto está tensado" y "dónde se dibuja cada cosa" vive
 * acá, sin DOM y sin reloj. La vista sólo pinta lo que este módulo devuelve.
 *
 * Reglas de disparo (las mismas para rueda, dedo y teclado):
 *  - Si la tensión llega a 1, dispara sola (tensado completo).
 *  - Si se suelta con tensión >= UMBRAL, dispara.
 *  - Si se suelta por debajo del umbral, la cuerda vuelve sola a cero, pero
 *    recién después de GRACIA milisegundos sin que nadie toque nada.
 *
 * Ese respiro no es un detalle: sin él, tensar a golpecitos (flechita del
 * teclado, o scroll de trackpad en tandas) es imposible, porque entre golpe y
 * golpe la cuerda se come todo lo ganado y la tensión nunca sube.
 */
(function (raiz, fabrica) {
  'use strict';
  var API = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { arco: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var UMBRAL = 0.55;          // tensión mínima para que salga la flecha
  var DECAIMIENTO = 0.0011;   // tensión que se pierde por milisegundo sin tocar
  var GRACIA = 460;           // ms de quietud antes de empezar a aflojar
  var ESPERA_RUEDA = 170;     // ms sin rueda que se leen como "ya soltó"
  var PASO_RUEDA = 460;       // px de scroll para tensar de 0 a 1
  var PASO_DEDO = 230;        // px de arrastre para tensar de 0 a 1
  var PASO_TECLA = 0.085;     // tensión por pulsación de flecha/espacio
  var TOPE_EVENTO = 0.22;     // ningún evento suelto puede tensar más que esto

  // Geometría del arco, en unidades del viewBox 0 0 220 172 de index.html.
  var G = {
    puntaIzq: { x: 24, y: 96 },
    puntaDer: { x: 196, y: 96 },
    panza: { x: 110, y: 156 },   // punto de control de la curva en reposo
    centro: 110,
    recorrido: 54,               // cuánto baja el enganche en tensión máxima
    largoFlecha: 70
  };

  function limitar(v, min, max) { return Math.min(Math.max(v, min), max); }

  // Un evento de rueda no siempre mide en píxeles: deltaMode 1 son líneas
  // (Firefox manda ~3 por muesca) y deltaMode 2 son páginas. Sin normalizar,
  // en Firefox hay que scrollear cientos de veces para tensar el arco.
  var PIXELES_POR_LINEA = 16;
  var PIXELES_POR_PAGINA = 400;

  /**
   * Convierte un evento de rueda en incremento de tensión.
   * @param {number} deltaY
   * @param {number} [deltaMode] 0 píxeles (default), 1 líneas, 2 páginas
   */
  function desdeRueda(deltaY, deltaMode) {
    var px = deltaY;
    if (deltaMode === 1) px = deltaY * PIXELES_POR_LINEA;
    else if (deltaMode === 2) px = deltaY * PIXELES_POR_PAGINA;
    return limitar(px / PASO_RUEDA, -TOPE_EVENTO, TOPE_EVENTO);
  }

  /** Convierte px arrastrados hacia abajo en incremento de tensión. */
  function desdeDedo(deltaPx) {
    return limitar(deltaPx / PASO_DEDO, -TOPE_EVENTO, TOPE_EVENTO);
  }

  function desdeTecla() { return PASO_TECLA; }

  function tensar(tension, incremento) {
    return limitar(tension + incremento, 0, 1);
  }

  /** Relaja la cuerda con el paso del tiempo (ms). */
  function relajar(tension, dt) {
    return limitar(tension - DECAIMIENTO * dt, 0, 1);
  }

  /**
   * @param {number} tension 0..1
   * @param {boolean} soltado ¿el usuario ya soltó?
   */
  function debeDisparar(tension, soltado) {
    if (tension >= 1) return true;
    return Boolean(soltado) && tension >= UMBRAL;
  }

  /**
   * ¿Ya se puede empezar a aflojar la cuerda?
   * @param {number} quietoMs ms desde el último gesto de quien tensa
   */
  function debeRelajar(quietoMs) {
    return quietoMs > GRACIA;
  }

  /**
   * ¿Se puede dar por soltado? La rueda del mouse no avisa cuándo termina, así
   * que un ratito de silencio cuenta como haber soltado.
   * @param {boolean} arrastrando ¿hay dedo o botón apretado?
   * @param {boolean} liberado    ¿hubo un pointerup/keyup explícito?
   * @param {number}  quietoMs    ms desde el último gesto
   */
  function estaSoltado(arrastrando, liberado, quietoMs) {
    if (arrastrando) return false;
    return Boolean(liberado) || quietoMs > ESPERA_RUEDA;
  }

  /**
   * Posiciones de cada pieza del arco para una tensión dada.
   * @param {number} tension 0..1
   * @param {number} [ruido] 0..1 inyectable; controla el temblor del pulso
   */
  function geometria(tension, ruido) {
    var t = limitar(tension, 0, 1);
    var r = ruido == null ? 0 : ruido;

    // Al tensar, las puntas se juntan y la panza se hace menos honda.
    var juntar = t * 9;
    var puntaIzq = { x: G.puntaIzq.x + juntar, y: G.puntaIzq.y + t * 6 };
    var puntaDer = { x: G.puntaDer.x - juntar, y: G.puntaDer.y + t * 6 };
    var panza = { x: G.panza.x, y: G.panza.y - t * 16 };

    // El temblor sólo aparece cuando el brazo ya está sufriendo.
    var temblor = Math.max(0, t - 0.6) * 7.5;
    var tiemble = (r * 2 - 1) * temblor;

    var enganche = {
      x: G.centro + tiemble,
      y: G.puntaIzq.y + t * G.recorrido
    };

    return {
      tension: t,
      puntaIzq: puntaIzq,
      puntaDer: puntaDer,
      panza: panza,
      enganche: enganche,
      temblor: temblor,
      flecha: {
        x: enganche.x,
        colaY: enganche.y,
        puntaY: enganche.y - G.largoFlecha
      },
      listo: t >= UMBRAL
    };
  }

  /**
   * Vuelo de la flecha: de dónde sale hasta dónde llega, con salida rápida.
   * @param {number} progreso 0..1
   * @returns {number} desplazamiento vertical (negativo = sube)
   */
  function vuelo(progreso, distancia) {
    var p = limitar(progreso, 0, 1);
    var acelerado = 1 - Math.pow(1 - p, 2.4); // sale disparada y llega frenando
    return -acelerado * distancia;
  }

  /** Estado mutable mínimo, para que la vista no invente reglas propias. */
  function crear() {
    return {
      tension: 0,
      soltado: false,
      disparado: false,
      ultimoToque: 0
    };
  }

  return {
    crear: crear,
    tensar: tensar,
    relajar: relajar,
    debeDisparar: debeDisparar,
    debeRelajar: debeRelajar,
    estaSoltado: estaSoltado,
    geometria: geometria,
    vuelo: vuelo,
    desdeRueda: desdeRueda,
    desdeDedo: desdeDedo,
    desdeTecla: desdeTecla,
    limitar: limitar,
    UMBRAL: UMBRAL,
    DECAIMIENTO: DECAIMIENTO,
    GRACIA: GRACIA,
    ESPERA_RUEDA: ESPERA_RUEDA,
    PASO_TECLA: PASO_TECLA,
    G: G
  };
});
