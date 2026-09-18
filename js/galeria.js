/**
 * galeria.js — la grilla de fotos y el visor.
 *
 * Si todavía no hay fotos cargadas, dibuja marcos vacíos en vez de un hueco:
 * la pieza se ve terminada desde el primer día y se entiende dónde van.
 *
 * El visor se maneja con mouse, teclado (flechas, Escape) y deslizando el dedo.
 */
(function (raiz) {
  'use strict';

  var S = raiz.Amor.sprites;
  var MARCOS_VACIOS = 6;
  var DESLIZ_MINIMO = 45;   // px de arrastre horizontal para pasar de foto

  function texto(valor) {
    var d = document.createElement('div');
    d.textContent = valor == null ? '' : String(valor);
    return d.innerHTML;
  }

  function normalizarFoto(f) {
    if (!f) return null;
    var src = f.imagen || f.src || f.foto;
    if (!src) return null;
    var texto = f.texto || f.p || f.pie || '';
    return { src: src, imagen: src, texto: texto, pie: texto };
  }

  function montar(opciones) {
    var grilla = opciones.grilla;
    var visor = opciones.visor;
    var visorImg = visor.querySelector('img');
    var visorPie = visor.querySelector('.visor__pie');
    var btnPrevia = visor.querySelector('.visor__control--previa');
    var btnProxima = visor.querySelector('.visor__control--proxima');
    var btnCerrar = visor.querySelector('.visor__control--cerrar');

    var fotos = (opciones.fotos || []).map(normalizarFoto).filter(Boolean);
    var alAbrir = opciones.alAbrir || function () {};
    var alPasar = opciones.alPasar || function () {};
    var indice = 0;
    var ultimoFoco = null;

    // ------------------------------------------------------------- grilla --
    /** Los marcos punteados de cuando todavía no hay fotos. */
    function pintarVacia() {
      grilla.innerHTML = '';
      var svg = S.aSVG(S.CORAZON, { paleta: Object.assign({}, S.PALETA, {
        R: '#EBB6C3', L: '#F3D2DA'
      }) });
      for (var v = 0; v < MARCOS_VACIOS; v++) {
        var hueco = document.createElement('div');
        hueco.className = 'foto foto--vacia';
        hueco.innerHTML = svg + '<span>' + texto(opciones.textoVacio || '') + '</span>';
        grilla.appendChild(hueco);
      }
    }

    function pintarGrilla() {
      grilla.innerHTML = '';

      if (!fotos.length) { pintarVacia(); return; }

      var rotas = 0;

      fotos.forEach(function (foto, i) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'foto';
        var textoVisible = foto.texto || foto.pie || '';
        boton.setAttribute('aria-label', 'Ver foto ' + (i + 1) + ' de ' + fotos.length +
          (textoVisible ? ': ' + textoVisible : ''));

        var img = document.createElement('img');
        img.src = foto.src;
        img.alt = textoVisible || '';
        img.loading = i < 4 ? 'eager' : 'lazy';
        img.decoding = 'async';
        // Si una foto no existe, el marco se va en vez de mostrar un ícono roto.
        // Y si fallan TODAS (la carpeta se movió, o se publicó el sitio sin las
        // imágenes), vuelven los marcos punteados: mejor eso que un título
        // "Nosotros" con la nada abajo.
        img.addEventListener('error', function () {
          boton.remove();
          if (++rotas === fotos.length) pintarVacia();
        });
        boton.appendChild(img);

        // Hover personalizado con el <p> de texto
        if (textoVisible) {
          var hoverCapa = document.createElement('div');
          hoverCapa.className = 'foto__hover';
          var pHover = document.createElement('p');
          pHover.className = 'foto__texto';
          pHover.textContent = textoVisible;
          hoverCapa.appendChild(pHover);
          boton.appendChild(hoverCapa);
        }

        boton.addEventListener('click', function () { abrir(i, boton); });
        grilla.appendChild(boton);
      });
    }

    // Carga fotos.json dinámicamente si está disponible para ver cambios al instante
    if (typeof fetch === 'function') {
      fetch('fotos.json?t=' + Date.now())
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (lista) {
          if (Array.isArray(lista) && lista.length) {
            fotos = lista.map(normalizarFoto).filter(Boolean);
            pintarGrilla();
          }
        })
        .catch(function () {
          // Si corre bajo file:// sin servidor, usa las fotos cargadas previamente
        });
    }

    // -------------------------------------------------------------- visor --
    function mostrar(i, callado) {
      var previo = indice;
      indice = (i + fotos.length) % fotos.length;
      if (!callado && indice !== previo) alPasar();
      var foto = fotos[indice];
      var textoFoto = foto.texto || foto.pie || '';
      visorImg.src = foto.src;
      visorImg.alt = textoFoto || ('Foto ' + (indice + 1));
      visorPie.textContent = textoFoto || ((indice + 1) + ' / ' + fotos.length);

      var unaSola = fotos.length < 2;
      btnPrevia.hidden = unaSola;
      btnProxima.hidden = unaSola;
    }

    function abrir(i, origen) {
      if (!fotos.length) return;
      ultimoFoco = origen || document.activeElement;
      mostrar(i, true);
      alAbrir();
      visor.setAttribute('data-abierto', '');
      btnCerrar.focus();
      document.addEventListener('keydown', teclado);
    }

    function cerrar() {
      visor.removeAttribute('data-abierto');
      visorImg.removeAttribute('src');
      document.removeEventListener('keydown', teclado);
      if (ultimoFoco && ultimoFoco.isConnected) ultimoFoco.focus();
    }

    function teclado(e) {
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mostrar(indice + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mostrar(indice - 1); }
      else if (e.key === 'Tab') {
        // El foco no se escapa del visor mientras está abierto.
        var foco = [btnCerrar, btnPrevia, btnProxima].filter(function (b) { return !b.hidden; });
        var pos = foco.indexOf(document.activeElement);
        e.preventDefault();
        var proximo = e.shiftKey ? pos - 1 : pos + 1;
        foco[(proximo + foco.length) % foco.length].focus();
      }
    }

    btnCerrar.addEventListener('click', cerrar);
    btnPrevia.addEventListener('click', function () { mostrar(indice - 1); });
    btnProxima.addEventListener('click', function () { mostrar(indice + 1); });
    visor.addEventListener('click', function (e) {
      if (e.target === visor) cerrar();   // tocar el fondo cierra
    });

    // deslizar con el dedo
    var arranqueX = null;
    visor.addEventListener('pointerdown', function (e) { arranqueX = e.clientX; });
    visor.addEventListener('pointerup', function (e) {
      if (arranqueX === null) return;
      var d = e.clientX - arranqueX;
      arranqueX = null;
      if (Math.abs(d) < DESLIZ_MINIMO) return;
      mostrar(indice + (d < 0 ? 1 : -1));
    });
    visor.addEventListener('pointercancel', function () { arranqueX = null; });

    pintarGrilla();

    return {
      get cantidad() { return fotos.length; },
      abrir: abrir,
      cerrar: cerrar
    };
  }

  raiz.Amor = Object.assign(raiz.Amor || {}, { galeria: { montar: montar } });
})(window);
