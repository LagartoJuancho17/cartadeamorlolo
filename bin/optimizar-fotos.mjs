#!/usr/bin/env node
/**
 * optimizar-fotos.mjs — achica las fotos para que la galería cargue rápido.
 *
 * Una foto directo del teléfono pesa entre 3 y 8 MB. Cincuenta y seis de esas
 * son más de 140 MB: en el teléfono de ella, con datos móviles, la galería
 * tarda minutos y se come su plan. Redimensionadas a 1600 px de lado largo se
 * ven idénticas en pantalla y pesan entre veinte y cuarenta veces menos.
 *
 * Usa `sips`, que viene con macOS: no hay que instalar nada.
 *
 * ANTES DE TOCAR NADA mueve los originales a .originales/. Esa carpeta es la
 * copia de seguridad y está en .gitignore. Si algo sale mal, se recuperan
 * moviéndolos de vuelta; el script nunca borra un original.
 *
 * Uso:
 *    node bin/optimizar-fotos.mjs              redimensiona a 1600 px
 *    node bin/optimizar-fotos.mjs --lado 2000  otro tamaño
 *    node bin/optimizar-fotos.mjs --simular    no toca nada, sólo informa
 */

import { readdir, mkdir, rename, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const correr = promisify(execFile);

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOTOS = path.join(RAIZ, 'fotos');
const ORIGINALES = path.join(RAIZ, '.originales');

const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.heic', '.webp']);

function arg(nombre, porDefecto) {
  const i = process.argv.indexOf(nombre);
  return i === -1 ? porDefecto : process.argv[i + 1];
}

const LADO = Number(arg('--lado', 1600));
const CALIDAD = Number(arg('--calidad', 80));
const SIMULAR = process.argv.includes('--simular');

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + ' MB';

async function pesoDe(archivos, dir) {
  let total = 0;
  for (const f of archivos) total += (await stat(path.join(dir, f))).size;
  return total;
}

async function main() {
  if (process.platform !== 'darwin') {
    console.error('Este script usa `sips`, que sólo viene con macOS.');
    process.exit(1);
  }

  let archivos;
  try {
    archivos = (await readdir(FOTOS))
      .filter((f) => !f.startsWith('.'))
      .filter((f) => EXTENSIONES.has(path.extname(f).toLowerCase()))
      .sort();
  } catch {
    console.error(`No encontré la carpeta fotos/`);
    process.exit(1);
  }

  if (!archivos.length) {
    console.log('No hay fotos para optimizar.');
    return;
  }

  const antes = await pesoDe(archivos, FOTOS);
  console.log(`${archivos.length} fotos, ${mb(antes)} en total.`);
  console.log(`Objetivo: ${LADO} px de lado largo, calidad ${CALIDAD}.\n`);

  if (SIMULAR) {
    console.log('Modo simulación: no se tocó nada.');
    console.log(`Los originales irían a ${path.relative(RAIZ, ORIGINALES)}/`);
    return;
  }

  // El respaldo va primero: recién con los originales a salvo se toca algo.
  await mkdir(ORIGINALES, { recursive: true });

  let hechas = 0;
  let fallidas = [];

  for (const nombre of archivos) {
    const original = path.join(ORIGINALES, nombre);
    const destino = path.join(FOTOS, nombre);

    try {
      await rename(destino, original);
      await correr('sips', [
        '-Z', String(LADO),
        '--setProperty', 'format', 'jpeg',
        '--setProperty', 'formatOptions', String(CALIDAD),
        original,
        '--out', destino
      ]);
      hechas++;
    } catch (e) {
      fallidas.push(nombre);
      // Si falló la conversión, el original vuelve a su lugar: nunca se pierde.
      try { await rename(original, destino); } catch { /* ya estaba */ }
    }

    const pct = Math.round(((hechas + fallidas.length) / archivos.length) * 100);
    process.stdout.write(`\r  ${pct}%  (${hechas + fallidas.length}/${archivos.length})   `);
  }

  const despues = await pesoDe(
    (await readdir(FOTOS)).filter((f) => EXTENSIONES.has(path.extname(f).toLowerCase())),
    FOTOS
  );

  console.log('\n');
  console.log(`Antes:   ${mb(antes)}`);
  console.log(`Después: ${mb(despues)}   (${(antes / despues).toFixed(1)} veces más liviano)`);
  if (fallidas.length) {
    console.log(`\nNo pude con ${fallidas.length}: ${fallidas.join(', ')}`);
    console.log('Esas quedaron como estaban.');
  }
  console.log(`\nLos originales están intactos en ${path.relative(RAIZ, ORIGINALES)}/`);
  console.log('Si algo quedó mal, los recuperás moviéndolos de vuelta a fotos/.');
  console.log('\nAhora corré:  node bin/generar-galeria.mjs');
}

main();
