import { NextResponse, type NextRequest } from "next/server";

import { conciliarBuzon } from "@/lib/zelle/conciliar";

/**
 * EL BARRIDO DEL BUZÓN, DISPARADO POR RELOJ.
 *
 * Lo llama el cron de Vercel cada dos minutos (`vercel.json`). Dos minutos
 * es lo que tarda alguien en volver de su banco: más espaciado y esa persona
 * se queda mirando una pantalla que dice «esperando tu pago» cuando el pago
 * ya llegó.
 *
 * ── Por qué está protegida ──
 *
 * Porque abrir una conexión IMAP en cada visita es un coste que cualquiera
 * podría provocar desde fuera. Vercel firma sus llamadas de cron con
 * `CRON_SECRET` en la cabecera `Authorization`; sin esa cabecera correcta,
 * esto no hace nada.
 *
 * ── Un barrido que no corrió NO devuelve 200 ──
 *
 * §6.1 del traspaso, y la trampa que describe pasó allí tres veces: si el
 * endpoint contesta 200 aunque no haya hecho nada, el panel del cron se ve
 * «verde para siempre mientras no hace absolutamente nada». Aquí, si falta
 * configuración o el barrido no llegó a correr, se devuelve un código de
 * error para que se vea en rojo.
 *
 * La excepción es el cerrojo: que otro barrido esté dentro no es un fallo,
 * es el cerrojo funcionando.
 *
 * ── Lo que devuelve, y lo que no ──
 *
 * Números y nada más: cuántos correos se leyeron y en qué acabaron. Ni un
 * nombre, ni un importe, ni una transacción. Esta respuesta la puede ver
 * quien tenga el secreto del cron, y un nombre de quien acaba de pagar no
 * pinta nada en un cuerpo JSON de una ruta de mantenimiento.
 */

/* Node y no edge: `imapflow` abre un socket TLS, que el runtime edge no
   tiene. Y sin caché: cada llamada tiene que ir al buzón de verdad. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const esperado = process.env.CRON_SECRET;
  if (!esperado) {
    return NextResponse.json({ error: "CRON_SECRET sin configurar" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${esperado}`) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  try {
    const resumen = await conciliarBuzon();
    if (!resumen.corrio) {
      /* Solaparse no es un fallo; que falte configuración, sí. */
      const solapado = resumen.motivo === "Ya hay un barrido en curso.";
      return NextResponse.json(resumen, { status: solapado ? 200 : 503 });
    }
    return NextResponse.json(resumen);
  } catch {
    /* No se filtra el error hacia fuera: un mensaje de IMAP puede llevar el
       usuario del buzón. Falla con 500 y ya; el detalle queda en los
       registros de Vercel, que son de Henry. */
    return NextResponse.json({ error: "el barrido falló" }, { status: 500 });
  }
}
