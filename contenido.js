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
  nombre: 'Lolito',

  /* --- La fecha ------------------------------------------------------------ */
  // El día que se pusieron de novios. Si te acordás la hora, podés escribir
  // '2024-09-18T21:30' y el contador va a ser exacto hasta el segundo.
  fechaInicio: '2024-09-15',        // <-- CAMBIÁ ESTO

  /* --- El sobre (primera pantalla) ----------------------------------------- */
  sobre: {
    titulo: 'Feliz 2 años',
    pista: 'Deslizá hacia abajo para tensar el arco',
    pistaTacto: 'Arrastrá hacia abajo para tensar el arco',
    listo: 'Soltá'
  },

  /* --- El gatito (segunda pantalla) ---------------------------------------- */
  gato: {
    ventana: 'Lolo',
    pregunta: 'Feliz 2 años, mi amor ♡ ¿Me seguís amando?',
    si: 'SÍ',
    no: 'NO',
    festejo: 'Siiii! Te amo ♡ Papoi',
    remate: 'Dos años de viaje y toda una vida por delante.',
    pistaCorazon: 'tocá mi corazón'
  },

  /* --- La carta ------------------------------------------------------------ *
   *  Esto es un borrador para que la pieza se vea completa desde el primer día.
   *  Reemplazalo por tu carta. Cada string de "parrafos" es un párrafo.
   * ------------------------------------------------------------------------- */
  carta: {
    titulo: 'Para Lolito',
    saludo: 'Mi amor,',
    parrafos: [
      'Lo, Lolo, Lola, Lolita, y demás apodos que te puse y te pondré en el futuro.',

      'La verdad es que no se cómo arrancar esta carta…',

      'Quizás porque no se me ocurren palabras para resumir lo que fueron estos dos años. Así que voy a intentar ser lo mas conciso posiblel: Gracias por cruzarte en mi vida y por quedarte a construir todo esto conmigo.',

      'Me encanta ver cómo crecés, la fuerza que le ponés a todo y esa energía que transforma cualquier espacio en un lugar más divertido y familiar. Sos mi persona favorita para volver a casa, para salir a cualquier lado o para mimir siesta y no hacer absolutamente nada.',

      'Te deseo proyectos que te apasionen, risas y toda la felicidad que siempre das, multiplicada por mil. Yo solo te prometo seguir estando al lado tuyo: para festejarte cada logro, darte la mano en las malas y seguir inventando apodos ridículos que solo nosotros entendamos.',

      'Gracias por estos dos años tan hermosos de los cuales me llevo los recuerdos mas lindos de mi vida.',

      'Pd: Vinci tambien te quiere mucho mucho mucho mucho, no hay mejor madre para él.'

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

  /* --- Sonido -------------------------------------------------------------- *
   *  Los efectos (arco, flechazo, boing del NO, fanfarria del SÍ, latido) son
   *  sintetizados: no hay archivos de audio. Poné false si querés que arranque
   *  en silencio. Ella igual lo puede prender con el botón de arriba a la
   *  derecha, y el navegador se acuerda de lo que eligió.
   * ------------------------------------------------------------------------- */
  sonido: true,

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
