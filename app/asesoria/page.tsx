import type { Metadata } from "next";
import { Boleto } from "@/components/sitio/boleto";
import {
  CierreInvitacion,
  Flecha,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
import { enlaceCambioDeHora, enlacePregunta } from "@/lib/pago";
import { sePuedeCobrarConTarjeta } from "@/lib/pago-stripe";
import { AUDIENCIAS, MINUTOS_SESION, PRECIO_DESDE } from "@/lib/servicios";
export const metadata: Metadata = {
  title: `Prepara tu audiencia con Henry · Desde $${PRECIO_DESDE}`,
  description: `${MINUTOS_SESION} minutos uno a uno con Henry Orellana para preparar tu segunda audiencia o tu audiencia de mérito. Qué incluye, cómo funciona y cuánto cuesta.`,
};
/** «$150 la segunda audiencia y $350 la tercera audiencia», sin cifras a mano. */
const PRECIOS = AUDIENCIAS.map(
  (s) => `$${s.precioUsd} USD la ${s.nombre.toLowerCase()} (${s.etapa.toLowerCase()})`,
).join(" y ");
type Pregunta = {
  pregunta: string;
  respuesta: string;
  enlace?: { texto: string; href: string };
};
/* La respuesta del pago depende de si la tarjeta está configurada: prometer
   un método que la pantalla de pago no ofrece se descubre justo al pagar. */
const PREGUNTAS: Pregunta[] = [
  {
    pregunta: "¿Cuál de las dos preparaciones elijo?",
    respuesta:
      "La de tu próxima cita en la corte. Si es una audiencia preliminar, la segunda; si es tu audiencia de mérito, donde se presenta tu caso completo, la tercera. Si no estás seguro, escríbele a Henry antes de reservar.",
    enlace: { texto: "Preguntar a Henry", href: enlacePregunta() },
  },
  {
    pregunta: "¿Cómo se realiza la sesión?",
    respuesta:
      "Después de confirmar el pago, Henry te contacta por WhatsApp para coordinar y enviarte los detalles de la sesión. Puedes reservar desde donde estés.",
  },
  {
    pregunta: "¿Qué debo preparar?",
    respuesta:
      "Anota las preguntas que más te importan y qué te gustaría aclarar. No tienes que enviar documentos ni explicar tu situación en el formulario de reserva.",
  },
  {
    pregunta: "¿Cuánto cuesta y cómo puedo pagar?",
    respuesta: sePuedeCobrarConTarjeta
      ? `Cada preparación es una sesión de ${MINUTOS_SESION} minutos: ${PRECIOS}. Puedes pagar con tarjeta, de forma segura a través de Stripe, o por Zelle desde la app de tu banco. La hora se confirma al validar el pago.`
      : `Cada preparación es una sesión de ${MINUTOS_SESION} minutos: ${PRECIOS}. Se paga por Zelle, desde la app de tu banco. La hora se confirma al validar el pago.`,
  },
  {
    pregunta: "¿Es una consulta con un abogado?",
    respuesta:
      "No. Henry es consultor migratorio certificado en el estado de Utah, no abogado. Es un espacio de orientación personal y no incluye representación, asesoría legal ni garantías sobre el resultado de un trámite.",
  },
  {
    pregunta: "¿Qué pasa si necesito cambiar mi hora?",
    respuesta:
      "Escríbele a Henry por WhatsApp con anticipación y te indicará las horas disponibles. El mensaje ya va escrito: sólo tienes que enviarlo.",
    enlace: { texto: "Pedir cambio de hora", href: enlaceCambioDeHora() },
  },
];
export default function Asesoria() {
  return (
    <Sitio>
      <main id="contenido">
        <section className="site-container service-hero">
          <div>
            <span className="eyebrow">UNA SESIÓN. TODA LA ATENCIÓN.</span>
            <h1>
              {MINUTOS_SESION} minutos.
              <br />
              100% <em>contigo.</em>
            </h1>
            <p className="lead">
              Una sesión con Henry para llegar a tu audiencia sabiendo qué
              esperar y con tus preguntas en orden.
            </p>
          </div>
          <div className="service-boletos">
            {AUDIENCIAS.map((s) => (
              <Boleto key={s.id} servicio={s} tamano="mini" />
            ))}
            <p className="service-boletos-nota">
              Toca la tuya para ver las horas libres.
            </p>
          </div>
        </section>
        <section className="service-wide-photo site-container">
          <FotoHenry
            src="/imagenes/henry-asesoria.jpg"
            alt="Henry Orellana de brazos cruzados en su oficina"
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
              audiencia.
            </li>
            <li>
              <span>02</span>Repasar qué va a pasar ese día, de principio a fin.
            </li>
            <li>
              <span>03</span>Un espacio para plantear y ordenar tus preguntas.
            </li>
            <li>
              <span>04</span>Orientación sobre cuándo conviene acudir a un
              abogado.
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
                  "Elige tu audiencia y tu momento",
                  "Toca la preparación que necesitas y elige un día. Verás tanto tu hora local como la de Henry en Utah.",
                ],
                [
                  "02",
                  "Completa tu reserva",
                  `Deja tus datos de contacto y paga tu preparación, desde $${PRECIO_DESDE}. Tu hora se confirma al verificarlo.`,
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
            {PREGUNTAS.map(({ pregunta, respuesta, enlace }) => (
              <details key={pregunta}>
                <summary>
                  {pregunta}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{respuesta}</p>
                {enlace ? (
                  <a
                    href={enlace.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="faq-action"
                  >
                    {enlace.texto} <Flecha diagonal />
                  </a>
                ) : null}
              </details>
            ))}
            <div className="faq-more">
              <p>
                ¿Tu pregunta no está aquí?
                <span>Henry te responde por WhatsApp antes de reservar.</span>
              </p>
              <a
                href={enlacePregunta()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                Escribir a Henry <Flecha diagonal />
              </a>
            </div>
          </div>
        </section>
        <CierreInvitacion />
      </main>
    </Sitio>
  );
}
