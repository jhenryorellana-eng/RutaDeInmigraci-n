"use server";

import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * GUARDAR Y QUITAR EL AVISO DE ESTE TELÉFONO.
 *
 * Ninguna de las dos comprueba quién llama, y no es un olvido: lo comprueba
 * la BASE. Las políticas de `suscripciones_push` sólo dejan a cada quien ver
 * y tocar las suyas, comparando contra `auth.uid()`. Repetir la comprobación
 * aquí daría una segunda cerradura que puede quedar desalineada con la
 * primera.
 */

export type Respuesta = { ok: true } | { ok: false; motivo: string };

export type Suscripcion = {
  endpoint: string;
  p256dh: string;
  auth: string;
  descripcion?: string;
};

/**
 * Apunta este teléfono para recibir avisos.
 *
 * `upsert` por `endpoint`: si el mismo teléfono se vuelve a suscribir —pasa
 * cada vez que el navegador renueva su suscripción, y lo hace solo— se
 * actualiza la fila en vez de crear otra. Sin esto, cada aviso acabaría
 * llegando dos y tres veces al mismo sitio.
 */
export async function guardarAviso(s: Suscripcion): Promise<Respuesta> {
  if (
    !s ||
    !s.endpoint?.startsWith("https://") ||
    s.endpoint.length > 2048 ||
    !/^[\w-]{80,200}$/.test(s.p256dh) ||
    !/^[\w-]{16,100}$/.test(s.auth)
  ) {
    return {
      ok: false,
      motivo: "La suscripción de este dispositivo no es válida.",
    };
  }
  const supabase = await clienteServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) return { ok: false, motivo: "Vuelve a iniciar sesión." };
  const admin = await supabase.rpc("es_admin");
  if (!admin.data || admin.error)
    return {
      ok: false,
      motivo: "Sólo el administrador puede activar estos avisos.",
    };

  const { error } = await supabase.from("suscripciones_push").upsert(
    {
      user_id: sesion.user.id,
      endpoint: s.endpoint,
      p256dh: s.p256dh,
      auth: s.auth,
      descripcion: s.descripcion?.slice(0, 80) ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { ok: false, motivo: "No se pudo activar el aviso." };
  return { ok: true };
}

/** Deja de avisar a este teléfono. */
export async function quitarAviso(endpoint: string): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { error } = await supabase
    .from("suscripciones_push")
    .delete()
    .eq("endpoint", endpoint);

  if (error) return { ok: false, motivo: "No se pudo desactivar." };
  return { ok: true };
}

export async function consultarAviso(endpoint: string) {
  const db = await clienteServidor();
  const { data, error } = await db
    .from("suscripciones_push")
    .select("*")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error)
    return {
      ok: false as const,
      motivo: "No se pudo comprobar la suscripción. Inténtalo de nuevo.",
    };
  return {
    ok: true as const,
    registrado: !!data,
    minutos: (data?.recordatorio_minutos === undefined
      ? 5
      : data.recordatorio_minutos) as 0 | 5 | null,
  };
}

export async function cambiarRecordatorio(
  endpoint: string,
  minutos: 0 | 5 | null,
): Promise<Respuesta> {
  if (![0, 5, null].includes(minutos))
    return { ok: false, motivo: "Elige cuándo quieres recibir el aviso." };
  const db = await clienteServidor();
  const { data, error } = await db
    .from("suscripciones_push")
    .update({ recordatorio_minutos: minutos })
    .eq("endpoint", endpoint)
    .select("id");
  if (error || !data?.length)
    return {
      ok: false,
      motivo:
        "No se pudo guardar. Activa los avisos de este dispositivo otra vez.",
    };
  return { ok: true };
}

export async function probarAviso(endpoint: string): Promise<Respuesta> {
  const db = await clienteServidor();
  const { error } = await db.rpc("probar_recordatorio", {
    p_endpoint: endpoint,
  });
  if (error)
    return {
      ok: false,
      motivo:
        error.code === "23514"
          ? "Espera un minuto antes de enviar otra prueba."
          : "No se pudo enviar la prueba. Vuelve a activar las notificaciones.",
    };
  return { ok: true };
}
