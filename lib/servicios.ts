export type Servicio = {
  id: "primera" | "segunda" | "tercera" | "asesoria";
  nombre: string;
  etapa: string;
  precioUsd: number;
  descripcion: string;
  /** Lo que se trabaja en la sesión. Sale en las tarjetas de cada preparación. */
  incluye: string[];
};
export const AUDIENCIAS: Servicio[] = [
  {
    id: "segunda",
    nombre: "Segunda audiencia",
    etapa: "Preliminar",
    precioUsd: 150,
    descripcion: "Preparación para tu segunda audiencia preliminar.",
    incluye: [
      "Repasar qué pasa ese día y en qué orden",
      "Ordenar tus preguntas antes de entrar",
      "Practicar cómo responder con calma",
    ],
  },
  {
    id: "tercera",
    nombre: "Tercera audiencia",
    etapa: "Mérito",
    precioUsd: 350,
    descripcion: "Preparación para tu audiencia de mérito.",
    incluye: [
      "Recorrer tu historia de principio a fin",
      "Practicar las preguntas más difíciles",
      "Llegar con un plan claro para ese día",
    ],
  },
];
/** Lo que se ofrece y se cobra hoy: sólo las dos preparaciones. */
export const SERVICIOS: Servicio[] = AUDIENCIAS;
/** El precio más bajo, para decir «desde» sin escribir la cifra a mano. */
export const PRECIO_DESDE = Math.min(...AUDIENCIAS.map((s) => s.precioUsd));
// Ya no se ofrecen ni se cobran, pero las citas antiguas los siguen nombrando
// en el panel. Por eso viven aparte y `servicioPorId` no los encuentra.
const RETIRADOS: Pick<Servicio, "id" | "nombre">[] = [
  { id: "primera", nombre: "Primera audiencia" },
  { id: "asesoria", nombre: "Asesoría personalizada" },
];
export const MINUTOS_SESION = 45;
export function servicioPorId(id: string | null | undefined): Servicio | null {
  return SERVICIOS.find((s) => s.id === id) ?? null;
}
/** El nombre para el panel, incluidos los servicios que ya no se ofrecen. */
export function nombreDeServicio(id: string | null | undefined): string | null {
  return [...SERVICIOS, ...RETIRADOS].find((s) => s.id === id)?.nombre ?? null;
}
export function nombreLargo(s: Servicio): string {
  return `Preparación · ${s.nombre} (${s.etapa})`;
}
