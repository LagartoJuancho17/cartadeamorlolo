/**
 * corazones.js — las partículas.
 *
 * Un solo canvas a pantalla completa y un solo bucle de animación para todo:
 * los corazones que flotan de fondo, el estallido del "SÍ" y la lluvia del
 * final. Las partículas se dibujan con el mismo sprite pixelado que el resto
 * de la pieza, así no hay dos estéticas conviviendo.
 *
 * Se apaga solo cuando no hay nada que dibujar: no gasta batería de gusto.
 */
(function (raiz) {
  'use strict';

  var S = raiz.Amor.sprites;

  var COLORES = ['#D6455D', '#E8697F', '#F0A3B7', '#F6CBD6', '#A62A42'];
  var TOPE = 260;                 // techo de partículas simultáneas
  var G = 0.00028;                // gravedad, px/ms²

  function crear(canvas) {
    var ctx = canvas.getContext('2d');
    var particulas = [];
    var ambienteActivo = false;
    var proximoAmbiente = 0;
    var ultimo = 0;
    var corriendo = false;
    var dpr = 1;
    var ancho = 0;
    var alto = 0;

    var quieto = raiz.matchMedia &&
      raiz.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function medir() {
      dpr = Math.min(raiz.devicePixelRatio || 1, 2);
      ancho = raiz.innerWidth;
      alto = raiz.innerHeight;
      canvas.width = Math.round(ancho * dpr);
      canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function azar(min, max) { return min + Math.random() * (max - min); }

    function nacer(p) {
      if (particulas.length >= TOPE) particulas.shift();
      particulas.push(p);
      arrancar();
    }

    /** Corazón que sube despacio desde abajo, permanente y discreto. */
    function unAmbiente() {
      var escala = azar(0.9, 2.2);
      nacer({
        x: azar(-20, ancho + 20),
        y: alto + 20,
        vx: azar(-0.012, 0.012),
        vy: azar(-0.028, -0.055),
        gravedad: 0,
        giro: azar(-0.0006, 0.0006),
        angulo: azar(-0.3, 0.3),
        escala: escala,
        color: COLORES[Math.floor(azar(2, 4))],
        alfa: azar(0.16, 0.4),
        vida: Infinity
      });
    }

    /** Estallido desde un punto: el "SÍ", el flechazo, el corazón del gato. */
    function estallido(x, y, cantidad, fuerza) {
      var n = cantidad || 26;
      var f = fuerza || 1;
      for (var i = 0; i < n; i++) {
        var a = azar(0, Math.PI * 2);
        var v = azar(0.14, 0.52) * f;
        nacer({
          x: x,
          y: y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - azar(0.05, 0.3) * f,
          gravedad: G,
          giro: azar(-0.004, 0.004),
          angulo: azar(0, Math.PI * 2),
          escala: azar(1.4, 3.6),
          color: COLORES[Math.floor(azar(0, COLORES.length))],
          alfa: 1,
          vida: azar(1400, 2600)
        });
      }
    }

    /** Lluvia desde arriba, para el festejo grande. */
    function lluvia(cantidad) {
      var n = cantidad || 40;
      for (var i = 0; i < n; i++) {
        nacer({
          x: azar(0, ancho),
          y: azar(-alto * 0.5, -10),
          vx: azar(-0.02, 0.02),
          vy: azar(0.08, 0.2),
          gravedad: G * 0.25,
          giro: azar(-0.0025, 0.0025),
          angulo: azar(0, Math.PI * 2),
          escala: azar(1.2, 3),
          color: COLORES[Math.floor(azar(0, COLORES.length))],
          alfa: 1,
          vida: azar(3200, 5200)
        });
      }
    }

    function paso(dt) {
      for (var i = particulas.length - 1; i >= 0; i--) {
        var p = particulas[i];
        p.vy += p.gravedad * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angulo += p.giro * dt;

        if (p.vida !== Infinity) {
          p.vida -= dt;
          if (p.vida < 500) p.alfa = Math.max(0, p.vida / 500);
        }

        var fuera = p.y < -80 || p.y > alto + 80 || p.x < -80 || p.x > ancho + 80;
        if (p.alfa <= 0 || (p.vida !== Infinity && p.vida <= 0) || fuera) {
          particulas.splice(i, 1);
        }
      }
    }

    function pintar() {
      ctx.clearRect(0, 0, ancho, alto);
      var sprite = S.CORAZON_CHICO;
      var mitadX = sprite.ancho / 2;
      var mitadY = sprite.alto / 2;

      for (var i = 0; i < particulas.length; i++) {
        var p = particulas[i];
        ctx.save();
        ctx.globalAlpha = p.alfa;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angulo);
        S.aCanvas(sprite, ctx, -mitadX * p.escala, -mitadY * p.escala, p.escala, p.color);
        ctx.restore();
      }
    }

    function cuadro(ahora) {
      var dt = Math.min(ahora - (ultimo || ahora), 48);
      ultimo = ahora;

      if (ambienteActivo) {
        proximoAmbiente -= dt;
        if (proximoAmbiente <= 0) {
          unAmbiente();
          proximoAmbiente = azar(520, 1400);
        }
      }

      paso(dt);
      pintar();

      if (particulas.length || ambienteActivo) {
        raiz.requestAnimationFrame(cuadro);
      } else {
        corriendo = false;
        ctx.clearRect(0, 0, ancho, alto);
      }
    }

    function arrancar() {
      if (corriendo || quieto) return;
      corriendo = true;
      ultimo = 0;
      raiz.requestAnimationFrame(cuadro);
    }

    medir();
    raiz.addEventListener('resize', medir);

    return {
      ambiente: function (encendido) {
        ambienteActivo = Boolean(encendido) && !quieto;
        if (ambienteActivo) { proximoAmbiente = 0; arrancar(); }
      },
      estallido: function (x, y, n, fuerza) {
        if (quieto) return;
        estallido(x, y, n, fuerza);
      },
      lluvia: function (n) {
        if (quieto) return;
        lluvia(n);
      },
      /** Estalla desde el centro de un elemento del DOM. */
      desdeElemento: function (el, n, fuerza) {
        if (!el || quieto) return;
        var r = el.getBoundingClientRect();
        estallido(r.left + r.width / 2, r.top + r.height / 2, n, fuerza);
      },
      limpiar: function () {
        particulas.length = 0;
      },
      get quieto() { return quieto; }
    };
  }

  raiz.Amor = Object.assign(raiz.Amor || {}, { corazones: { crear: crear } });
})(window);
