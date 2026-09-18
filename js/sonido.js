/**
 * sonido.js — el reproductor.
 *
 * Agenda en Web Audio las recetas de js/core/recetas-sonido.js. No decide cómo
 * suena nada: eso son datos y viven en core. Acá está sólo lo que necesita un
 * navegador de verdad.
 *
 * Tres cosas que no son obvias y son la causa de la mayoría de los bugs de
 * audio en una página:
 *
 *  1. El AudioContext se crea recién con el primer gesto de la persona. Si se
 *     crea al cargar, los navegadores lo dejan suspendido y encima avisan por
 *     consola. Por eso despertar() se llama desde adentro del manejador del
 *     evento, no en el arranque.
 *  2. En iOS el resume() tiene que pasar sincrónicamente dentro del gesto; si
 *     se hace en un setTimeout o después de un await, no suena nada.
 *  3. Cada reproducción necesita nodos nuevos: un oscilador que ya sonó no se
 *     puede volver a arrancar. Se crean, se agendan y se tiran solos.
 *
 * Si el navegador no tiene Web Audio, o la persona apaga el sonido, todo sigue
 * funcionando igual: acá nada es obligatorio.
 */
(function (raiz) {
  'use strict';

  var R = raiz.Amor.recetas;
  var LLAVE = 'carta-de-amor:sonido';

  function crear(opciones) {
    var porDefecto = !(opciones && opciones.porDefecto === false);
    var ctx = null;
    var maestro = null;
    var ruido = null;          // buffer de ruido blanco, uno solo y reusado
    var encendido = leerPreferencia(porDefecto);
    var roto = false;          // el navegador no soporta Web Audio
    var tensor = null;         // la voz continua del arco
    var ultimoEscalon = -1;

    // -------------------------------------------------------- preferencia --
    function leerPreferencia(siNoHayNada) {
      try {
        var v = raiz.localStorage.getItem(LLAVE);
        // Lo que eligió quien mira gana sobre lo que diga contenido.js.
        return v === null ? siNoHayNada : v === '1';
      } catch (e) {
        return siNoHayNada;   // ventana privada o cookies bloqueadas
      }
    }

    function guardarPreferencia(v) {
      try { raiz.localStorage.setItem(LLAVE, v ? '1' : '0'); } catch (e) { /* da igual */ }
    }

    // ------------------------------------------------------------ arranque --
    /**
     * Crea o reanuda el contexto. Tiene que llamarse DESDE un manejador de
     * evento de la persona, sincrónicamente.
     */
    function despertar() {
      if (roto || !encendido) return false;

      if (!ctx) {
        var Ctx = raiz.AudioContext || raiz.webkitAudioContext;
        if (!Ctx) { roto = true; return false; }
        try {
          ctx = new Ctx();
        } catch (e) { roto = true; return false; }

        maestro = ctx.createGain();
        maestro.gain.value = R.MAESTRO;
        maestro.connect(ctx.destination);

        // Dos segundos de ruido blanco alcanzan para todas las ráfagas.
        var largo = Math.floor(ctx.sampleRate * 2);
        ruido = ctx.createBuffer(1, largo, ctx.sampleRate);
        var datos = ruido.getChannelData(0);
        for (var i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
      }

      if (ctx.state === 'suspended') ctx.resume();
      return ctx.state !== 'suspended';
    }

    function listo() {
      return Boolean(encendido && ctx && !roto && ctx.state === 'running');
    }

    // ------------------------------------------------------------- curvas --
    function aplicarCurva(param, puntos, t0, escala) {
      var k = escala == null ? 1 : escala;
      param.setValueAtTime(puntos[0][1] * k, t0 + puntos[0][0]);
      for (var i = 1; i < puntos.length; i++) {
        param.linearRampToValueAtTime(puntos[i][1] * k, t0 + puntos[i][0]);
      }
    }

    /**
     * Toca una receta.
     * @param {string} nombre  clave de RECETAS
     * @param {object} [opc]   { volumen } 0..1 sobre la envolvente de la receta
     */
    function tocar(nombre, opc) {
      if (!listo()) return;
      var receta = R.RECETAS[nombre];
      if (!receta) return;

      var o = opc || {};
      var volumen = o.volumen == null ? 1 : o.volumen;
      var ahora = ctx.currentTime;

      for (var i = 0; i < receta.voces.length; i++) {
        var voz = receta.voces[i];
        var t0 = ahora + (voz.retardo || 0);
        var fuente;

        if (voz.onda === 'ruido') {
          fuente = ctx.createBufferSource();
          fuente.buffer = ruido;
          // Arranca en un punto al azar del buffer: dos ráfagas seguidas no
          // suenan idénticas, que es lo que delata al ruido pregrabado.
          fuente.loop = true;
        } else {
          fuente = ctx.createOscillator();
          fuente.type = voz.onda;
          aplicarCurva(fuente.frequency, voz.frecuencia, t0);
        }

        var ganancia = ctx.createGain();
        aplicarCurva(ganancia.gain, voz.ganancia, t0, volumen);

        var destino = ganancia;
        if (voz.filtro) {
          var filtro = ctx.createBiquadFilter();
          filtro.type = voz.filtro.tipo;
          if (voz.filtro.q != null) filtro.Q.value = voz.filtro.q;
          aplicarCurva(filtro.frequency, voz.filtro.frecuencia, t0);
          fuente.connect(filtro);
          filtro.connect(ganancia);
        } else {
          fuente.connect(ganancia);
        }
        destino.connect(maestro);

        var fin = t0 + R.finDeVoz({ retardo: 0, ganancia: voz.ganancia, frecuencia: voz.frecuencia, filtro: voz.filtro }) + 0.02;
        fuente.start(voz.onda === 'ruido' ? t0 : t0);
        fuente.stop(fin);

        // Soltar los nodos apenas terminan: si no, se acumulan.
        fuente.onended = (function (f, g) {
          return function () { try { g.disconnect(); f.disconnect(); } catch (e) { /* ya estaba */ } };
        })(fuente, ganancia);
      }
    }

    // -------------------------------------------------------- el arco vivo --
    function tensarInicio() {
      if (!listo() || tensor) return;

      var osc = ctx.createOscillator();
      osc.type = R.TENSAR.onda;
      osc.frequency.value = R.frecuenciaTension(0);

      var filtro = ctx.createBiquadFilter();
      filtro.type = R.TENSAR.filtro.tipo;
      filtro.Q.value = R.TENSAR.filtro.q;
      filtro.frequency.value = R.filtroTension(0);

      var g = ctx.createGain();
      g.gain.value = 0;

      osc.connect(filtro);
      filtro.connect(g);
      g.connect(maestro);
      osc.start();

      tensor = { osc: osc, filtro: filtro, ganancia: g };
      ultimoEscalon = -1;
    }

    /** Sigue la tensión del arco: tono, brillo y volumen. */
    function tensarActualizar(tension) {
      if (!listo()) return;
      if (!tensor) tensarInicio();
      if (!tensor) return;

      var t = ctx.currentTime;
      // setTargetAtTime en vez de saltos: el zumbido se desliza en vez de
      // escalonarse cuadro a cuadro.
      tensor.osc.frequency.setTargetAtTime(R.frecuenciaTension(tension), t, 0.03);
      tensor.filtro.frequency.setTargetAtTime(R.filtroTension(tension), t, 0.05);
      tensor.ganancia.gain.setTargetAtTime(R.gananciaTension(tension), t, 0.04);

      var escalon = R.escalonTrinquete(tension);
      if (escalon > ultimoEscalon) {
        ultimoEscalon = escalon;
        if (escalon > 0) tocar('trinquete', { volumen: 0.5 + tension * 0.6 });
      }
    }

    /** Corta el zumbido con un desvanecido corto, para que no quede un clic. */
    function tensarFin() {
      if (!tensor) return;
      var t = ctx.currentTime;
      var nodos = tensor;
      tensor = null;
      ultimoEscalon = -1;

      nodos.ganancia.gain.cancelScheduledValues(t);
      nodos.ganancia.gain.setValueAtTime(nodos.ganancia.gain.value, t);
      nodos.ganancia.gain.linearRampToValueAtTime(R.SILENCIO, t + 0.06);
      nodos.osc.stop(t + 0.09);
      nodos.osc.onended = function () {
        try { nodos.ganancia.disconnect(); nodos.filtro.disconnect(); nodos.osc.disconnect(); }
        catch (e) { /* ya estaba */ }
      };
    }

    // ----------------------------------------------------------- encendido --
    function alternar() {
      encendido = !encendido;
      guardarPreferencia(encendido);
      if (!encendido) {
        tensarFin();
        if (maestro) maestro.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      } else {
        if (maestro) maestro.gain.setTargetAtTime(R.MAESTRO, ctx.currentTime, 0.02);
        despertar();
        tocar('encender');
      }
      return encendido;
    }

    return {
      despertar: despertar,
      tocar: tocar,
      tensarInicio: tensarInicio,
      tensarActualizar: tensarActualizar,
      tensarFin: tensarFin,
      alternar: alternar,
      get encendido() { return encendido; },
      get disponible() { return !roto; }
    };
  }

  raiz.Amor = Object.assign(raiz.Amor || {}, { sonido: { crear: crear } });
})(window);
