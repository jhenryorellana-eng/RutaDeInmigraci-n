import { PRECIO_DESDE } from "@/lib/servicios";

/**
 * LOS SITIOS DE HENRY.
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
  /* La preparación de audiencia es el servicio de Henry y la puerta a todo
     lo suyo: lleva a su web, y el recorrido entero ocurre allí — los precios
     de las dos preparaciones, las horas libres y la reserva. Sin ventanas
     por medio: quien toca entra y ya no sale hasta reservar. */
  {
    titulo: "Preparación de audiencia",
    etiqueta: `Prepara tu audiencia · desde $${PRECIO_DESDE}`,
    /* Corta a propósito: en una tarjeta del teléfono, una frase que acaba
       en «…» parece rota. El precio va aquí porque es lo primero que se
       pregunta. */
    descripcion: `Desde $${PRECIO_DESDE} · 45 min con Henry`,
    href: "/",
    interno: true,
    tono: "agua",
    destacado: true,
    guia: "Si tienes fecha de audiencia: aquí preparas tu audiencia con Henry — precios, horas libres y reserva.",
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
