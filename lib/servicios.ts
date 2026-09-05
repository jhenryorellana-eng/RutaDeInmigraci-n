export type Servicio = {
  id: "primera" | "segunda" | "tercera";
  nombre: string;
  etapa: string;
  precioUsd: number;
  descripcion: string;
};
// El identificador conserva compatibilidad con el esquema actual de Supabase.
export const ASESORIA: Servicio = {
  id: "primera",
  nombre: "Asesoría personalizada",
  etapa: "Con Henry Orellana",
  precioUsd: 70,
  descripcion:
    "45 minutos de orientación personal para conversar sobre tus dudas y tu próximo paso.",
};
export const SERVICIOS: Servicio[] = [ASESORIA];
// Los servicios anteriores solo se consultan para interpretar el histórico.
const HISTORICOS: Servicio[] = [
  {
    id: "segunda",
    nombre: "Segunda audiencia",
    etapa: "Preliminar",
    precioUsd: 150,
    descripcion: "Servicio anterior de preparación de audiencia.",
  },
  {
    id: "tercera",
    nombre: "Tercera audiencia",
    etapa: "Mérito",
    precioUsd: 250,
    descripcion: "Servicio anterior de preparación de audiencia.",
  },
];
export const MINUTOS_SESION = 45;
export function servicioPorId(id: string | null | undefined): Servicio | null {
  return [...SERVICIOS, ...HISTORICOS].find((s) => s.id === id) ?? null;
}
export function nombreLargo(s: Servicio): string {
  return `${s.nombre} · ${s.etapa}`;
}
