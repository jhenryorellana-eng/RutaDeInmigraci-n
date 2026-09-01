import { NextResponse, type NextRequest } from "next/server";

import { clienteServidor } from "@/lib/supabase/servidor";
import { stripe, hayStripe } from "@/lib/pago-stripe";

/**
 * EL WEBHOOK DE STRIPE · lo único que puede creer que una tarjeta pagó.
 *
 * ── Por qué no basta con la vuelta del navegador ──
 *
 * Porque `success_url` la puede escribir cualquiera en la barra de
 * direcciones. Si la cita se confirmara al volver de Stripe, apuntar
 * `/gracias?pago=tarjeta` a mano sería una cita gratis. Lo único que se
 * puede creer es este webhook, porque viene FIRMADO con un secreto que sólo
 * conocen Stripe y este servidor.
 *
 * Por eso el cuerpo se lee en crudo (`req.text()`) y no como JSON: la firma
 * se calcula sobre los bytes exactos, y cualquier reserialización la rompe.
 *
 * ── Y por qué reintentar no duplica nada ──
 *
 * Stripe reintenta un webhook que no contesta 200, así que el mismo evento
 * puede llegar varias veces. Confirmar se hace con `confirmar_pago`, que
 * toma el cerrojo de la fila y devuelve `ya_estaba` si la cita ya estaba
 * confirmada. Un reintento no es un error y no se trata como tal.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = stripe();
  const firmaSecreta = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const secretoBase = process.env.AVISO_SECRETO?.trim();

  if (!hayStripe || !s || !firmaSecreta || !secretoBase) {
    return NextResponse.json({ error: "sin configurar" }, { status: 503 });
  }

  const firma = req.headers.get("stripe-signature");
  if (!firma) return NextResponse.json({ error: "sin firma" }, { status: 400 });

  const crudo = await req.text();

  let evento;
  try {
    /* La variante asíncrona a propósito: verifica igual, pero no depende de
       que el cifrado SÍNCRONO de Node esté disponible. Con el transporte de
       `fetch` que usa el cliente —el que arregló el fallo de conexión— es la
       que Stripe recomienda, y funciona igual en los dos entornos. */
    evento = await s.webhooks.constructEventAsync(crudo, firma, firmaSecreta);
  } catch {
    /* Firma inválida: o no viene de Stripe, o alguien manipuló el cuerpo. En
       los dos casos se rechaza sin mirar el contenido. */
    return NextResponse.json({ error: "firma inválida" }, { status: 400 });
  }

  if (evento.type !== "checkout.session.completed") {
    /* Cualquier otro evento se acepta sin hacer nada: devolver un error
       haría que Stripe lo reintentara para siempre. */
    return NextResponse.json({ recibido: true });
  }

  const sesion = evento.data.object as {
    id: string;
    client_reference_id: string | null;
    payment_status: string | null;
  };

  /* `completed` no siempre significa pagado —una sesión puede completarse
     con el pago pendiente— así que se comprueba explícitamente. */
  if (sesion.payment_status !== "paid") {
    return NextResponse.json({ recibido: true, ignorado: "pago no completado" });
  }

  const solicitudId = Number(sesion.client_reference_id);
  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return NextResponse.json({ recibido: true, ignorado: "sin solicitud" });
  }

  /* Aquí es donde NACE la cita. Hasta este momento no había nada en la
     agenda: sólo una solicitud con los datos y el importe. */
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("cita_desde_solicitud", {
    secreto: secretoBase,
    p_solicitud_id: solicitudId,
    p_metodo: "stripe",
    p_fuente: "stripe",
    p_referencia: sesion.id,
  });

  if (error) {
    /* Se devuelve 500 A PROPÓSITO para que Stripe reintente: el dinero ya
       salió de la tarjeta y esta cita TIENE que quedar confirmada. */
    return NextResponse.json({ error: "no se pudo confirmar" }, { status: 500 });
  }

  const res = (data ?? {}) as { ok?: boolean; motivo?: string };
  if (!res.ok) {
    /* La hora se la llevó otra persona mientras ésta pagaba. Es el riesgo
       aceptado al no bloquear la agenda, y reintentar no lo arregla: la
       solicitud queda marcada `hora_tomada` con la referencia del cobro,
       para que Henry lo vea y devuelva el dinero. Se acepta el evento
       —Stripe no tiene nada que reintentar— y el problema queda escrito
       donde se mira, no en un registro que nadie abre. */
    return NextResponse.json({ recibido: true, sinAplicar: res.motivo });
  }

  return NextResponse.json({ recibido: true });
}
