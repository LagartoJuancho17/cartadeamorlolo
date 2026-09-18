#!/usr/bin/env node
/**
 * generar-galeria.mjs — arma la lista de fotos leyendo la carpeta fotos/.
 *
 * Por qué es un script y no algo que se escribe a mano: listar archivos,
 * ordenarlos y escaparlos es trabajo determinista. Se corre una vez por cada
 * tanda de fotos nuevas y no hay forma de equivocarse en el orden ni de dejar
 * una foto afuera.
 *
 * Uso:
 *    node bin/generar-galeria.mjs
 *
 * Escribe js/fotos-generado.js, que index.html carga antes que la app.
 * Los pies de foto opcionales salen del nombre del archivo:
 *    "2024-12-24 nochebuena en casa.jpg"  ->  "nochebuena en casa"
 *    "playa.jpg"                          ->  "playa"
 *    "IMG_4821.jpg"                       ->  (sin pie)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = path.join(RAIZ, 'fotos');
const SALIDA = path.join(RAIZ, 'js', 'fotos-generado.js');
const FOTOS_JSON = path.join(RAIZ, 'fotos.json');

const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

/**
 * Palabras que no dicen nada de la foto. Un nombre hecho solamente de estas
 * palabras y de números es basura de cámara: mejor sin pie que "IMG_4821" o
 * "WhatsApp Image 2024-09-18 at 21.30.15".
 */
const RUIDO = /^(img|image|imagen|photo|foto|pic|picture|dsc|dscn|pxl|vid|video|mov|screenshot|captura|pantalla|whatsapp|wa|copia|copy|final|nuevo|new|at|de|del|la|el|los|las)$/i;

const SOLO_NUMEROS = /^[\d.:_-]+$/;

export function pieDesdeNombre(archivo) {
  let base = path.basename(archivo, path.extname(archivo));
  base = base.replace(/^\d{4}-\d{2}-\d{2}[\s_-]*/, '');   // saca la fecha del principio
  base = base.replace(/^\d+[\s_.-]+/, '');                // saca "01 - "
  base = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return null;

  // Si después de sacar el ruido no queda ninguna palabra con contenido, no hay pie.
  const utiles = base.split(' ').filter((t) => {
    if (SOLO_NUMEROS.test(t)) return false;
    return !RUIDO.test(t.replace(/\d+$/, ''));
  });
  if (!utiles.length) return null;

  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Orden natural: foto2 antes que foto10. */
const natural = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

async function main() {
  let archivos;
  try {
    archivos = await readdir(CARPETA);
  } catch {
    console.error(`No encontré la carpeta ${path.relative(RAIZ, CARPETA)}/`);
    process.exit(1);
  }

  const mapaTextos = new Map();
  try {
    const dataJson = JSON.parse(await readFile(FOTOS_JSON, 'utf8'));
    if (Array.isArray(dataJson)) {
      for (const item of dataJson) {
        const key = item.imagen || item.src || item.foto;
        const texto = item.texto || item.p || item.pie;
        if (key && texto) {
          mapaTextos.set(key, texto);
          mapaTextos.set(path.basename(key), texto);
        }
      }
    }
  } catch {}

  const fotos = archivos
    .filter((f) => !f.startsWith('.'))
    .filter((f) => EXTENSIONES.has(path.extname(f).toLowerCase()))
    .sort(natural.compare)
    .map((f) => {
      // encodeURI, no el nombre crudo: los espacios, los acentos y un '#' en
      // el nombre del archivo rompen el src si van sin escapar.
      const ruta = `fotos/${encodeURIComponent(f)}`;
      const foto = { imagen: ruta, src: ruta };
      const texto = mapaTextos.get(ruta) || mapaTextos.get(f) || pieDesdeNombre(f);
      if (texto) {
        foto.texto = texto;
        foto.pie = texto;
      }
      return foto;
    });

  const lineas = fotos.map((f) => '  ' + JSON.stringify(f)).join(',\n');

  const contenido = `/* Generado por bin/generar-galeria.mjs — no lo edites a mano.
 * Volvé a correr:  node bin/generar-galeria.mjs
 * Fotos encontradas: ${fotos.length}
 */
window.FOTOS_GENERADAS = [
${lineas}
];

// Si contenido.js no trae una lista propia, se usa esta.
if (window.CONTENIDO && (!window.CONTENIDO.fotos || !window.CONTENIDO.fotos.length)) {
  window.CONTENIDO.fotos = window.FOTOS_GENERADAS;
}
`;

  await writeFile(SALIDA, contenido, 'utf8');

  if (!fotos.length) {
    console.log('No hay fotos todavía en fotos/. Poné las imágenes ahí y volvé a correr esto.');
  } else {
    console.log(`${fotos.length} foto${fotos.length === 1 ? '' : 's'} en la galería:`);
    for (const f of fotos) console.log(`  ${f.src}${f.pie ? `  —  ${f.pie}` : ''}`);
  }
  console.log(`\nEscrito: ${path.relative(RAIZ, SALIDA)}`);
}

// Sólo corre cuando se lo invoca directo; los tests importan pieDesdeNombre.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
