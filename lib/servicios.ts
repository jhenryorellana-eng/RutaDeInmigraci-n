export type Servicio = {
  id: "primera" | "segunda" | "tercera" | "asesoria";
  nombre: string;
  etapa: string;
  precioUsd: number;
  descripcion: string;
};
// La asesoría es un servicio adicional; nunca reutiliza el ID de una audiencia.
export const ASESORIA: Servicio = {
  id: "asesoria",
  nombre: "Asesoría personalizada",
  etapa: "Con Henry Orellana",
  precioUsd: 70,
  descripcion:
    "45 minutos de orientación personal para conversar sobre tus dudas y tu próximo paso.",
};
export const AUDIENCIAS: Servicio[] = [
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
export const SERVICIOS: Servicio[] = [...AUDIENCIAS, ASESORIA];
export const MINUTOS_SESION = 45;
export function servicioPorId(id: string | null | undefined): Servicio | null {
  return SERVICIOS.find((s) => s.id === id) ?? null;
}
export function nombreLargo(s: Servicio): string {
  return s.id === "asesoria"
    ? `${s.nombre} · ${s.etapa}`
    : `Preparación · ${s.nombre} (${s.etapa})`;
}
