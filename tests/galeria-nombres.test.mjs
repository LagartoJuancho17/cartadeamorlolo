import test from 'node:test';
import assert from 'node:assert/strict';
import { pieDesdeNombre } from '../bin/generar-galeria.mjs';

test('usa el nombre del archivo como pie de foto', () => {
  assert.equal(pieDesdeNombre('playa.jpg'), 'Playa');
  assert.equal(pieDesdeNombre('primer viaje juntos.png'), 'Primer viaje juntos');
});

test('convierte guiones y guiones bajos en espacios', () => {
  assert.equal(pieDesdeNombre('mar-del-plata.jpg'), 'Mar del plata');
  assert.equal(pieDesdeNombre('noche_de_año_nuevo.webp'), 'Noche de año nuevo');
});

test('saca la fecha del principio', () => {
  assert.equal(pieDesdeNombre('2024-12-24 nochebuena en casa.jpg'), 'Nochebuena en casa');
  assert.equal(pieDesdeNombre('2025-01-01-primer-dia.jpg'), 'Primer dia');
});

test('saca la numeración de orden', () => {
  assert.equal(pieDesdeNombre('01 - cumpleaños.jpg'), 'Cumpleaños');
  assert.equal(pieDesdeNombre('3_picada.jpg'), 'Picada');
});

test('no inventa un pie con nombres de cámara', () => {
  assert.equal(pieDesdeNombre('IMG_4821.jpg'), null);
  assert.equal(pieDesdeNombre('DSC00123.JPG'), null);
  assert.equal(pieDesdeNombre('PXL_20240918.jpg'), null);
  assert.equal(pieDesdeNombre('Screenshot 2024.png'), null);
  assert.equal(pieDesdeNombre('WhatsApp-Image-2024.jpeg'), null);
  assert.equal(pieDesdeNombre('WhatsApp Image 2024-09-18 at 21.30.15.jpeg'), null);
  assert.equal(pieDesdeNombre('IMG_4821 copia.jpg'), null);
});

test('un nombre real sobrevive aunque tenga números', () => {
  assert.equal(pieDesdeNombre('bariloche 2024.jpg'), 'Bariloche 2024');
  assert.equal(pieDesdeNombre('IMG_4821 en la terraza.jpg'), 'IMG 4821 en la terraza');
});

test('un nombre que queda vacío no genera pie', () => {
  assert.equal(pieDesdeNombre('2024-12-24.jpg'), null);
  assert.equal(pieDesdeNombre('___.png'), null);
});

test('respeta los acentos y no rompe el resto del nombre', () => {
  assert.equal(pieDesdeNombre('después del cine.jpg'), 'Después del cine');
});
