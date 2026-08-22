// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * AVISA A HENRY DE QUE ALGUIEN APARTÓ UNA HORA.
 *
 * La dispara un webhook de la base al INSERTAR en `citas`.
 *
 * ── Por qué esto vive aquí y no en el sitio ──
 *
 * Para avisar hay que leer las suscripciones sin sesión: quien aparta la
 * cita no ha iniciado sesión, así que no hay ningún `auth.uid()` con el que
 * pasar el RLS de `suscripciones_push`.
 *
 * La salida fácil sería meter la `service_role` en el sitio, y en este
 * proyecto no se usa: se salta el RLS entero y es lo único que impide leer
 * los datos de todas las personas que han apartado cita. Aquí dentro, esa
 * llave la inyecta Supabase en el entorno de la función — no pasa por el
 * repo, ni por Vercel, ni por el navegador de nadie.
 *
 * ── Lo que el aviso NO dice ──
 *
 * Ni el correo ni el teléfono. Una notificación se lee en la pantalla de
 * bloqueo, a la vista de cualquiera que tenga el teléfono delante, y el
 * teléfono de una persona migrante no tiene por qué aparecer ahí. El nombre
 * y la hora bastan para decidir si merece abrir la agenda; el resto está a
 * un toque de distancia.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-aviso-secreto",
};

Deno.serve(async (peticion) => {
  if (peticion.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  /* El webhook manda este secreto en una cabecera. Sin él, cualquiera que
     descubra la dirección de la función podría hacer sonar el teléfono de
     Henry a las tres de la mañana, tantas veces como quisiera. */
  const esperado = Deno.env.get("AVISO_SECRETO");
  if (!esperado || peticion.headers.get("x-aviso-secreto") !== esperado) {
    return new Response("no", { status: 401, headers: CORS });
  }

  const publica = Deno.env.get("VAPID_PUBLICA");
  const privada = Deno.env.get("VAPID_PRIVADA");
  const contacto = Deno.env.get("VAPID_CONTACTO") ?? "mailto:henry@ejemplo.com";
  if (!publica || !privada) {
    return new Response("faltan las llaves VAPID", { status: 500, headers: CORS });
  }
  webpush.setVapidDetails(contacto, publica, privada);

  let cita: any = {};
  try {
    const cuerpo = await peticion.json();
    cita = cuerpo?.record ?? cuerpo ?? {};
  } catch {
    return new Response("cuerpo ilegible", { status: 400, headers: CORS });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: suscripciones, error } = await supabase
    .from("suscripciones_push")
    .select("id, endpoint, p256dh, auth");

  if (error) {
    return new Response("no se pudieron leer las suscripciones", { status: 500, headers: CORS });
  }
  if (!suscripciones?.length) {
    return new Response("nadie a quien avisar", { status: 200, headers: CORS });
  }

  /* La hora, en la de Utah, que es la que Henry tiene en la cabeza. */
  const cuando = new Date(cita.inicia_en);
  const hora = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Denver",
    weekday: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(cuando);

  const mensaje = JSON.stringify({
    titulo: "Nueva cita apartada",
    cuerpo: `${cita.nombre ?? "Alguien"} · ${hora} (hora de Utah)`,
    url: "/panel",
    etiqueta: `cita-${cita.id ?? ""}`,
  });

  /* Todas a la vez, y ninguna puede tumbar a las demás. */
  const idas = await Promise.allSettled(
    suscripciones.map((s: any) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        mensaje,
      ),
    ),
  );

  /* Una suscripción caducada devuelve 404 o 410 y va a seguir fallando para
     siempre: se borra. Si no, cada cita nueva intentaría avisar a un
     teléfono que ya no existe hasta el fin de los tiempos. */
  const muertas: number[] = [];
  idas.forEach((ida, i) => {
    if (ida.status === "rejected") {
      const codigo = (ida.reason as any)?.statusCode;
      if (codigo === 404 || codigo === 410) muertas.push(suscripciones[i].id);
    }
  });
  if (muertas.length) {
    await supabase.from("suscripciones_push").delete().in("id", muertas);
  }

  const enviados = idas.filter((i) => i.status === "fulfilled").length;
  return new Response(
    JSON.stringify({ enviados, caducadas: muertas.length }),
    { headers: { ...CORS, "Content-Type": "application/json" } },
  );
});
