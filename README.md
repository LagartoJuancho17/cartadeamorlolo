# Carta de amor

Una tarjeta digital interactiva. Se abre con un arco y una flecha, sigue con un
gato que hace una pregunta y termina en la carta, el contador de días y la
galería de fotos.

Abrí `index.html` en cualquier navegador. No necesita servidor, ni instalar
nada, ni conexión (salvo para las tipografías, que si no cargan tienen
alternativa).

---

## Lo que tenés que completar

Todo lo personal está en **un solo archivo**: [`contenido.js`](contenido.js).

### 1. La fecha

```js
fechaInicio: '2024-09-18',        // AAAA-MM-DD
```

Si te acordás la hora, escribí `'2024-09-18T21:30'` y el contador va a ser
exacto hasta el segundo.

### 2. La carta

Reemplazá el borrador de `carta.parrafos` por lo que escribiste vos. Cada
string de la lista es un párrafo. El borrador que viene está para que la pieza
se vea terminada desde el primer día; no lo dejes.

### 3. Las fotos

Poné las imágenes en la carpeta `fotos/` y corré:

```bash
node bin/generar-galeria.mjs
```

Si vienen directo del teléfono van a pesar varios MB cada una y la galería va a
tardar una eternidad con datos móviles. Achicalas primero (mueve los originales
a `.originales/`, no borra nada):

```bash
node bin/optimizar-fotos.mjs
```

Eso escribe `js/fotos-generado.js` con la lista ordenada. El nombre del archivo
se convierte en el pie de foto:

| Archivo | Pie |
|---|---|
| `mar del plata.jpg` | Mar del plata |
| `2024-12-24 nochebuena.jpg` | Nochebuena |
| `01 - primera cita.jpg` | Primera cita |
| `IMG_4821.jpg` | *(sin pie)* |

Formatos: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`.

### 4. El sonido

Ya viene con efectos y **no hay ningún archivo de audio**: todo se sintetiza con
Web Audio en el momento, así que no pesa nada y funciona sin conexión.

| Momento | Suena |
|---|---|
| Tensar el arco | zumbido grave que sube de tono, más un trinquete cada tanto |
| Soltar | latigazo de la cuerda |
| La flecha | silbido al cruzar la pantalla |
| Al dar en el sobre | golpe grave, y después tres notas que suben al abrirse |
| Apretar SÍ | fanfarria do-mi-sol-do |
| Tocar el corazón del gato | dos latidos y una campanita |
| Abrir y pasar fotos | un clic y un tic |

El botón de arriba a la derecha lo prende y apaga todo. Lo que ella elija queda
guardado en su navegador. Para que arranque en silencio, poné `sonido: false`
en `contenido.js`.

El botón NO es mudo a propósito: salta con tres eventos distintos por cada
intento de clic y los sonidos se amontonaban.

### 5. La canción (opcional)

Poné un `.mp3` en `audio/` y en `contenido.js`:

```js
cancion: 'audio/nuestra-cancion.mp3',
```

Los navegadores no dejan que arranque sola, así que empieza cuando ella dispara
la flecha. La controla el mismo botón de sonido.

---

## Cómo se usa

| | Mouse | Teléfono | Teclado |
|---|---|---|---|
| Tensar el arco | rueda hacia abajo | arrastrar hacia abajo | ↓ o espacio |
| Disparar | soltar, o tensar al tope | soltar el dedo | soltar la tecla |
| El botón NO | se escapa | se escapa | se escapa |
| Prender/apagar sonido | botón arriba a la derecha | ídem | Tab + Enter |
| Galería | click | tocar / deslizar | Tab, Enter, ← → , Esc |

Hay un enlace discreto **"saltear ♥"** abajo a la derecha que aparece a los 14
segundos. Es el seguro por si el arco no le funciona en su teléfono: la carta
igual se abre.

Si tiene activado "reducir movimiento" en su teléfono, las animaciones y las
partículas se apagan solas y todo sigue funcionando.

---

## Cómo está armado

```
contenido.js              lo único que editás vos
index.html                el esqueleto
css/estilos.css           todo el diseño
js/
  core/                   lógica pura, sin navegador, testeada
    duracion.js             cuánto tiempo llevan juntos
    arco.js                 tensión, disparo y geometría del arco
    esquivar.js             adónde salta el botón NO, y cada cuánto
    recetas-sonido.js       qué suena cada cosa, como datos
    lienzo.js               primitivas de pixel art
  sprites.js              el gato, el sobre, la flecha, los corazones
  corazones.js            las partículas
  sonido.js               agenda las recetas en Web Audio
  galeria.js              grilla y visor de fotos
  app.js                  el pegamento: eventos y DOM
bin/generar-galeria.mjs   arma la lista de fotos
bin/optimizar-fotos.mjs   achica las fotos antes de publicarlas
bin/armar-artifact.mjs    deriva la versión publicable de index.html
tests/                    140 tests, corren en menos de un segundo
```

La regla de la separación: **todo lo que se puede decidir con números vive en
`js/core/` y tiene tests**. `app.js` no calcula nada, sólo escucha eventos y
aplica lo que `core` le devuelve. Por eso se puede verificar que el arco
dispara cuando tiene que disparar, o que el botón NO nunca queda debajo del
dedo, sin abrir un navegador.

### Tests

```bash
node --test
```

Son deterministas, no usan red y tardan menos de un segundo. Corren solos antes
de cada commit (ver `.githooks/pre-commit`).

Cubren, entre otras cosas:

- aritmética de fechas con préstamos, años bisiestos y cambio de horario
- que el botón NO nunca quede fuera de la ventana ni encima del SÍ
- que un solo intento de clic lo haga saltar una vez y no tres
- que se pueda tensar el arco a golpecitos sin que la cuerda se coma lo ganado
- que la rueda del mouse funcione igual en Chrome y en Firefox (`deltaMode`)
- la forma exacta, píxel por píxel, de cada sprite
- que ningún sonido arranque ni termine fuera del silencio (si no, se oye un
  clic seco), que ninguno sature al sumar sus voces y que ninguno quede tan
  bajo que no se escuche en el parlante de un teléfono

---

## Publicarla

Es HTML estático. Sirve cualquier cosa:

- Mandarle la carpeta comprimida y que abra `index.html`.
- Subirla a Netlify, Vercel o GitHub Pages arrastrando la carpeta.
- Levantar un servidor local:

```bash
python3 -m http.server 4173
```

Un detalle antes de mandarla: si le pasás el link por WhatsApp, abrilo vos
primero desde tu teléfono para ver que las fotos carguen y que el sonido suene.

### Si editás algo y no ves el cambio

Es la caché del navegador, que se queda con la versión vieja de los `.js`.
Recargá con **Cmd + Shift + R**. `npm run dev` ya sirve sin caché.
