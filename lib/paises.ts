/**
 * Los países de origen más frecuentes en el piloto de Utah, y el resto.
 *
 * Código ISO-3166-1 alfa-2, no el nombre: así el panel agrupa sin que
 * «México», «Mexico» y «MX» cuenten como tres cosas distintas.
 *
 * Los ocho primeros están arriba a propósito — son de dónde viene la mayoría
 * de esta comunidad — y después va el resto por orden alfabético. Una lista
 * de 249 países en un desplegable de teléfono es una lista que nadie recorre.
 */
export type Pais = { codigo: string; nombre: string };

export const PAISES: readonly Pais[] = [
  { codigo: "MX", nombre: "México" },
  { codigo: "VE", nombre: "Venezuela" },
  { codigo: "CO", nombre: "Colombia" },
  { codigo: "PE", nombre: "Perú" },
  { codigo: "HN", nombre: "Honduras" },
  { codigo: "GT", nombre: "Guatemala" },
  { codigo: "SV", nombre: "El Salvador" },
  { codigo: "EC", nombre: "Ecuador" },
  { codigo: "AR", nombre: "Argentina" },
  { codigo: "BO", nombre: "Bolivia" },
  { codigo: "BR", nombre: "Brasil" },
  { codigo: "CL", nombre: "Chile" },
  { codigo: "CR", nombre: "Costa Rica" },
  { codigo: "CU", nombre: "Cuba" },
  { codigo: "DO", nombre: "República Dominicana" },
  { codigo: "ES", nombre: "España" },
  { codigo: "HT", nombre: "Haití" },
  { codigo: "NI", nombre: "Nicaragua" },
  { codigo: "PA", nombre: "Panamá" },
  { codigo: "PY", nombre: "Paraguay" },
  { codigo: "PR", nombre: "Puerto Rico" },
  { codigo: "UY", nombre: "Uruguay" },
  { codigo: "ZZ", nombre: "Otro país" },
] as const;

const POR_CODIGO = new Map(PAISES.map((p) => [p.codigo, p.nombre]));

/** «MX» → «México». Devuelve el código si no lo conoce: nunca «undefined». */
export function nombrePais(codigo: string): string {
  return POR_CODIGO.get(codigo.toUpperCase()) ?? codigo.toUpperCase();
}
