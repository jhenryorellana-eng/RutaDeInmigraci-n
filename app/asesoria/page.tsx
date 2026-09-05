import type { Metadata } from "next";
import {
  BotonReserva,
  CierreInvitacion,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
import { ASESORIA } from "@/lib/servicios";
export const metadata: Metadata = {
  title: "Tu asesoría personalizada · $70 · Con Henry",
  description:
    "45 minutos de asesoría personalizada con Henry Orellana. Conoce qué incluye, cómo funciona y reserva tu sesión de $70 USD.",
};
const PREGUNTAS = [
  [
    "¿Necesito tener una audiencia para reservar?",
    "No. Este espacio es una asesoría personalizada para conversar sobre tus dudas y tu próximo paso. No necesitas tener una audiencia programada.",
  ],
  [
    "¿Cómo se realiza la sesión?",
    "Después de confirmar el pago, Henry te contacta por WhatsApp para coordinar y enviarte los detalles de la sesión. Puedes reservar desde donde estés.",
  ],
  [
    "¿Qué debo preparar?",
    "Anota las preguntas que más te importan y qué te gustaría aclarar. No tienes que enviar documentos ni explicar tu situación en el formulario de reserva.",
  ],
  [
    "¿Cuánto cuesta y cómo puedo pagar?",
    "La sesión de 45 minutos cuesta $70 USD. Puedes pagar por Zelle o, cuando esté disponible, con tarjeta a través de Stripe. La hora se confirma al validar el pago.",
  ],
  [
    "¿Es una consulta con un abogado?",
    "No. Henry no es abogado. Es un espacio de orientación personal y no incluye representación, asesoría legal ni garantías sobre el resultado de un trámite.",
  ],
  [
    "¿Qué pasa si necesito cambiar mi hora?",
    "Escríbele a Henry por WhatsApp con anticipación para coordinar el cambio. Él te indicará las opciones disponibles.",
  ],
];
export default function Asesoria() {
  return (
    <Sitio>
      <main id="contenido">
        <section className="site-container service-hero">
          <div>
            <span className="eyebrow">UNA SESIÓN. TODA LA ATENCIÓN.</span>
            <h1>
              45 minutos.
              <br />
              100% <em>contigo.</em>
            </h1>
            <p className="lead">
              Tus preguntas, tu momento y una conversación que empieza donde tú
              estás.
            </p>
          </div>
          <div className="service-price">
            <span>Asesoría personalizada</span>
            <strong>
              ${ASESORIA.precioUsd}
              <small> USD</small>
            </strong>
            <p>Una sesión · 45 minutos con Henry</p>
            <BotonReserva texto="Elegir mi hora" />
          </div>
        </section>
        <section className="service-wide-photo site-container">
          <FotoHenry
            src="/imagenes/henry-conversacion.webp"
            alt="Imagen editorial de Henry en un espacio de conversación tranquilo"
            priority
            sizes="(max-width: 760px) 100vw, 1200px"
          />
          <div>
            <span className="eyebrow">UN ESPACIO, SIN DISTRACCIONES</span>
            <p>
              Lo importante aquí
              <br />
              <em>eres tú.</em>
            </p>
          </div>
        </section>
        <section className="site-container includes-section">
          <div>
            <span className="eyebrow">QUÉ INCLUYE TU ASESORÍA</span>
            <h2>
              Menos vueltas.
              <br />
              <em>Más claridad.</em>
            </h2>
          </div>
          <ul>
            <li>
              <span>01</span>Tiempo individual con Henry, dedicado a tu
              situación.
            </li>
            <li>
              <span>02</span>Un espacio para plantear y ordenar tus preguntas.
            </li>
            <li>
              <span>03</span>Una conversación sobre tus prioridades y opciones.
            </li>
            <li>
              <span>04</span>Orientación sobre próximos pasos y cuándo acudir a
              un especialista.
            </li>
          </ul>
        </section>
        <section id="como-funciona" className="how-section">
          <div className="site-container">
            <span className="eyebrow">TU SESIÓN, PASO A PASO</span>
            <h2>
              Nos encontramos
              <br />
              <em>en tres pasos.</em>
            </h2>
            <div className="how-grid">
              {[
                [
                  "01",
                  "Elige tu momento",
                  "Mira el calendario y selecciona un día. Verás tanto tu hora local como la de Henry en Utah.",
                ],
                [
                  "02",
                  "Completa tu reserva",
                  "Deja tus datos de contacto y realiza el pago de $70. Tu hora se confirma al verificarlo.",
                ],
                [
                  "03",
                  "Prepara tus preguntas",
                  "Henry te escribe por WhatsApp para coordinar. Ten a mano aquello que quieras conversar.",
                ],
              ].map(([n, t, p]) => (
                <article key={n}>
                  <span>{n}</span>
                  <h3>{t}</h3>
                  <p>{p}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="site-container faq-section">
          <div>
            <span className="eyebrow">ANTES DE DAR EL PASO</span>
            <h2>
              Es normal
              <br />
              <em>tener preguntas.</em>
            </h2>
          </div>
          <div className="faq-list">
            {PREGUNTAS.map(([pregunta, respuesta]) => (
              <details key={pregunta}>
                <summary>
                  {pregunta}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{respuesta}</p>
              </details>
            ))}
          </div>
        </section>
        <CierreInvitacion />
      </main>
    </Sitio>
  );
}
