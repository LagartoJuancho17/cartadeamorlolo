/**
 * recetas-sonido.js — qué suena cada cosa, como datos.
 *
 * Acá no hay Web Audio ni navegador: sólo la descripción de cada sonido
 * (osciladores, curvas de frecuencia, envolventes de volumen, filtros). El
 * reproductor de js/sonido.js las agenda; este módulo se puede testear entero
 * en Node.
 *
 * No hay un solo archivo de audio en el proyecto. Todo se sintetiza en el
 * momento, así que la pieza sigue funcionando abriendo index.html a doble clic,
 * sin conexión y sin binarios en el repo.
 *
 * Reglas que los tests verifican, porque romperlas se ESCUCHA:
 *  - toda envolvente arranca y termina en silencio; si no, hay un "clic" seco
 *    al empezar y otro al cortar.
 *  - los tiempos de cada curva van siempre para adelante; Web Audio tira
 *    excepción si una automatización va hacia atrás.
 *  - todo suena dentro del rango audible y ninguna receta satura al sumarse.
 */
(function (raiz, fabrica) {
  'use strict';
  var API = fabrica();
  if (typeof module === 'object' && module.exports) module.exports = API;
  else raiz.Amor = Object.assign(raiz.Amor || {}, { recetas: API });
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SILENCIO = 0.0001;   // Web Audio no rampea a 0 exacto: este es el piso
  var MAESTRO = 0.7;       // volumen general; deja aire para que nada sature

  function limitar(v, min, max) { return Math.min(Math.max(v, min), max); }

  /**
   * Cada receta es { duracion, voces: [...] }.
   * Una voz es { onda, frecuencia, ganancia, filtro?, retardo? } donde
   * `frecuencia` y `ganancia` son listas de [segundos, valor].
   * `onda` puede ser una forma de oscilador o 'ruido' (ráfaga de ruido blanco).
   */
  var RECETAS = {

    // Trinquete: un clic seco cada tanto mientras se tensa el arco. Es el
    // sonido que hace que tensar se sienta con cuerpo y no mudo.
    trinquete: {
      duracion: 0.06,
      voces: [{
        onda: 'square',
        frecuencia: [[0, 900], [0.05, 620]],
        ganancia: [[0, SILENCIO], [0.004, 0.15], [0.055, SILENCIO]]
      }]
    },

    // El latigazo de la cuerda al soltar.
    disparo: {
      duracion: 0.3,
      voces: [
        {
          onda: 'square',
          frecuencia: [[0, 540], [0.05, 190], [0.26, 95]],
          ganancia: [[0, SILENCIO], [0.008, 0.2], [0.09, 0.07], [0.29, SILENCIO]]
        },
        {
          onda: 'ruido',
          filtro: { tipo: 'bandpass', frecuencia: [[0, 2000], [0.2, 700]], q: 1.2 },
          ganancia: [[0, SILENCIO], [0.005, 0.15], [0.2, SILENCIO]]
        }
      ]
    },

    // La flecha cruzando la pantalla.
    vuelo: {
      duracion: 0.42,
      voces: [{
        onda: 'ruido',
        filtro: { tipo: 'bandpass', frecuencia: [[0, 600], [0.16, 2600], [0.4, 900]], q: 3 },
        ganancia: [[0, SILENCIO], [0.06, 0.26], [0.24, 0.2], [0.41, SILENCIO]]
      }]
    },

    // La flecha clavándose en el sobre: golpe grave y astillas agudas.
    impacto: {
      duracion: 0.34,
      voces: [
        {
          onda: 'triangle',
          frecuencia: [[0, 150], [0.12, 62], [0.3, 48]],
          ganancia: [[0, SILENCIO], [0.006, 0.26], [0.32, SILENCIO]]
        },
        {
          onda: 'ruido',
          filtro: { tipo: 'highpass', frecuencia: [[0, 1400], [0.18, 3200]], q: 0.7 },
          ganancia: [[0, SILENCIO], [0.004, 0.13], [0.16, SILENCIO]]
        }
      ]
    },

    // El sobre abriéndose: tres notas que suben (do-mi-sol).
    abrir: {
      duracion: 0.6,
      voces: [
        { onda: 'triangle', retardo: 0,    frecuencia: [[0, 523.25]], ganancia: [[0, SILENCIO], [0.02, 0.15], [0.26, SILENCIO]] },
        { onda: 'triangle', retardo: 0.1,  frecuencia: [[0, 659.25]], ganancia: [[0, SILENCIO], [0.02, 0.15], [0.26, SILENCIO]] },
        { onda: 'triangle', retardo: 0.2,  frecuencia: [[0, 783.99]], ganancia: [[0, SILENCIO], [0.02, 0.17], [0.38, SILENCIO]] }
      ]
    },


    // El "SÍ": do-mi-sol-do, con una segunda voz por abajo.
    si: {
      duracion: 0.95,
      voces: [
        { onda: 'square',   retardo: 0,    frecuencia: [[0, 523.25]], ganancia: [[0, SILENCIO], [0.015, 0.12], [0.2, SILENCIO]] },
        { onda: 'square',   retardo: 0.09, frecuencia: [[0, 659.25]], ganancia: [[0, SILENCIO], [0.015, 0.12], [0.2, SILENCIO]] },
        { onda: 'square',   retardo: 0.18, frecuencia: [[0, 783.99]], ganancia: [[0, SILENCIO], [0.015, 0.12], [0.2, SILENCIO]] },
        { onda: 'square',   retardo: 0.27, frecuencia: [[0, 1046.5]], ganancia: [[0, SILENCIO], [0.015, 0.14], [0.5, SILENCIO]] },
        { onda: 'triangle', retardo: 0.27, frecuencia: [[0, 261.63]], ganancia: [[0, SILENCIO], [0.03, 0.12], [0.6, SILENCIO]] }
      ]
    },

    // El corazón del gato: dos latidos graves y una campanita tibia.
    corazon: {
      duracion: 1.1,
      voces: [
        { onda: 'sine',     retardo: 0,    frecuencia: [[0, 78], [0.16, 54]],  ganancia: [[0, SILENCIO], [0.02, 0.3], [0.2, SILENCIO]] },
        { onda: 'sine',     retardo: 0.26, frecuencia: [[0, 70], [0.18, 48]],  ganancia: [[0, SILENCIO], [0.02, 0.22], [0.24, SILENCIO]] },
        { onda: 'triangle', retardo: 0.42, frecuencia: [[0, 880], [0.5, 878]], ganancia: [[0, SILENCIO], [0.04, 0.1], [0.62, SILENCIO]] },
        { onda: 'triangle', retardo: 0.42, frecuencia: [[0, 1318.5]],          ganancia: [[0, SILENCIO], [0.05, 0.06], [0.62, SILENCIO]] }
      ]
    },

    // Abrir una foto de la galería.
    foto: {
      duracion: 0.12,
      voces: [{
        onda: 'triangle',
        frecuencia: [[0, 660], [0.08, 990]],
        ganancia: [[0, SILENCIO], [0.008, 0.17], [0.11, SILENCIO]]
      }]
    },

    // Pasar de foto: un tic mínimo, para que deslizar tenga respuesta.
    pasar: {
      duracion: 0.07,
      voces: [{
        onda: 'triangle',
        frecuencia: [[0, 1180], [0.05, 1180]],
        ganancia: [[0, SILENCIO], [0.004, 0.11], [0.065, SILENCIO]]
      }]
    },

    // Volver a empezar.
    reinicio: {
      duracion: 0.42,
      voces: [
        { onda: 'triangle', retardo: 0,    frecuencia: [[0, 783.99]], ganancia: [[0, SILENCIO], [0.02, 0.1], [0.2, SILENCIO]] },
        { onda: 'triangle', retardo: 0.1,  frecuencia: [[0, 523.25]], ganancia: [[0, SILENCIO], [0.02, 0.1], [0.3, SILENCIO]] }
      ]
    },

    // Prender y apagar el sonido, para que el botón se confirme a sí mismo.
    encender: {
      duracion: 0.2,
      voces: [{
        onda: 'triangle',
        frecuencia: [[0, 587.33], [0.08, 880]],
        ganancia: [[0, SILENCIO], [0.01, 0.1], [0.19, SILENCIO]]
      }]
    }
  };

  // ------------------------------------------------------- el arco tensado --

  // La cuerda tensándose: un zumbido grave que sube con la tensión. No es una
  // receta suelta porque vive mientras dure el gesto, no se dispara y termina.
  var TENSAR = {
    onda: 'sawtooth',
    grave: 46,           // Hz con el arco flojo
    agudo: 172,          // Hz con el arco al tope
    ganancia: 0.11,      // volumen con el arco al tope
    filtro: { tipo: 'lowpass', grave: 220, agudo: 900, q: 6 },
    pasoTrinquete: 0.075 // cada cuánta tensión suena un clic de trinquete
  };

  /** Altura del zumbido para una tensión dada. Sube siempre, nunca se dispara. */
  function frecuenciaTension(tension) {
    var t = limitar(tension, 0, 1);
    return TENSAR.grave + (TENSAR.agudo - TENSAR.grave) * Math.pow(t, 1.35);
  }

  /** Corte del filtro: el arco se abre y brilla a medida que se tensa. */
  function filtroTension(tension) {
    var t = limitar(tension, 0, 1);
    return TENSAR.filtro.grave + (TENSAR.filtro.agudo - TENSAR.filtro.grave) * t;
  }

  /** Volumen del zumbido: arranca en silencio y crece con la tensión. */
  function gananciaTension(tension) {
    var t = limitar(tension, 0, 1);
    return TENSAR.ganancia * Math.pow(t, 0.8);
  }

  /** En qué escalón de trinquete cae una tensión: sirve para no repetir el clic. */
  function escalonTrinquete(tension) {
    return Math.floor(limitar(tension, 0, 1) / TENSAR.pasoTrinquete);
  }

  // ----------------------------------------------------------- validaciones --

  /** Duración real de una voz, contando su retardo. */
  function finDeVoz(voz) {
    var curvas = [voz.ganancia, voz.frecuencia, voz.filtro && voz.filtro.frecuencia];
    var fin = 0;
    for (var i = 0; i < curvas.length; i++) {
      var c = curvas[i];
      if (!c || !c.length) continue;
      fin = Math.max(fin, c[c.length - 1][0]);
    }
    return (voz.retardo || 0) + fin;
  }

  /**
   * Revisa una receta y devuelve la lista de problemas (vacía si está sana).
   * Se usa desde los tests, no en caliente.
   */
  function revisar(nombre, receta) {
    var fallas = [];
    if (!receta.voces || !receta.voces.length) fallas.push(nombre + ': no tiene voces');

    (receta.voces || []).forEach(function (voz, i) {
      var donde = nombre + ' voz ' + i;

      if (!voz.ganancia || voz.ganancia.length < 2) {
        fallas.push(donde + ': la envolvente necesita al menos dos puntos');
        return;
      }
      if (voz.ganancia[0][1] > 0.001) fallas.push(donde + ': arranca fuerte, va a hacer clic');
      if (voz.ganancia[voz.ganancia.length - 1][1] > 0.001) {
        fallas.push(donde + ': no vuelve al silencio, va a cortar seco');
      }

      [['ganancia', voz.ganancia],
       ['frecuencia', voz.frecuencia],
       ['filtro', voz.filtro && voz.filtro.frecuencia]
      ].forEach(function (par) {
        var curva = par[1];
        if (!curva) return;
        for (var k = 1; k < curva.length; k++) {
          if (curva[k][0] <= curva[k - 1][0]) {
            fallas.push(donde + ' ' + par[0] + ': los tiempos tienen que ir para adelante');
          }
        }
      });

      if (voz.onda !== 'ruido' && voz.frecuencia) {
        voz.frecuencia.forEach(function (p) {
          if (p[1] < 20 || p[1] > 20000) fallas.push(donde + ': ' + p[1] + ' Hz está fuera del rango audible');
        });
      }

      if (finDeVoz(voz) > receta.duracion + 0.001) {
        fallas.push(donde + ': dura más que la receta (' + finDeVoz(voz).toFixed(3) + ' > ' + receta.duracion + ')');
      }
    });

    return fallas;
  }

  /** Pico teórico si todas las voces sonaran a la vez: para no saturar. */
  function picoDeReceta(receta) {
    return (receta.voces || []).reduce(function (suma, voz) {
      var max = (voz.ganancia || []).reduce(function (m, p) { return Math.max(m, p[1]); }, 0);
      return suma + max;
    }, 0);
  }

  return {
    RECETAS: RECETAS,
    TENSAR: TENSAR,
    MAESTRO: MAESTRO,
    SILENCIO: SILENCIO,
    frecuenciaTension: frecuenciaTension,
    filtroTension: filtroTension,
    gananciaTension: gananciaTension,
    escalonTrinquete: escalonTrinquete,
    finDeVoz: finDeVoz,
    revisar: revisar,
    picoDeReceta: picoDeReceta
  };
});
