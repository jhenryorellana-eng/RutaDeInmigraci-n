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
  /** Su temperatura, no su color: sale de `globals.css`, nunca de un hex suelto. */
  tono: "arena" | "malva" | "acero" | "teal";
  icono: "estrella" | "sello" | "cohete" | "ruta";
};

export const ENLACES: Enlace[] = [
  {
    titulo: "Asesoría personalizada",
    etiqueta: "La ruta del inmigrante",
    descripcion:
      "45 minutos para saber qué trámite te toca ahora, cuál viene después y cuáles no necesitas.",
    href: "/",
    interno: true,
    tono: "teal",
    icono: "ruta",
  },
  {
    titulo: "Comunidad Andex",
    etiqueta: "Familias",
    descripcion: "Tu camino seguro hacia el sueño americano.",
    href: "https://andex.usalatinoprime.com/",
    tono: "arena",
    icono: "estrella",
  },
  {
    titulo: "Servicio Migratorio",
    etiqueta: "Trámites",
    descripcion: "Los trámites migratorios, con el equipo de UsaLatino Prime.",
    href: "https://www.usalatinoprime.com/",
    tono: "malva",
    icono: "sello",
  },
  {
    titulo: "Bootcamp para Jóvenes",
    etiqueta: "Emprendimiento",
    descripcion: "Emprendimiento, liderazgo y transformación familiar.",
    href: "https://comunidad.starbizacademy.com/bootcamp",
    tono: "acero",
    icono: "cohete",
  },
];
