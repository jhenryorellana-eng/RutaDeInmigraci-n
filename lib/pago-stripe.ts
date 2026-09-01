import Stripe from "stripe";

/**
 * STRIPE · el otro método de pago.
 *
 * Zelle es lo que Henry ya usaba y lo que su público conoce; Stripe es lo
 * que cierra el círculo, porque cuando alguien paga con tarjeta el sitio SÍ
 * se entera al momento — no hay que leer ningún correo ni adivinar nada.
 *
 * ── Lo que Stripe cambia respecto a Zelle ──
 *
 * Con Zelle el sitio ve el pago cuando el banco manda la alerta y el
 * conciliador la lee: pasan segundos o minutos, y hay casos que no se pueden
 * identificar solos. Con Stripe llega un webhook firmado en el momento
 * exacto y con el identificador de la cita dentro. No hay conciliación
 * porque no hay nada que conciliar.
 *
 * ── Lo que NO cambia ──
 *
 * Los datos de la tarjeta no pasan por aquí. El pago ocurre en una pantalla
 * alojada por Stripe (Checkout), así que este sitio nunca ve un número de
 * tarjeta y sigue fuera del alcance de PCI DSS, igual que con Zelle. Eso no
 * es un detalle: es lo que hace que esto se pueda montar sin una auditoría.
 *
 * ── Si no está configurado ──
 *
 * `hayStripe` es falso y la pantalla ofrece sólo Zelle. Un botón de tarjeta
 * que lleva a un error es peor que no tener botón de tarjeta.
 */

/**
 * La clave, LIMPIA.
 *
 * El `trim()` no es cosmético. Al pegar una clave en el panel de Vercel es
 * facilísimo arrastrar un salto de línea o un espacio final, y eso no da un
 * error claro: el SDK construye la cabecera `Authorization: Bearer sk_…
`,
 * `fetch` la rechaza por cabecera inválida, y el SDK envuelve ese fallo como
 * «An error occurred with our connection to Stripe» — un mensaje que apunta
 * a la red cuando el problema está en un carácter invisible.
 */
const CLAVE = (process.env.STRIPE_SECRET_KEY ?? "").trim();

/** Hay con qué COBRAR: basta la clave secreta para abrir una sesión. */
export const hayStripe = CLAVE.length > 0;

/**
 * Hay con qué cobrar Y CON QUÉ CONFIRMAR. Es lo único que puede encender el
 * botón de tarjeta.
 *
 * ── Por qué son tres variables y no una ──
 *
 * Con sólo `STRIPE_SECRET_KEY` se puede cobrar perfectamente… y no enterarse
 * de que se cobró. Eso ya ocurrió en producción: el botón salió porque había
 * clave, el webhook devolvía «sin configurar» por falta de las otras dos, y
 * cualquiera que hubiera pagado habría visto su hora caducar media hora
 * después con el dinero ya fuera de su cuenta. Un Stripe no se revierte solo.
 *
 * Así que ofrecer la tarjeta exige la cadena entera: la clave que cobra, el
 * secreto de firma que permite creerse el webhook, y el secreto con el que
 * ese webhook asciende la cita. Si falta uno, se ofrece sólo Zelle — que
 * funciona sin ninguno de los tres.
 */
export const sePuedeCobrarConTarjeta =
  CLAVE.length > 0 &&
  (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim().length > 0 &&
  (process.env.AVISO_SECRETO ?? "").trim().length > 0;

/**
 * El cliente, o `null` si no hay clave. Nunca lanza al importar.
 *
 * ── Por qué se le cambia el transporte a `fetch` ──
 *
 * Por defecto el SDK de Stripe habla por el módulo `http` de Node con
 * keep-alive, pensado para un servidor de toda la vida que mantiene la
 * conexión viva entre peticiones. Aquí no hay tal servidor: cada llamada
 * corre en una función efímera que nace y muere, y ese cliente falla con
 * «An error occurred with our connection to Stripe. Request was retried 2
 * times» — que es exactamente lo que salió en producción.
 *
 * La pista de que era el transporte y no la red: Supabase, desde estas
 * mismas funciones, funcionaba sin un fallo. Y Supabase habla por `fetch`.
 *
 * `createFetchHttpClient()` es el transporte que Stripe publica para
 * entornos sin servidor. Sin estado entre llamadas, sin conexiones que
 * mantener vivas.
 *
 * Y dos ajustes más, para que un fallo se vea en vez de colgarse: un reintento
 * en vez de dos, y un tope de 20 segundos. Quien está esperando para pagar
 * merece un error rápido antes que una pantalla parada un minuto.
 */
export function stripe(): Stripe | null {
  if (!hayStripe) return null;
  return new Stripe(CLAVE, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
    timeout: 20_000,
  });
}

/**
 * La sesión de pago de una cita.
 *
 * `client_reference_id` lleva el id de la cita, que es lo que el webhook usa
 * después para saber cuál confirmar. Va ahí y no en la URL de vuelta porque
 * una URL la puede escribir cualquiera: lo que Stripe firma es lo que se
 * puede creer.
 */
export async function crearSesionDePago(datos: {
  citaId: number;
  titulo: string;
  descripcion: string;
  precioUsd: number;
  correo: string;
  urlBase: string;
  /** Para poder volver a SU preparación si cancela, no al menú. */
  servicioId: string;
}): Promise<{ url: string } | { error: string }> {
  const s = stripe();
  if (!s) return { error: "El pago con tarjeta no está configurado." };

  try {
    const sesion = await s.checkout.sessions.create({
      mode: "payment",
      client_reference_id: String(datos.citaId),
      customer_email: datos.correo,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: datos.precioUsd * 100,
            product_data: { name: datos.titulo, description: datos.descripcion },
          },
        },
      ],
      /* SIN `expires_at`, y es deliberado.
       *
       * Llevaba `ahora + 30 minutos`, que es exactamente el mínimo que Stripe
       * admite… y Stripe lo valida contra SU reloj al recibir la petición.
       * Con el retardo de red le llegaban 29:59 y rechazaba la sesión entera:
       * el botón de tarjeta fallaba siempre, en producción, con un error que
       * este archivo se tragaba.
       *
       * No hace falta ponerlo. Que la sesión viva más que la retención de la
       * hora no es un agujero: `confirmar_pago()` comprueba, bajo cerrojo, si
       * la retención caducó Y si alguien se llevó esa hora. Si sigue libre,
       * confirma —que es lo justo: esa persona pagó—; si no, se niega y queda
       * escrito para que Henry devuelva el dinero. Esa decisión ya estaba
       * tomada ahí, y duplicarla aquí con un reloj distinto sólo servía para
       * romperlo. */
      metadata: { cita_id: String(datos.citaId) },
      success_url: `${datos.urlBase}/gracias?pago=tarjeta`,
      cancel_url: `${datos.urlBase}/reservar?servicio=${datos.servicioId}&pago=cancelado`,
    });

    if (!sesion.url) return { error: "Stripe no devolvió una dirección de pago." };
    return { url: sesion.url };
  } catch (e) {
    /* El motivo REAL, no un mensaje genérico.
     *
     * Antes esto devolvía «no se pudo, prueba con Zelle» y nada más, y esa
     * decisión costó un rato largo: el botón falló en producción y no había
     * forma de saber por qué sin leer los registros del servidor. Un error
     * que no dice qué pasó es un error que se investiga dos veces.
     *
     * Los mensajes de Stripe describen el problema y no llevan claves, así
     * que se pueden enseñar. Y se escribe además en el registro, con el id
     * de la petición, que es lo que hace falta para preguntarle a Stripe. */
    const stripeErr = e as { message?: string; type?: string; requestId?: string };
    console.error("stripe: no se pudo crear la sesión", {
      type: stripeErr.type,
      requestId: stripeErr.requestId,
      message: stripeErr.message,
    });
    const razon = stripeErr.message ? ` (${stripeErr.message})` : "";
    return { error: `No se pudo abrir el pago con tarjeta${razon}. Puedes pagar con Zelle.` };
  }
}
