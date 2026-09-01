"use server";

import { revalidatePath } from "next/cache";

import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * LO QUE HENRY PUEDE HACER CON UN PAGO QUE EL SISTEMA NO SUPO COLOCAR.
 *
 * Ninguna de las dos comprueba aquí si quien llama es él — lo comprueba la
 * BASE, dentro de las funciones, con `es_admin()`. Repetirlo aquí daría una
 * segunda cerradura que puede quedar desalineada con la primera, y la que no
 * se puede saltar es la de allí.
 */

export type Respuesta = { ok: true } | { ok: false; motivo: string };

function refrescar() {
  revalidatePath("/panel/pagos");
  revalidatePath("/panel");
  revalidatePath("/panel/personas");
}

/** Este pago es de esta persona: crea su cita. */
export async function asignarPago(correoId: number, solicitudId: number): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("zelle_asignar_a_mano", {
    p_correo_id: correoId,
    p_solicitud_id: solicitudId,
  });

  if (error) return { ok: false, motivo: "No se pudo asignar. Vuelve a intentarlo." };

  const r = (data ?? {}) as { ok?: boolean; motivo?: string };
  if (!r.ok) return { ok: false, motivo: r.motivo ?? "No se pudo asignar." };

  refrescar();
  return { ok: true };
}

/** Este pago no es de aquí. Casi siempre: es de x-legal. */
export async function descartarPago(correoId: number, motivo: string): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("zelle_descartar", {
    p_correo_id: correoId,
    p_motivo: motivo,
  });

  if (error) return { ok: false, motivo: "No se pudo descartar." };

  const r = (data ?? {}) as { ok?: boolean; motivo?: string };
  if (!r.ok) return { ok: false, motivo: r.motivo ?? "No se pudo descartar." };

  refrescar();
  return { ok: true };
}
