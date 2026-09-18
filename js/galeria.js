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

  function montar(opciones) {
    var grilla = opciones.grilla;
    var visor = opciones.visor;
    var visorImg = visor.querySelector('img');
    var visorPie = visor.querySelector('.visor__pie');
    var btnPrevia = visor.querySelector('.visor__control--previa');
    var btnProxima = visor.querySelector('.visor__control--proxima');
    var btnCerrar = visor.querySelector('.visor__control--cerrar');

    var fotos = (opciones.fotos || []).filter(function (f) { return f && f.src; });
    var indice = 0;
    var ultimoFoco = null;

    // ------------------------------------------------------------- grilla --
    function pintarGrilla() {
      grilla.innerHTML = '';

      if (!fotos.length) {
        var svg = S.aSVG(S.CORAZON, { paleta: Object.assign({}, S.PALETA, {
          R: '#EBB6C3', L: '#F3D2DA'
        }) });
        for (var v = 0; v < MARCOS_VACIOS; v++) {
          var hueco = document.createElement('div');
          hueco.className = 'foto foto--vacia';
          hueco.innerHTML = svg + '<span>' + texto(opciones.textoVacio || '') + '</span>';
          grilla.appendChild(hueco);
        }
        return;
      }

      fotos.forEach(function (foto, i) {
        var boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'foto';
        boton.setAttribute('aria-label', 'Ver foto ' + (i + 1) + ' de ' + fotos.length +
          (foto.pie ? ': ' + foto.pie : ''));

        var img = document.createElement('img');
        img.src = foto.src;
        img.alt = foto.pie || '';
        img.loading = i < 4 ? 'eager' : 'lazy';
        img.decoding = 'async';
        // Si una foto no existe, el marco se va en vez de mostrar un ícono roto.
        img.addEventListener('error', function () {
          boton.remove();
        });
        boton.appendChild(img);

        if (foto.pie) {
          var pie = document.createElement('span');
          pie.className = 'foto__pie';
          pie.textContent = foto.pie;
          boton.appendChild(pie);
        }

        boton.addEventListener('click', function () { abrir(i, boton); });
        grilla.appendChild(boton);
      });
    }

    // -------------------------------------------------------------- visor --
    function mostrar(i) {
      indice = (i + fotos.length) % fotos.length;
      var foto = fotos[indice];
      visorImg.src = foto.src;
      visorImg.alt = foto.pie || ('Foto ' + (indice + 1));
      visorPie.textContent = foto.pie || (indice + 1) + ' / ' + fotos.length;

      var unaSola = fotos.length < 2;
      btnPrevia.hidden = unaSola;
      btnProxima.hidden = unaSola;
    }

    function abrir(i, origen) {
      if (!fotos.length) return;
      ultimoFoco = origen || document.activeElement;
      mostrar(i);
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
