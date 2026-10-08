import { PRECIO_DESDE } from "@/lib/servicios";

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
   * En vez de llevar a un sitio, abre la hoja de las preparaciones.
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
  tono: "agua" | "arena" | "coral" | "verde";
  /**
   * Los dos que presta Henry directamente van con más cuerpo.
   *
   * Se descartó pintarlos de otro color: el oro ya es la voz del guía en
   * esta pantalla y cada servicio tiene su propio tono, así que un tercer
   * significado para el mismo color no lo habría destacado, lo habría
   * enturbiado. Un punto de tamaño y otro de grosor se leen como importancia
   * sin competir con nada.
   */
  destacado?: boolean;
  /**
   * Lo que el guía dice de este servicio cuando lo señala.
   *
   * Una frase, y que empiece por el CASO y no por el nombre: quien lee esto
   * no está eligiendo un producto, está intentando saber cuál es el suyo.
   */
  guia: string;
};

export const ENLACES: Enlace[] = [
  {
    titulo: "Preparación de audiencia",
    etiqueta: `Dos preparaciones · desde $${PRECIO_DESDE}`,
    /* Corta a propósito: en una tarjeta del teléfono, una frase que acaba
       en «…» parece rota. El precio va aquí porque es lo primero que se
       pregunta. */
    descripcion: `Desde $${PRECIO_DESDE} · 45 min con Henry`,
    href: "/reservar",
    interno: true,
    abreServicios: true,
    tono: "agua",
    destacado: true,
    guia: "Si ya tienes fecha de audiencia: elige la preparación para tu segunda o tercera audiencia.",
  },
  /* La página de Henry, para quien quiere conocerlo antes de elegir. Va en
     el tono arena porque es el oro de esa página, y así se reconoce al
     llegar. */
  {
    titulo: "La ruta del inmigrante",
    etiqueta: "Conoce a Henry",
    descripcion: "Conoce a Henry y cómo trabaja",
    href: "/",
    interno: true,
    tono: "arena",
    destacado: true,
    guia: "Si quieres conocer a Henry y ver cómo es la sesión antes de reservar, empieza por aquí.",
  },
  {
    titulo: "Servicio Migratorio",
    etiqueta: "Trámites",
    descripcion: "Trámites con Contygo",
    href: "https://landing.contygo.app",
    tono: "coral",
    destacado: true,
    guia: "Los trámites en sí, con el equipo de Henry. Es a donde vas cuando hay algo que presentar.",
  },
];
