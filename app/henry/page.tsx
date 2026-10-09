import type { Metadata } from "next";
import {
  BotonReserva,
  CierreInvitacion,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
export const metadata: Metadata = {
  title: "Conoce a Henry · Preparación de audiencia",
  description:
    "Conoce a Henry Orellana y su preparación de audiencias, en español y de persona a persona.",
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
              Una audiencia trae preguntas, y es normal no saber qué esperar.
              Por eso existe este espacio: para que llegues a ese día
              preparado, después de conversarlo conmigo.
            </p>
            <BotonReserva texto="Conversemos" />
          </div>
          <div className="about-image">
            <FotoHenry
              src="/imagenes/henry-estudio.jpg"
              alt="Retrato de Henry Orellana"
              priority
            />
            <span className="image-label">
              HENRY ORELLANA{" "}
              <span>CONSULTOR MIGRATORIO CERTIFICADO EN UTAH</span>
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
              <Palabras texto="Primero," /> <em><Palabras texto="tu historia." /></em>
              <br />
              <Palabras texto="Después, el camino." />
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
                "Soy consultor migratorio certificado en el estado de Utah, no abogado: las cuestiones legales requieren un profesional autorizado.",
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

/** Una palabra por pieza, para que la frase se encienda al ir leyéndola. */
function Palabras({ texto }: { texto: string }) {
  const palabras = texto.split(" ");
  return palabras.map((palabra, i) => (
    <span key={i} className="palabra">
      {i < palabras.length - 1 ? `${palabra} ` : palabra}
    </span>
  ));
}
