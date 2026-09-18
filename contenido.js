/* ============================================================================
 *  contenido.js  —  ESTE ES EL ÚNICO ARCHIVO QUE TENÉS QUE TOCAR
 * ----------------------------------------------------------------------------
 *  Todo lo personal vive acá. Cambiá los textos, la fecha y la lista de fotos.
 *  No hace falta tocar nada más del proyecto.
 *
 *  1. FECHA     -> la fecha en que se pusieron de novios (formato AAAA-MM-DD).
 *  2. CARTA     -> reemplazá el borrador por lo que le escribiste vos.
 *  3. FOTOS     -> poné las imágenes en la carpeta fotos/ y corré:
 *                     node bin/generar-galeria.mjs
 *                  (o escribí la lista a mano más abajo).
 *  4. CANCIÓN   -> opcional: poné un .mp3 en audio/ y escribí el nombre.
 * ========================================================================== */

window.CONTENIDO = {

  /* --- Ella ---------------------------------------------------------------- */
  // Como la llamás vos. Aparece en la carta y en la pestaña del navegador.
  nombre: 'mi amor',

  /* --- La fecha ------------------------------------------------------------ */
  // El día que se pusieron de novios. Si te acordás la hora, podés escribir
  // '2024-09-18T21:30' y el contador va a ser exacto hasta el segundo.
  fechaInicio: '2024-09-18',        // <-- CAMBIÁ ESTO

  /* --- El sobre (primera pantalla) ----------------------------------------- */
  sobre: {
    titulo: 'Feliz 2 años',
    pista: 'Deslizá hacia abajo para tensar el arco',
    pistaTacto: 'Arrastrá hacia abajo para tensar el arco',
    listo: 'Soltá'
  },

  /* --- El gatito (segunda pantalla) ---------------------------------------- */
  gato: {
    ventana: 'AMOR',
    pregunta: 'Feliz 2 años, mi amor ♡ ¿Me seguís amando?',
    si: 'SÍ',
    no: 'NO',
    festejo: '¡Yaaay! Te amo ♡',
    remate: 'Dos años de viaje y toda una vida por delante.',
    pistaCorazon: 'tocá mi corazón'
  },

  /* --- La carta ------------------------------------------------------------ *
   *  Esto es un borrador para que la pieza se vea completa desde el primer día.
   *  Reemplazalo por tu carta. Cada string de "parrafos" es un párrafo.
   * ------------------------------------------------------------------------- */
  carta: {
    titulo: 'Para vos',
    saludo: 'Mi amor,',
    parrafos: [
      'Hace dos años que existe una fecha que divide mi vida en antes y después, y es la de hoy. No sé bien cómo pasó: un día estabas del otro lado de una conversación y al siguiente ya eras el lugar al que vuelvo.',

      'Me gusta cómo te reís cuando algo te causa gracia de verdad, esa risa que no podés frenar. Me gusta cómo te ponés seria cuando algo te importa. Me gusta que me escuches hasta el final incluso cuando estoy diciendo cualquier cosa, y que después me digas la verdad igual.',

      'De estos dos años me quedo con lo chiquito: los viajes en auto con música fuerte, las comidas improvisadas, las charlas a las tres de la mañana que empiezan en una pavada y terminan en algo enorme. Los planes que hicimos y los que todavía no.',

      'Gracias por bancarme los días en los que no soy fácil. Gracias por celebrar las cosas que a nadie más le parecen importantes. Gracias por elegirme de nuevo cada mañana, incluso los días en los que no era obvio.',

      'Te amo. Te amo de una manera tranquila y también de una manera que no me deja dormir. Y si me dieran a elegir otra vez, te elegiría en el primer intento, sin pensarlo, todas las veces.'
    ],
    despedida: 'Feliz aniversario, mi amor.',
    firma: 'Toto'
  },

  /* --- El contador --------------------------------------------------------- */
  contador: {
    titulo: 'Desde el',
    etiquetaDias: 'días juntos',
    etiquetaReloj: 'y contando'
  },

  /* --- La galería ---------------------------------------------------------- */
  galeria: {
    titulo: 'Nosotros',
    subtitulo: 'un par de momentos que no quiero olvidarme',
    vacio: 'Acá van nuestras fotos'
  },

  /* --- Cierre -------------------------------------------------------------- */
  cierre: {
    texto: 'Gracias por estos dos años.',
    reiniciar: 'Verlo de nuevo'
  },

  /* --- Canción (opcional) --------------------------------------------------- *
   *  Poné un archivo en audio/ y escribí acá el nombre, por ejemplo:
   *      cancion: 'audio/nuestra-cancion.mp3'
   *  Dejalo en null si no querés música.
   * ------------------------------------------------------------------------- */
  cancion: null,

  /* --- Fotos ---------------------------------------------------------------- *
   *  Se completa sola con:  node bin/generar-galeria.mjs
   *  También podés escribirla a mano:
   *      { src: 'fotos/playa.jpg', pie: 'Mar del Plata, enero' }
   *  El "pie" es opcional.
   * ------------------------------------------------------------------------- */
  fotos: []
};
