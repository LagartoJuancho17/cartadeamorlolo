# Fotos

Poné acá las imágenes que quieras que aparezcan en la galería y después corré,
desde la carpeta del proyecto:

    node bin/generar-galeria.mjs

Formatos: .jpg .jpeg .png .webp .gif .avif

El nombre del archivo se usa como pie de foto:

    mar del plata.jpg            ->  "Mar del plata"
    2024-12-24 nochebuena.jpg    ->  "Nochebuena"
    01 - primera cita.jpg        ->  "Primera cita"
    IMG_4821.jpg                 ->  (sin pie)

El orden de la galería es el orden natural de los nombres, así que numerarlas
(01, 02, 03...) es la forma más simple de elegir en qué orden se ven.

Conviene achicarlas antes de subirlas: una foto de 6 MB directo del teléfono
tarda en cargar. Con 1600 px de lado más largo alcanza y sobra.
