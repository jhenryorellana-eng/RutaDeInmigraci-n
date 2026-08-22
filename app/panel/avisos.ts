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
  const supabase = await clienteServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) return { ok: false, motivo: "Vuelve a iniciar sesión." };

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
