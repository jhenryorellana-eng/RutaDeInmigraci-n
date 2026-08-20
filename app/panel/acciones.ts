"use server";

import { revalidatePath } from "next/cache";

import { instanteEnZona } from "@/lib/horario";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Lo que Henry puede hacer con su horario.
 *
 * Ninguna de estas acciones comprueba si quien llama es Henry — y no es un
 * olvido. Lo comprueba la BASE: las políticas de `cierres` sólo dejan pasar
 * a quien está en `administradores`. Repetir la comprobación aquí daría una
 * segunda cerradura que puede quedar desalineada con la primera; que falle
 * la base es lo correcto, porque es la que no se puede saltar.
 */

export type Respuesta = { ok: true } | { ok: false; motivo: string };

/**
 * Cierra un día entero o un tramo de horas, en hora de Utah.
 *
 * `dia` llega como «2026-08-22». Se convierte a instantes con la zona de
 * Utah y no con la del servidor: Vercel corre en UTC, y cerrar «el sábado»
 * calculado en UTC dejaría abiertas las últimas horas del viernes.
 */
export async function cerrar(
  dia: string,
  desdeHora: number | null,
  hastaHora: number | null,
  nota: string,
): Promise<Respuesta> {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  if (!m) return { ok: false, motivo: "Elige un día." };

  const [, a, me, d] = m;
  const anio = Number(a);
  const mes = Number(me);
  const num = Number(d);

  const desde = desdeHora ?? 0;
  const hasta = hastaHora ?? 24;
  if (hasta <= desde) return { ok: false, motivo: "La hora de fin va después de la de inicio." };

  const inicia = instanteEnZona(anio, mes, num, desde);
  const termina =
    hasta === 24
      ? new Date(instanteEnZona(anio, mes, num, 0).getTime() + 24 * 60 * 60 * 1000)
      : instanteEnZona(anio, mes, num, hasta);

  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").insert({
    inicia_en: inicia.toISOString(),
    termina_en: termina.toISOString(),
    nota: nota.trim() || null,
  });

  if (error) return { ok: false, motivo: "No se pudo cerrar. Vuelve a intentarlo." };
  revalidatePath("/panel");
  revalidatePath("/reservar");
  return { ok: true };
}

/** Vuelve a abrir un tramo cerrado. */
export async function reabrir(id: number): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").delete().eq("id", id);
  if (error) return { ok: false, motivo: "No se pudo reabrir." };
  revalidatePath("/panel");
  revalidatePath("/reservar");
  return { ok: true };
}
