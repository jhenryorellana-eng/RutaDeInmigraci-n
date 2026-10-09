# Imágenes de Henry

Retratos proporcionados por el usuario el 9 de octubre de 2026 (originales de 1792 × 2400). En `public/imagenes/` se guardan reducidos a 1600 px de ancho, en JPG al 80 %; `next/image` sirve a cada pantalla una versión del tamaño que necesita.

| Archivo | Escena | Dónde se usa |
| --- | --- | --- |
| `henry-montanas.jpg` | Oficina con ventanal y montañas, brazos cruzados | Portada, foto principal |
| `henry-oficina.jpg` | Oficina luminosa, brazos cruzados, plano más abierto | `/links`, retrato a sangre |
| `henry-escritorio.jpg` | Sentado en su escritorio | Portada, sección «Soy Henry» |
| `henry-vestibulo.jpg` | Vestíbulo de oficina, brazos cruzados | Original de `henry-asesoria.jpg` |
| `henry-asesoria.jpg` | Versión apaisada (2560 × 1000): `henry-vestibulo.jpg` a la derecha sobre la oficina desenfocada | `/asesoria`, franja ancha |
| `henry-primer-plano.jpg` | Primer plano, fondo oscuro de estudio | Resumen de la reserva, avatar del teléfono y menú; es la foto por defecto de `FotoHenry` |
| `henry-estudio.jpg` | Estudio gris, brazos cruzados | «Conoce a Henry» |
| `henry-video.jpg` | Recorte horizontal (1280 × 720) de `henry-escritorio.jpg` | Portada de los videos de cada audiencia |

Las verticales llevan a Henry centrado, así que el encuadre de cada hueco se ajusta en `app/boletos.css` («Las fotos de Henry») con un solo `object-position` para todos los tamaños de pantalla; sólo la franja de `/asesoria` cambia de encuadre en el teléfono.

La vista previa al compartir (`public/og-audiencia.jpg`) es una imagen aparte, generada con la foto de brazos cruzados de la tanda anterior; si se rehace, conviene usar `henry-montanas.jpg`.
