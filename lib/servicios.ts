/**
 * LOS TRES SERVICIOS.
 *
 * Tres preparaciones distintas, con precios distintos, sobre UNA sola
 * agenda: da igual cuál se aparte, la hora queda ocupada para los tres. Eso
 * no lo decide este archivo — lo garantiza el índice único de la base, que
 * es lo único que aguanta a dos personas pulsando a la vez.
 *
 * ── Por qué los precios viven aquí y no en `pago.ts` ──
 *
 * Porque ya no hay UN precio: hay uno por servicio. `pago.ts` sigue
 * guardando a dónde se manda el dinero, que es lo mismo para los tres.
 *
 * ── La duración ──
 *
 * 45 minutos los tres, que es lo que estaba montado. Si alguna preparación
 * lleva más tiempo, hay que cambiarlo AQUÍ y en el horario: los huecos se
 * ofrecen en punto y una sesión más larga se comería el hueco siguiente.
 */

export type Servicio = {
  /** Lo que viaja por la URL y se guarda en la base. */
  id: "primera" | "segunda" | "tercera";
  nombre: string;
  /** «Preliminar» o «Mérito»: el tipo de audiencia para la que prepara. */
  etapa: string;
  precioUsd: number;
  descripcion: string;
};

export const SERVICIOS: Servicio[] = [
  {
    id: "primera",
    nombre: "Primera audiencia",
    etapa: "Preliminar",
    precioUsd: 70,
    descripcion: "Preparación para tu primera audiencia preliminar.",
  },
  {
    id: "segunda",
    nombre: "Segunda audiencia",
    etapa: "Preliminar",
    precioUsd: 150,
    descripcion: "Preparación para tu segunda audiencia preliminar.",
  },
  {
    id: "tercera",
    nombre: "Tercera audiencia",
    etapa: "Mérito",
    precioUsd: 250,
    descripcion: "Preparación para tu audiencia de mérito.",
  },
];

/** Cuánto dura cada sesión. Igual para los tres. */
export const MINUTOS_SESION = 45;

/**
 * El servicio que pide una URL, o `null`.
 *
 * Devuelve `null` —y no el primero de la lista— cuando el identificador no
 * existe: mandar a alguien a pagar $250 porque escribió mal la dirección es
 * peor que preguntarle cuál quería.
 */
export function servicioPorId(id: string | null | undefined): Servicio | null {
  if (!id) return null;
  return SERVICIOS.find((s) => s.id === id) ?? null;
}

/** «Preparación · Segunda audiencia (Preliminar)», para el panel y los avisos. */
export function nombreLargo(s: Servicio): string {
  return `Preparación · ${s.nombre} (${s.etapa})`;
}
