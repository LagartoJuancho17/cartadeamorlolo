#!/usr/bin/env node
/**
 * armar-artifact.mjs — convierte index.html en la página que espera un Artifact.
 *
 * Un Artifact publicado ya viene envuelto en su propio <!doctype>, <html>,
 * <head> y <body>, así que la página no puede traer los suyos. En vez de
 * mantener dos HTML a mano (que se desincronizan al primer cambio), este script
 * deriva uno del otro:
 *
 *   - saca el envoltorio del documento
 *   - sube el <title> y los <link> del head al principio del archivo
 *   - deja el resto igual: mismos scripts, mismo CSS, mismos ids
 *
 * Uso:
 *    node bin/armar-artifact.mjs
 *
 * Escribe build/artifact.html. Los demás archivos (css/, js/, fotos/) se
 * publican al lado, con las mismas rutas relativas, así que no hay que tocarlos.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRADA = path.join(RAIZ, 'index.html');
const SALIDA = path.join(RAIZ, 'build', 'artifact.html');

/** El <title> del Artifact: es el nombre en la galería, no el del navegador. */
const TITULO = 'Feliz 2 años';

export function armar(html, titulo = TITULO) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/i);
  const body = html.match(/<body>([\s\S]*?)<\/body>/i);
  if (!head) throw new Error('index.html no tiene <head>');
  if (!body) throw new Error('index.html no tiene <body>');

  // Del head sobreviven el título y las hojas de estilo. El charset y el
  // viewport los pone el envoltorio del Artifact, y repetirlos no suma.
  const enlaces = (head[1].match(/<link\b[^>]*>/gi) || [])
    .filter((l) => /rel=["'](stylesheet|preconnect)["']/i.test(l));

  const cabecera = [`<title>${titulo}</title>`, ...enlaces].join('\n');

  return cabecera + '\n' + body[1].trim() + '\n';
}

async function main() {
  const html = await readFile(ENTRADA, 'utf8');
  const salida = armar(html);
  await mkdir(path.dirname(SALIDA), { recursive: true });
  await writeFile(SALIDA, salida, 'utf8');

  const kb = (Buffer.byteLength(salida) / 1024).toFixed(1);
  console.log(`Escrito: ${path.relative(RAIZ, SALIDA)}  (${kb} kB)`);
  console.log('Los archivos de css/, js/ y fotos/ se publican al lado, sin cambios.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
