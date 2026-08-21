/**
 * LOS TRES SITIOS DE HENRY.
 *
 * Todo lo que se pinta en `/links` sale de aquí, para que añadir o quitar un
 * proyecto sea tocar esta lista y nada más.
 *
 * `interno: true` significa que el destino vive en este mismo despliegue, así
 * que se enlaza por ruta (`/`) y no por su dirección de Vercel: funciona en
 * cualquier dominio que le pongáis después, no se sale del sitio para volver
 * a entrar, y si mañana cambia el dominio no queda un enlace muerto en medio
 * de la pared.
 */

export type Enlace = {
  titulo: string;
  etiqueta: string;
  descripcion: string;
  href: string;
  interno?: boolean;
  /** El color que trae esa marca. Sale de `globals.css`, no de un hex suelto. */
  tono: "ambar" | "cian" | "teal";
  icono: "estrella" | "cohete" | "ruta";
};

export const ENLACES: Enlace[] = [
  {
    titulo: "Comunidad ANDEX",
    etiqueta: "Migración",
    descripcion: "Tu camino seguro hacia el sueño americano.",
    href: "https://andex.usalatinoprime.com/",
    tono: "ambar",
    icono: "estrella",
  },
  {
    titulo: "Conoce el Bootcamp",
    etiqueta: "Emprendimiento",
    descripcion: "Emprendimiento, liderazgo y transformación familiar.",
    href: "https://comunidad.starbizacademy.com/bootcamp",
    tono: "cian",
    icono: "cohete",
  },
  {
    titulo: "Tu ruta del inmigrante",
    etiqueta: "Uno a uno con Henry",
    descripcion:
      "45 minutos para saber qué trámite te toca ahora, cuál viene después y cuáles no necesitas.",
    href: "/",
    interno: true,
    tono: "teal",
    icono: "ruta",
  },
];
