import { NextResponse, type NextRequest } from "next/server";

/**
 * DIAGNÓSTICO · temporal, para averiguar por qué falla Stripe.
 *
 * Existe porque el error que llegaba —«An error occurred with our connection
 * to Stripe»— señala a la red, y la red funciona: Supabase habla desde estas
 * mismas funciones sin un fallo. Con dos intentos ya gastados adivinando,
 * esto va a por el dato en vez de por otra hipótesis.
 *
 * ── Lo que NUNCA devuelve ──
 *
 * Ningún valor de ninguna clave. De cada variable dice tres cosas: si está,
 * cuánto mide, y si trae espacios o saltos de línea alrededor — que es
 * justamente la avería que se sospecha, porque una clave con un `\n` pegado
 * hace que `fetch` rechace la cabecera `Authorization` y el SDK lo envuelva
 * como un error de conexión.
 *
 * De la clave secreta se dicen además los seis primeros caracteres, que
 * distinguen `sk_live_` de `sk_test_` sin revelar nada aprovechable.
 *
 * ── Y hace una llamada de verdad ──
 *
 * Un `fetch` desnudo a la API de Stripe, sin el SDK por medio. Si ése
 * funciona y el SDK no, el problema es el SDK; si falla también, es la
 * salida a internet o la clave. Esa pregunta es la que hay que responder.
 *
 * BORRAR ESTA RUTA cuando el pago funcione. Protegida con `AVISO_SECRETO`
 * para que nadie de fuera pueda hacerle preguntas al entorno.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function retrato(nombre: string) {
  const bruto = process.env[nombre];
  if (bruto === undefined) return { presente: false };
  const limpio = bruto.trim();
  return {
    presente: true,
    largo: bruto.length,
    largoLimpio: limpio.length,
    /* Lo que se está buscando: un salto de línea o un espacio arrastrado al
       pegar en el panel. Se ve aquí y no se ve en ningún otro sitio. */
    traeEspacios: bruto.length !== limpio.length,
  };
}

export async function GET(req: NextRequest) {
  const esperado = process.env.AVISO_SECRETO?.trim();
  if (!esperado) {
    return NextResponse.json({ error: "AVISO_SECRETO sin configurar" }, { status: 503 });
  }
  if (req.nextUrl.searchParams.get("clave") !== esperado) {
    return NextResponse.json({ error: "no" }, { status: 401 });
  }

  const clave = (process.env.STRIPE_SECRET_KEY ?? "").trim();

  const variables = {
    STRIPE_SECRET_KEY: {
      ...retrato("STRIPE_SECRET_KEY"),
      empiezaPor: clave.slice(0, 8) || null,
    },
    STRIPE_WEBHOOK_SECRET: retrato("STRIPE_WEBHOOK_SECRET"),
    AVISO_SECRETO: retrato("AVISO_SECRETO"),
    NEXT_PUBLIC_SITE_URL: retrato("NEXT_PUBLIC_SITE_URL"),
    VERCEL_PROJECT_PRODUCTION_URL: retrato("VERCEL_PROJECT_PRODUCTION_URL"),
    VERCEL_REGION: process.env.VERCEL_REGION ?? null,
  };

  /* La llamada desnuda: sin SDK, sin reintentos, sin nada en medio. */
  let stripeDirecto: Record<string, unknown>;
  try {
    const r = await fetch("https://api.stripe.com/v1/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${clave}` },
      signal: AbortSignal.timeout(15_000),
    });
    const cuerpo = await r.text();
    stripeDirecto = {
      alcanzado: true,
      http: r.status,
      /* Sólo el tipo y el mensaje del error de Stripe, nunca el saldo. */
      respuesta:
        r.status === 200
          ? "ok (no se imprime el saldo)"
          : cuerpo.slice(0, 300),
    };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; message?: string } };
    stripeDirecto = {
      alcanzado: false,
      nombre: err.name,
      mensaje: err.message,
      causa: err.cause?.code ?? err.cause?.message ?? null,
    };
  }

  return NextResponse.json({ variables, stripeDirecto });
}
