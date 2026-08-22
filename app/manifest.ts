import type { MetadataRoute } from "next";

/**
 * LO QUE CONVIERTE ESTO EN UNA APP DEL TELÉFONO.
 *
 * Con este archivo, el sitio se puede instalar en la pantalla de inicio y
 * abrirse sin la barra del navegador. Para Henry es lo que separa «entrar a
 * una web» de «abrir su agenda».
 *
 * Y es el requisito previo de las notificaciones: en iOS, una web sólo puede
 * mandar avisos si está instalada en la pantalla de inicio. Sin esto, no hay
 * notificación que valga en un iPhone.
 *
 * ── Por qué arranca en `/panel` ──
 *
 * Porque quien instala esto es Henry, no quien reserva. Quien reserva llega
 * por un enlace, aparta su hora y no vuelve; no tiene nada que instalar. La
 * app instalada es la herramienta de trabajo de una persona.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agenda · La ruta del inmigrante",
    short_name: "Mi agenda",
    description:
      "Las citas de Henry: quién viene, a qué hora y cuándo está abierto.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#16223A",
    theme_color: "#16223A",
    lang: "es",
    categories: ["productivity", "business"],
    icons: [
      {
        src: "/icono-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        /* Android recorta este a un círculo y puede comerse hasta el 20% de
           cada borde, así que lleva más aire alrededor de la cara. */
        src: "/icono-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
