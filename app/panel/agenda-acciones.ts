"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/servidor";
import {
  errorAgenda,
  validarCambioAgenda,
  type CambioAgenda,
} from "@/lib/agenda";

type Resultado = { ok: true } | { ok: false; motivo: string };

function refrescar() {
  for (const ruta of ["/panel", "/panel/personas", "/reservar", "/"])
    revalidatePath(ruta);
}

export async function guardarAgenda(cambio: CambioAgenda): Promise<Resultado> {
  const validado = validarCambioAgenda(cambio);
  if (validado.error) return { ok: false, motivo: validado.error };
  try {
    const db = await clienteServidor();
    const { data } = await db.auth.getUser();
    if (!data.user) return { ok: false, motivo: "Vuelve a iniciar sesión." };
    const { error } = await db.rpc("guardar_agenda", { p: validado.datos });
    if (error)
      return { ok: false, motivo: errorAgenda(error.code, error.message) };
    refrescar();
    return { ok: true };
  } catch {
    return {
      ok: false,
      motivo:
        "No hay conexión con la agenda. Tus cambios siguen en el formulario.",
    };
  }
}

export async function eliminarEvento(
  id: number,
  version: string,
): Promise<Resultado> {
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isFinite(Date.parse(version))
  )
    return { ok: false, motivo: "Recarga la agenda." };
  try {
    const db = await clienteServidor();
    const { error } = await db.rpc("eliminar_evento_agenda", {
      p_id: id,
      p_version: version,
    });
    if (error)
      return { ok: false, motivo: errorAgenda(error.code, error.message) };
    refrescar();
    return { ok: true };
  } catch {
    return { ok: false, motivo: "No se pudo eliminar. Comprueba tu conexión." };
  }
}
