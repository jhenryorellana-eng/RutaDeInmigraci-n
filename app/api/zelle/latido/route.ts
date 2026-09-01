import { NextResponse, type NextRequest } from "next/server";

import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * EL LATIDO · avisa cuando el barrido lleva rato muerto.
 *
 * §6.3 del traspaso, y la trampa que describe es exacta: sin esto, una
 * contraseña IMAP revocada, un buzón renombrado o la alerta de Chase apagada
 * NO se notan. El cron sigue en verde porque el barrido corre; lo que no hay
 * es correos que leer, y eso se ve igual que un día tranquilo.
 *
 * Se descubre semanas después, por un cliente diciendo «yo pagué».
 *
 * ── Cómo avisa, con lo que hay ──
 *
 * Devolviendo **500**. Este proyecto no manda correos, así que el canal de
 * alerta es el que ya existe: el panel de crons de Vercel pinta el fallo en
 * rojo y avisa. No es una alerta bonita, pero llega — y una alerta fea que
 * llega vale más que una bonita que hay que construir.
 *
 * Seis horas de margen: el barrido corre cada dos minutos, así que seis
 * horas sin un solo éxito no es una racha mala, es que algo está roto.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A partir de aquí, algo va mal. */
const HORAS_DE_MARGEN = 6;

export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET;
  const secreto = process.env.AVISO_SECRETO?.trim();
  if (!cron || !secreto) {
    return NextResponse.json({ error: "sin configurar" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cron}`) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("zelle_latido", { secreto });
  if (error) {
    return NextResponse.json({ error: "no se pudo leer el latido" }, { status: 500 });
  }

  const latido = (data ?? {}) as {
    horasDesdeElUltimo: number | null;
    ultimoError: string | null;
    ultimoUid: number;
  };

  /* Nunca ha barrido con éxito. Al primer despliegue es normal; a los tres
     días, no. No se puede distinguir desde aquí, así que se avisa: es mejor
     un aviso de más al arrancar que descubrirlo en noviembre. */
  const nuncaBarrio = latido.horasDesdeElUltimo === null;
  const rancio = latido.horasDesdeElUltimo !== null && latido.horasDesdeElUltimo > HORAS_DE_MARGEN;

  if (nuncaBarrio || rancio) {
    return NextResponse.json(
      {
        vivo: false,
        motivo: nuncaBarrio
          ? "Nunca ha habido un barrido con éxito."
          : `Hace ${latido.horasDesdeElUltimo} h del último barrido con éxito.`,
        ultimoError: latido.ultimoError,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ vivo: true, ...latido });
}
