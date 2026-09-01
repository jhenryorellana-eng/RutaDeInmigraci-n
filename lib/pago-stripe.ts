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

const CLAVE = process.env.STRIPE_SECRET_KEY ?? "";

export const hayStripe = CLAVE.length > 0;

/** El cliente, o `null` si no hay clave. Nunca lanza al importar. */
export function stripe(): Stripe | null {
  if (!hayStripe) return null;
  return new Stripe(CLAVE);
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
      /* La cita ya está retenida y caduca en media hora. La sesión caduca
         antes, para que nadie termine de pagar sobre una reserva que el
         barrido ya soltó. Stripe exige un mínimo de 30 minutos, así que se
         pide ese mínimo y la holgura la da el lado de la cita. */
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: { cita_id: String(datos.citaId) },
      success_url: `${datos.urlBase}/gracias?pago=tarjeta`,
      cancel_url: `${datos.urlBase}/reservar?servicio=&pago=cancelado`,
    });

    if (!sesion.url) return { error: "Stripe no devolvió una dirección de pago." };
    return { url: sesion.url };
  } catch {
    return { error: "No se pudo abrir el pago con tarjeta. Prueba con Zelle." };
  }
}
