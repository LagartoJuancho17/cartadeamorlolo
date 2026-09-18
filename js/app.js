/**
 * app.js — la orquestación.
 *
 * Tres escenas encadenadas:
 *   1. el sobre y el arco   -> tensar y soltar la flecha
 *   2. el gatito            -> la pregunta, el NO que se escapa, el SÍ
 *   3. la carta             -> contador, carta y galería
 *
 * Toda la lógica que se puede testear sin navegador vive en js/core/. Acá sólo
 * hay pegamento: escuchar eventos, pedirle números a core y aplicarlos al DOM.
 */
(function (raiz) {
  'use strict';

  var A = raiz.Amor;
  var C = raiz.CONTENIDO || {};
  var doc = document;

  var $ = function (sel) { return doc.querySelector(sel); };

  var ESCALA_FLECHA = A.arco.G.largoFlecha / A.sprites.FLECHA.alto;

  var particulas = A.corazones.crear($('#particulas'));
  var esTacto = raiz.matchMedia && raiz.matchMedia('(hover: none)').matches;

  // ======================================================== dibujar sprites ==

  function pintarSprites() {
    $('#sobre').innerHTML = A.sprites.aSVG(A.sprites.SOBRE, { clase: 'sobre__svg' });

    // La flecha va adentro del SVG del arco: sólo los rects, sin <svg> propio.
    $('#flecha').innerHTML = svgInterno(A.sprites.FLECHA);

    $('#gato-cara').innerHTML = A.sprites.aSVG(A.sprites.GATO, { clase: 'gato__cara' });

    var ojos = $('#gato-ojos');
    ojos.innerHTML = '';
    Object.keys(A.sprites.OJOS).forEach(function (humor) {
      var cont = doc.createElement('div');
      cont.innerHTML = A.sprites.aSVG(A.sprites.OJOS[humor]);
      var svg = cont.firstChild;
      svg.setAttribute('data-humor', humor);
      if (humor === 'normal') svg.setAttribute('data-visible', '');
      ojos.appendChild(svg);
    });

    $('#gato-corazon').innerHTML = A.sprites.aSVG(A.sprites.CORAZON);
  }

  /** Los rects del sprite, sin el <svg> de afuera: para meterlos en otro SVG. */
  function svgInterno(sprite) {
    var markup = A.sprites.aSVG(sprite);
    return markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  }

  // ============================================================== escenas ====

  var escenas = {
    arco: $('#escena-arco'),
    gato: $('#escena-gato'),
    carta: $('#escena-carta')
  };
  var escenaActual = 'arco';

  function irA(nombre) {
    if (escenaActual === nombre) return;
    Object.keys(escenas).forEach(function (k) {
      // inert, no sólo aria-hidden: si no, se puede tabular a los botones de
      // una escena que todavía no se ve, y el foco queda dentro de algo oculto.
      if (escenas[k].contains(doc.activeElement)) doc.activeElement.blur();
      escenas[k].removeAttribute('data-activa');
      escenas[k].setAttribute('inert', '');
      escenas[k].setAttribute('aria-hidden', 'true');
    });
    escenas[nombre].setAttribute('data-activa', '');
    escenas[nombre].removeAttribute('inert');
    escenas[nombre].setAttribute('aria-hidden', 'false');
    escenas[nombre].scrollTop = 0;
    escenaActual = nombre;

    if (nombre === 'gato') prepararGato();
    if (nombre === 'carta') prepararCarta();
  }

  // ======================================================== 1. EL ARCO =======

  var svgArco = $('#arco-svg');
  var madera = $('#arco-madera');
  var maderaLuz = $('#arco-luz');
  var cuerda = $('#arco-cuerda');
  var grupoFlecha = $('#flecha');
  var barra = $('#tension-barra');
  var cajaTension = $('#tension');
  var pista = $('#pista');
  var sobre = $('#sobre');

  var estadoArco = A.arco.crear();
  var arrastrando = false;
  var liberado = false;
  var ultimoGesto = 0;
  var ultimoY = 0;
  var previoCuadro = 0;
  var bucleVivo = false;

  function textoPista() {
    if (estadoArco.tension >= A.arco.UMBRAL) return (C.sobre && C.sobre.listo) || 'Soltá';
    return esTacto
      ? (C.sobre && C.sobre.pistaTacto) || 'Arrastrá hacia abajo'
      : (C.sobre && C.sobre.pista) || 'Deslizá hacia abajo';
  }

  function pintarArco() {
    var g = A.arco.geometria(estadoArco.tension, Math.random());

    var d = 'M ' + g.puntaIzq.x + ' ' + g.puntaIzq.y +
            ' Q ' + g.panza.x + ' ' + g.panza.y +
            ' ' + g.puntaDer.x + ' ' + g.puntaDer.y;
    madera.setAttribute('d', d);
    maderaLuz.setAttribute('d', d);

    cuerda.setAttribute('d',
      'M ' + g.puntaIzq.x + ' ' + g.puntaIzq.y +
      ' L ' + g.enganche.x + ' ' + g.enganche.y +
      ' L ' + g.puntaDer.x + ' ' + g.puntaDer.y);

    if (!estadoArco.disparado) {
      grupoFlecha.setAttribute('transform',
        'translate(' + g.flecha.x + ' ' + g.flecha.colaY + ') ' +
        'scale(' + ESCALA_FLECHA + ') ' +
        'translate(' + (-A.sprites.FLECHA.ancho / 2) + ' ' + (-A.sprites.FLECHA.alto) + ')');
    }

    barra.style.width = (g.tension * 100).toFixed(1) + '%';
    cajaTension.setAttribute('aria-valuenow', Math.round(g.tension * 100));
    cajaTension.classList.toggle('listo', g.listo);
    pista.classList.toggle('listo', g.listo);
    pista.textContent = textoPista();
  }

  function bucleArco(t) {
    if (!bucleVivo) return;
    var dt = Math.min(t - (previoCuadro || t), 48);
    previoCuadro = t;

    if (!estadoArco.disparado) {
      var quieto = t - ultimoGesto;
      var soltado = A.arco.estaSoltado(arrastrando, liberado, quieto);

      if (A.arco.debeDisparar(estadoArco.tension, soltado)) {
        disparar();
      } else {
        // Aflojar recién después del respiro: si no, tensar a golpecitos con la
        // flecha del teclado no llega nunca al umbral.
        if (A.arco.debeRelajar(quieto)) {
          estadoArco.tension = A.arco.relajar(estadoArco.tension, dt);
        }
        pintarArco();
      }
    }
    raiz.requestAnimationFrame(bucleArco);
  }

  function tocar(incremento) {
    if (estadoArco.disparado) return;
    estadoArco.tension = A.arco.tensar(estadoArco.tension, incremento);
    ultimoGesto = performance.now();
    liberado = false;
  }

  /** Coordenadas de pantalla de un punto del viewBox del arco. */
  function aPantalla(punto) {
    var caja = svgArco.getBoundingClientRect();
    var escala = caja.width / 220;
    return { x: caja.left + punto.x * escala, y: caja.top + punto.y * escala, escala: escala };
  }

  function disparar() {
    if (estadoArco.disparado) return;
    estadoArco.disparado = true;

    var g = A.arco.geometria(estadoArco.tension, 0.5);
    var origen = aPantalla({ x: g.flecha.x, y: g.flecha.colaY });

    // La cuerda vuelve de golpe y la flecha del SVG desaparece.
    estadoArco.tension = 0;
    grupoFlecha.style.display = 'none';
    pintarArco();
    pista.textContent = '';
    barra.style.width = '0%';

    var cajaSobre = sobre.getBoundingClientRect();
    var destinoY = cajaSobre.top + cajaSobre.height * 0.55;
    var distancia = origen.y - destinoY;

    // Copia de la flecha que cruza la pantalla de verdad.
    var volando = doc.createElement('div');
    volando.className = 'flecha-vuelo';
    volando.innerHTML = A.sprites.aSVG(A.sprites.FLECHA);
    volando.style.cssText =
      'position:fixed;z-index:45;pointer-events:none;left:0;top:0;' +
      'width:' + (A.sprites.FLECHA.ancho * origen.escala * ESCALA_FLECHA) + 'px;';
    doc.body.appendChild(volando);

    var anchoFlecha = A.sprites.FLECHA.ancho * origen.escala * ESCALA_FLECHA;
    var altoFlecha = A.sprites.FLECHA.alto * origen.escala * ESCALA_FLECHA;
    var izquierda = origen.x - anchoFlecha / 2;
    var arriba = origen.y - altoFlecha;

    var duracion = 460;
    var inicio = null;

    function volar(t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / duracion, 1);
      var dy = A.arco.vuelo(p, distancia);
      volando.style.transform = 'translate(' + izquierda + 'px, ' + (arriba + dy) + 'px)';
      if (p < 1) raiz.requestAnimationFrame(volar);
      else impacto(volando, cajaSobre);
    }
    raiz.requestAnimationFrame(volar);
  }

  function impacto(volando, cajaSobre) {
    volando.remove();
    bucleVivo = false;

    particulas.estallido(
      cajaSobre.left + cajaSobre.width / 2,
      cajaSobre.top + cajaSobre.height * 0.5,
      30, 1.15
    );
    sobre.classList.add('golpeado');
    prenderCancion();

    setTimeout(function () {
      sobre.classList.remove('golpeado');
      sobre.innerHTML = A.sprites.aSVG(A.sprites.SOBRE_ABIERTO);
      sobre.classList.add('abierto');
      particulas.estallido(
        cajaSobre.left + cajaSobre.width / 2,
        cajaSobre.top + cajaSobre.height * 0.4,
        22, 0.8
      );
    }, 620);

    setTimeout(function () { irA('gato'); }, 1500);
  }

  function arrancarArco() {
    if (bucleVivo) return;
    bucleVivo = true;
    previoCuadro = 0;
    raiz.requestAnimationFrame(bucleArco);
  }

  // --- entradas: rueda, dedo y teclado --------------------------------------

  escenas.arco.addEventListener('wheel', function (e) {
    if (escenaActual !== 'arco' || estadoArco.disparado) return;
    e.preventDefault();
    tocar(A.arco.desdeRueda(e.deltaY, e.deltaMode));
  }, { passive: false });

  escenas.arco.addEventListener('pointerdown', function (e) {
    if (escenaActual !== 'arco' || estadoArco.disparado) return;
    arrastrando = true;
    liberado = false;
    ultimoY = e.clientY;
    ultimoGesto = performance.now();
    if (e.pointerType !== 'mouse') e.preventDefault();
  });

  raiz.addEventListener('pointermove', function (e) {
    if (!arrastrando || estadoArco.disparado) return;
    tocar(A.arco.desdeDedo(e.clientY - ultimoY));
    ultimoY = e.clientY;
  });

  function soltarPuntero() {
    if (!arrastrando) return;
    arrastrando = false;
    liberado = true;
  }
  raiz.addEventListener('pointerup', soltarPuntero);
  raiz.addEventListener('pointercancel', soltarPuntero);

  raiz.addEventListener('keydown', function (e) {
    if (escenaActual !== 'arco' || estadoArco.disparado) return;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      arrastrando = true;
      tocar(A.arco.desdeTecla());
    }
  });

  raiz.addEventListener('keyup', function (e) {
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Spacebar') {
      arrastrando = false;
      liberado = true;
    }
  });

  // ======================================================== 2. EL GATO =======

  var gato = $('#gato');
  var ojos = $('#gato-ojos');
  var corazonGato = $('#gato-corazon');
  var pregunta = $('#pregunta');
  var cajaBotones = $('#botones');
  var btnSi = $('#boton-si');
  var btnNo = $('#boton-no');
  var pistaCorazon = $('#pista-corazon');
  var cuerpoVentana = $('#ventana-cuerpo');
  var ventana = $('#ventana');

  var intentosNo = 0;
  var yaDijoQueSi = false;
  var relojParpadeo = null;

  function humorOjos(humor) {
    Array.prototype.forEach.call(ojos.children, function (svg) {
      if (svg.getAttribute('data-humor') === humor) svg.setAttribute('data-visible', '');
      else svg.removeAttribute('data-visible');
    });
  }

  function parpadear() {
    if (yaDijoQueSi) return;
    humorOjos('cerrados');
    setTimeout(function () { if (!yaDijoQueSi) humorOjos('normal'); }, 130);
  }

  function arrancarParpadeo() {
    clearInterval(relojParpadeo);
    relojParpadeo = setInterval(function () {
      if (Math.random() < 0.55) parpadear();
    }, 2600);
  }

  function prepararGato() {
    arrancarParpadeo();
    mostrarSaltearEn(20000);
  }

  function escapar(e) {
    if (yaDijoQueSi) return;

    // La primera vez que huye se sale de la fila de botones y pasa a moverse
    // por toda la ventana: si no, su padre posicionado lo encierra en 5rem.
    if (btnNo.parentNode !== cuerpoVentana) cuerpoVentana.appendChild(btnNo);

    var caja = cuerpoVentana.getBoundingClientRect();
    var cajaNo = btnNo.getBoundingClientRect();
    var cajaSi = btnSi.getBoundingClientRect();

    var puntero = e
      ? { x: e.clientX - caja.left, y: e.clientY - caja.top }
      : { x: cajaNo.left - caja.left + cajaNo.width / 2, y: cajaNo.top - caja.top + cajaNo.height / 2 };

    var destino = A.esquivar.nuevaPosicion({
      contenedor: { ancho: caja.width, alto: caja.height },
      boton: { ancho: cajaNo.width, alto: cajaNo.height },
      puntero: puntero,
      evitar: [{
        x: cajaSi.left - caja.left,
        y: cajaSi.top - caja.top,
        ancho: cajaSi.width,
        alto: cajaSi.height
      }]
    });

    intentosNo++;
    var escala = A.esquivar.escalas(intentosNo);
    btnNo.setAttribute('data-suelto', '');
    btnNo.style.setProperty('--x', destino.x + 'px');
    btnNo.style.setProperty('--y', destino.y + 'px');
    btnNo.style.setProperty('--escala', escala.no);
    btnNo.textContent = A.esquivar.burla(intentosNo);
    btnSi.style.setProperty('--escala', escala.si);
  }

  // El NO huye antes de que el clic llegue a destino, con mouse y con dedo.
  cuerpoVentana.addEventListener('pointermove', function (e) {
    if (yaDijoQueSi || e.pointerType !== 'mouse') return;
    var caja = btnNo.getBoundingClientRect();
    var rect = { x: caja.left, y: caja.top, ancho: caja.width, alto: caja.height };
    if (A.esquivar.debeEsquivar({ x: e.clientX, y: e.clientY }, rect, 68)) escapar(e);
  });

  btnNo.addEventListener('pointerdown', function (e) { e.preventDefault(); escapar(e); });
  btnNo.addEventListener('click', function (e) { e.preventDefault(); escapar(e); });
  btnNo.addEventListener('focus', function () {
    // También se escapa de quien lo persigue con el teclado.
    if (!yaDijoQueSi) escapar(null);
  });

  function cambiarPregunta(texto) {
    pregunta.classList.add('cambiando');
    setTimeout(function () {
      pregunta.textContent = texto;
      pregunta.classList.remove('cambiando');
    }, 340);
  }

  btnSi.addEventListener('click', function () {
    if (yaDijoQueSi) return;
    yaDijoQueSi = true;
    clearInterval(relojParpadeo);

    cajaBotones.classList.add('resuelto');
    btnNo.classList.add('rendido');
    btnSi.disabled = true;
    humorOjos('feliz');
    gato.classList.add('saltando');
    prenderCancion();

    particulas.desdeElemento(btnSi, 40, 1.4);
    particulas.lluvia(48);

    cambiarPregunta((C.gato && C.gato.festejo) || '¡Yaaay!');

    setTimeout(function () {
      cambiarPregunta((C.gato && C.gato.remate) || '');
      particulas.desdeElemento(corazonGato, 16, 0.7);
    }, 2100);

    setTimeout(function () {
      corazonGato.setAttribute('data-tocable', '');
      corazonGato.removeAttribute('disabled');
      corazonGato.setAttribute('aria-label', (C.gato && C.gato.pistaCorazon) || 'Abrir la carta');
      pistaCorazon.classList.add('visible');
    }, 3400);
  });

  corazonGato.addEventListener('click', function () {
    if (!corazonGato.hasAttribute('data-tocable')) return;
    corazonGato.removeAttribute('data-tocable');
    particulas.desdeElemento(corazonGato, 46, 1.5);
    particulas.lluvia(30);
    ventana.classList.add('despedida');
    pistaCorazon.classList.remove('visible');
    setTimeout(function () { irA('carta'); }, 700);
  });

  // ======================================================= 3. LA CARTA =======

  var relojContador = null;
  var cartaLista = false;

  function prepararCarta() {
    mostrarSaltear(false);
    if (cartaLista) { arrancarContador(); return; }
    cartaLista = true;

    // --- textos de la carta
    var carta = C.carta || {};
    $('#carta-titulo').textContent = carta.titulo || '';
    $('#carta-saludo').textContent = carta.saludo || '';

    var cuerpo = $('#carta-cuerpo');
    cuerpo.innerHTML = '';
    (carta.parrafos || []).forEach(function (texto) {
      var p = doc.createElement('p');
      p.className = 'parrafo';
      p.textContent = texto;
      cuerpo.appendChild(p);
    });

    $('#carta-despedida').textContent = carta.despedida || '';
    $('#carta-firma').textContent = carta.firma || '';

    revelarParrafos();

    // --- galería
    A.galeria.montar({
      grilla: $('#galeria-grilla'),
      visor: $('#visor'),
      fotos: C.fotos || [],
      textoVacio: (C.galeria && C.galeria.vacio) || ''
    });

    arrancarContador();
  }

  /** Los párrafos aparecen a medida que ella baja, no todos de golpe. */
  function revelarParrafos() {
    var parrafos = doc.querySelectorAll('#carta-cuerpo .parrafo');
    if (!raiz.IntersectionObserver) {
      Array.prototype.forEach.call(parrafos, function (p) { p.classList.add('leida'); });
      return;
    }
    var ojo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('leida');
        ojo.unobserve(entrada.target);
      });
    }, { root: escenas.carta, threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(parrafos, function (p) { ojo.observe(p); });
  }

  function pintarContador() {
    var d = A.duracion.calcular(C.fechaInicio, new Date());
    if (!d) {
      $('#contador-fecha').textContent = '—';
      $('#contador-dias').textContent = '—';
      $('#contador-detalle').innerHTML = 'Revisá <code>fechaInicio</code> en contenido.js';
      return;
    }
    var cfg = C.contador || {};
    $('#contador-etiqueta').textContent = cfg.titulo || 'Desde el';
    $('#contador-fecha').textContent = A.duracion.fechaLarga(C.fechaInicio);
    $('#contador-dias').textContent = A.duracion.miles(d.diasTotales);
    $('#contador-unidad').textContent = cfg.etiquetaDias || 'días juntos';
    $('#contador-detalle').innerHTML =
      A.duracion.enPalabras(d) +
      ' <span class="contador__reloj">' + A.duracion.reloj(d) + '</span> ' +
      (cfg.etiquetaReloj || '');
  }

  function arrancarContador() {
    pintarContador();
    clearInterval(relojContador);
    relojContador = setInterval(pintarContador, 1000);
  }

  // --- volver a empezar ------------------------------------------------------

  $('#reiniciar').addEventListener('click', function () {
    clearInterval(relojContador);

    estadoArco = A.arco.crear();
    arrastrando = false;
    liberado = false;
    grupoFlecha.style.display = '';
    sobre.classList.remove('abierto', 'golpeado');
    sobre.innerHTML = A.sprites.aSVG(A.sprites.SOBRE);
    pintarArco();
    arrancarArco();

    intentosNo = 0;
    yaDijoQueSi = false;
    cajaBotones.classList.remove('resuelto');
    btnSi.disabled = false;
    btnSi.style.removeProperty('--escala');
    btnNo.classList.remove('rendido');
    btnNo.removeAttribute('data-suelto');
    btnNo.removeAttribute('style');
    btnNo.textContent = (C.gato && C.gato.no) || 'NO';
    cajaBotones.appendChild(btnNo);
    corazonGato.disabled = true;
    pregunta.textContent = (C.gato && C.gato.pregunta) || '';
    humorOjos('normal');
    gato.classList.remove('saltando');
    ventana.classList.remove('despedida');
    corazonGato.removeAttribute('data-tocable');
    pistaCorazon.classList.remove('visible');

    particulas.limpiar();
    irA('arco');
    mostrarSaltearEn(14000);
  });

  // ============================================================== extras =====

  // --- saltear ---------------------------------------------------------------
  var btnSaltear = $('#saltear');
  var relojSaltear = null;

  function mostrarSaltear(visible) {
    btnSaltear.classList.toggle('visible', Boolean(visible));
  }
  function mostrarSaltearEn(ms) {
    clearTimeout(relojSaltear);
    mostrarSaltear(false);
    relojSaltear = setTimeout(function () {
      if (escenaActual !== 'carta') mostrarSaltear(true);
    }, ms);
  }

  btnSaltear.addEventListener('click', function () {
    bucleVivo = false;
    estadoArco.disparado = true;
    yaDijoQueSi = true;
    clearInterval(relojParpadeo);
    irA('carta');
  });

  // --- canción (opcional) ----------------------------------------------------
  var audio = $('#cancion');
  var btnSonido = $('#sonido');
  var sonando = false;

  function prenderCancion() {
    if (!C.cancion || sonando) return;
    audio.volume = 0.45;
    var intento = audio.play();
    if (intento && intento.then) {
      intento.then(function () {
        sonando = true;
        btnSonido.textContent = '♪';
        btnSonido.setAttribute('aria-label', 'Silenciar la música');
      }).catch(function () { /* el navegador la bloqueó: queda el botón */ });
    }
  }

  if (C.cancion) {
    audio.src = C.cancion;
    btnSonido.setAttribute('data-disponible', '');
    btnSonido.addEventListener('click', function () {
      if (audio.paused) {
        audio.play();
        sonando = true;
        btnSonido.textContent = '♪';
      } else {
        audio.pause();
        sonando = false;
        btnSonido.textContent = '♪̸';
      }
    });
  }

  // ================================================================ arranque ==

  function arrancar() {
    doc.title = (C.sobre && C.sobre.titulo ? C.sobre.titulo + ' ♥ ' : '') +
      'Para ' + (C.nombre || 'vos');

    pintarSprites();

    $('#titulo-sobre').innerHTML =
      '<span class="corazoncito">♥</span> ' +
      (C.sobre && C.sobre.titulo ? escaparHtml(C.sobre.titulo) : '') +
      ' <span class="corazoncito">♥</span>';

    $('#ventana-titulo').textContent = (C.gato && C.gato.ventana) || 'AMOR';
    pregunta.textContent = (C.gato && C.gato.pregunta) || '';
    btnSi.textContent = (C.gato && C.gato.si) || 'SÍ';
    btnNo.textContent = (C.gato && C.gato.no) || 'NO';
    pistaCorazon.textContent = (C.gato && C.gato.pistaCorazon) || '';

    $('#galeria-titulo').textContent = (C.galeria && C.galeria.titulo) || '';
    $('#galeria-subtitulo').textContent = (C.galeria && C.galeria.subtitulo) || '';
    $('#cierre-texto').textContent = (C.cierre && C.cierre.texto) || '';
    $('#reiniciar').textContent = (C.cierre && C.cierre.reiniciar) || 'Verlo de nuevo';

    pintarArco();
    arrancarArco();
    particulas.ambiente(true);
    mostrarSaltearEn(14000);
  }

  function escaparHtml(s) {
    var d = doc.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})(window);
