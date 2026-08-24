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
  /**
   * En vez de llevar a un sitio, abre la hoja de las tres preparaciones.
   *
   * Es lo que hace que elegir entre tres precios no cueste perder la
   * pared: se ven las tres, se elige una y se sale hacia la reserva ya
   * sabiendo qué se aparta.
   */
  abreServicios?: boolean;
  /**
   * Su temperatura, no su color: sale de `globals.css`, nunca de un hex
   * suelto. Ahora hace más que teñir un filo — es el color con el que la
   * tarjeta se queda encendida, así que es lo que distingue un servicio de
   * otro de un vistazo.
   */
  tono: "agua" | "arena" | "malva" | "acero";
  /**
   * Lo que el guía dice de este servicio cuando lo señala.
   *
   * Una frase, y que empiece por el CASO y no por el nombre: quien lee esto
   * no está eligiendo un producto, está intentando saber cuál de los cuatro
   * es el suyo.
   */
  guia: string;
};

export const ENLACES: Enlace[] = [
  {
    titulo: "Preparación de audiencia",
    etiqueta: "Tres preparaciones · desde $50",
    descripcion:
      "45 minutos uno a uno con Henry para llegar preparado a tu audiencia.",
    href: "/reservar",
    interno: true,
    abreServicios: true,
    tono: "agua",
    guia: "Si ya tienes fecha de audiencia: 45 minutos con Henry para llegar sabiendo qué te van a preguntar.",
  },
  {
    titulo: "Comunidad Andex",
    etiqueta: "Familias",
    descripcion: "Tu camino seguro hacia el sueño americano.",
    href: "https://andex.usalatinoprime.com/",
    tono: "arena",
    guia: "El acompañamiento de todo el año: tus documentos, tus fechas y gente en tu misma situación.",
  },
  {
    titulo: "Servicio Migratorio",
    etiqueta: "Trámites",
    descripcion: "Los trámites migratorios, con el equipo de UsaLatino Prime.",
    href: "https://www.usalatinoprime.com/",
    tono: "malva",
    guia: "Los trámites en sí, con el equipo de Henry. Es a donde vas cuando hay algo que presentar.",
  },
  {
    titulo: "Bootcamp para Jóvenes 2027",
    etiqueta: "Emprendimiento",
    descripcion: "Emprendimiento, liderazgo y transformación familiar.",
    href: "https://comunidad.starbizacademy.com/bootcamp",
    tono: "acero",
    guia: "Para tus hijos: emprender y liderar, para que no repitan el camino largo.",
  },
];
