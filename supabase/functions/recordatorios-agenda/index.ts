import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { entregarRecordatorio, type Entrega } from "./envio.ts";

const json = (cuerpo: unknown, status = 200) =>
  Response.json(cuerpo, { status });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const secreto = req.headers.get("x-aviso-secreto");
  if (!secreto || secreto.length > 512)
    return json({ error: "No autorizado" }, 401);
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  try {
    const autorizacion = await db.rpc("autorizar_recordatorios", { p_secreto: secreto });
    if (autorizacion.error) return json({ error: "No se pudo validar la solicitud" }, 503);
    if (autorizacion.data !== true) return json({ error: "No autorizado" }, 401);
    const publica = Deno.env.get("VAPID_PUBLICA");
    const privada = Deno.env.get("VAPID_PRIVADA");
    const contacto = Deno.env.get("VAPID_CONTACTO");
    if (!publica || !privada || !contacto)
      return json({ error: "Falta configuración push", publica: !!publica, privada: !!privada, contacto: !!contacto }, 503);
    webpush.setVapidDetails(contacto, publica, privada);
    const cuerpo = await req.json().catch(() => ({}));
    if (cuerpo.comprobar === true)
      return json({ ok: true, configurado: true, modo: "sin_envios" });
    if (Number.isSafeInteger(cuerpo.prueba_id) && cuerpo.prueba_id > 0) {
      const { data: s, error } = await db
        .from("suscripciones_push")
        .select("endpoint,p256dh,auth,ultima_prueba_en")
        .eq("id", cuerpo.prueba_id)
        .single();
      if (
        error ||
        !s ||
        !s.ultima_prueba_en ||
        Date.parse(s.ultima_prueba_en) < Date.now() - 60000
      )
        return json({ error: "Prueba no solicitada" }, 400);
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({
            titulo: "Tu agenda ya puede avisarte",
            cuerpo:
              "Esta es una prueba enviada desde el servidor a este dispositivo.",
            etiqueta: "agenda-prueba",
            url: "/panel",
          }),
          { TTL: 60, urgency: "high", timeout: 10000 },
        );
        return json({ ok: true, prueba: true });
      } catch (error) {
        if (
          [404, 410].includes(
            (error as { statusCode?: number }).statusCode ?? 0,
          )
        )
          await db
            .from("suscripciones_push")
            .delete()
            .eq("id", cuerpo.prueba_id);
        return json({ error: "El proveedor no aceptó la prueba" }, 502);
      }
    }
    const { data, error } = await db.rpc("reclamar_recordatorios");
    if (error) throw new Error("No se pudo reclamar la cola");
    const resumen = {
      enviados: 0,
      expirados: 0,
      reintentos: 0,
      omitidos: 0,
      errores: 0,
    };
    const entregas = (data ?? []) as Entrega[];
    // Lotes pequeños para no saturar los proveedores de push.
    for (let i = 0; i < entregas.length; i += 10) {
      const resultados = await Promise.allSettled(
        entregas.slice(i, i + 10).map((e) =>
          entregarRecordatorio(e, {
            vigente: async (e) => {
              const r = await db.rpc("recordatorio_vigente", {
                p_id: e.id,
                p_token: e.token,
              });
              if (r.error) throw new Error("No se pudo verificar");
              return r.data === true;
            },
            enviar: async (e, contenido, ttl) => {
              await webpush.sendNotification(
                {
                  endpoint: e.endpoint,
                  keys: { p256dh: e.p256dh, auth: e.auth },
                },
                JSON.stringify(contenido),
                { TTL: ttl, urgency: "high", timeout: 10000 },
              );
            },
            finalizar: async (e, resultado) => {
              const r = await db.rpc("finalizar_recordatorio", {
                p_id: e.id,
                p_token: e.token,
                p_resultado: resultado,
              });
              if (r.error) throw new Error("No se pudo registrar el resultado");
            },
          }),
        ),
      );
      for (const r of resultados) {
        if (r.status === "rejected") resumen.errores++;
        else if (r.value === "enviado") resumen.enviados++;
        else if (r.value === "expirado") resumen.expirados++;
        else if (r.value === "reintentar") resumen.reintentos++;
        else resumen.omitidos++;
      }
    }
    return json(resumen, resumen.errores ? 500 : 200);
  } catch {
    return json({ error: "No se pudo procesar la cola de recordatorios" }, 500);
  }
});
