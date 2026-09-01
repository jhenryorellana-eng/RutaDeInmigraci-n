# Los videos de cada preparación

Aquí van los tres, y el nombre importa: la pantalla los busca por el
identificador del servicio, tal y como está en `lib/servicios.ts`.

    primera.mp4    Primera audiencia · preliminar
    segunda.mp4    Segunda audiencia · preliminar
    tercera.mp4    Tercera audiencia · mérito

Se sirven desde el propio sitio, así que **cada visita se los descarga**. Con
este público —que abre esto con datos contados— eso obliga a dos cosas:

- **MP4 con H.264 + AAC.** Es lo que reproduce cualquier teléfono, incluido un
  Android viejo. Un `.mov` de iPhone sin convertir no se ve en la mitad de
  ellos.
- **Que pesen poco.** Dos o tres minutos deberían caber en 15–25 MB. A 720p
  basta y sobra: se ven en una columna de 390 píxeles.

Para convertir y bajar de peso, con ffmpeg:

    ffmpeg -i entrada.mov -vf "scale=-2:720" -c:v libx264 -crf 28 \
           -preset slow -c:a aac -b:a 96k -movflags +faststart primera.mp4

`-movflags +faststart` no es opcional: sin él, el video no empieza a verse
hasta que se ha descargado entero.

Mientras no estén, la pantalla lo dice y deja seguir — nadie se queda
atascado en un archivo que no cargó.
