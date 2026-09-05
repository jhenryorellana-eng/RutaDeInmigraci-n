import type { Metadata } from "next";
import {
  BotonReserva,
  CierreInvitacion,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
export const metadata: Metadata = {
  title: "Conoce a Henry · La ruta del inmigrante",
  description:
    "Conoce a Henry Orellana y su espacio de asesoría personalizada, en español y de persona a persona.",
};
export default function Henry() {
  return (
    <Sitio>
      <main id="contenido">
        <section className="site-container about-hero">
          <div className="about-copy">
            <span className="eyebrow">LA PERSONA AL OTRO LADO</span>
            <h1>
              Mucho gusto.
              <br />
              Soy <em>Henry.</em>
            </h1>
            <p className="lead">
              Cada historia tiene un punto de partida.
              <br />
              Me gustaría conocer el tuyo.
            </p>
            <p>
              Empezar una nueva etapa trae ilusión. También trae preguntas. Por
              eso existe este espacio: para que puedas conversar conmigo sobre
              dónde estás y lo que viene.
            </p>
            <BotonReserva texto="Conversemos" />
          </div>
          <div className="about-image">
            <FotoHenry
              src="/henry-retrato.jpg"
              alt="Henry Orellana en un espacio de trabajo"
              priority
            />
            <span className="image-label">
              HENRY ORELLANA <span>FUNDADOR DE ANDEX</span>
            </span>
            <span className="about-image-corner" aria-hidden="true">
              ↗
            </span>
          </div>
        </section>
        <section className="about-statement">
          <div className="site-container">
            <span className="eyebrow">EL PUNTO DE PARTIDA</span>
            <h2>
              Primero, <em>tu historia.</em>
              <br />
              Después, el camino.
            </h2>
            <div className="statement-bottom">
              <p>
                No necesitas traer una historia perfectamente ordenada. Podemos
                empezar a ordenarla juntos.
              </p>
              <span className="henry-signature">Henry Orellana</span>
            </div>
          </div>
        </section>
        <section className="site-container values-section">
          <div className="section-heading">
            <span className="eyebrow">LO QUE PUEDES ESPERAR</span>
            <h2>
              Una conversación.
              <br />
              <em>Toda mi atención.</em>
            </h2>
          </div>
          <div className="values-list">
            {[
              [
                "01",
                "Escucharte primero",
                "45 minutos de atención personal para hablar de tus dudas, sin un guion que tengas que seguir.",
              ],
              [
                "02",
                "Hablar con claridad",
                "En español y a tu ritmo. Si algo no queda claro, lo volvemos a conversar.",
              ],
              [
                "03",
                "Ser honesto contigo",
                "Soy un punto de orientación personal. No soy abogado; las cuestiones legales requieren un profesional autorizado.",
              ],
            ].map(([n, t, p]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </section>
        <CierreInvitacion />
      </main>
    </Sitio>
  );
}
