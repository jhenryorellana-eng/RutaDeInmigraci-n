import Link from "next/link";
import {
  BotonReserva,
  CierreInvitacion,
  Flecha,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
import { Boleto } from "@/components/sitio/boleto";
import { TemasAsesoria } from "@/components/sitio/temas";
import { PasosSesion } from "@/components/sitio/pasos";
import { AUDIENCIAS, MINUTOS_SESION, PRECIO_DESDE } from "@/lib/servicios";
import { BandaTipografica, RumboVisual } from "@/components/sitio/rumbo-visual";

const CINTA = [
  "EN ESPAÑOL",
  "DESDE DONDE ESTÉS",
  "SOLO TÚ Y HENRY",
  "UN PASO A LA VEZ",
  `${MINUTOS_SESION} MINUTOS`,
];

export default function Portada() {
  return (
    <Sitio>
      <main id="contenido">
        <section className="site-container home-hero">
          <RumboVisual />
          <div className="hero-title">
            <span className="eyebrow">
              <i /> PREPARACIÓN DE AUDIENCIA CON HENRY ORELLANA
            </span>
            <h1>
              <span className="hero-line hero-line-first">
                <span className="hero-word">Prepárate</span>
              </span>
              <br />
              <span className="hero-line">
                <span className="hero-word">para tu</span>
              </span>
              <br />
              <span className="hero-line hero-last-word">
                <span className="hero-word">
                  audiencia.
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <path d="M10 68 68 10M10 10h58v58" />
                  </svg>
                </span>
              </span>
            </h1>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <FotoHenry
                src="/imagenes/henry-utah.webp"
                alt="Henry Orellana en Utah, con las montañas de fondo"
                priority
                sizes="(max-width: 760px) 100vw, 58vw"
              />
            </div>
            <div className="portrait-label">
              <span>HENRY ORELLANA</span>
              <span>Una conversación. De tú a tú.</span>
            </div>
            <div className="hero-boletos">
              {AUDIENCIAS.map((s) => (
                <Boleto key={s.id} servicio={s} tamano="mini" />
              ))}
            </div>
            <span className="photo-location">
              UTAH, ESTADOS UNIDOS <i />
            </span>
          </div>
          <div className="hero-copy">
            <p>
              {MINUTOS_SESION} minutos uno a uno con Henry, en español.
              <br className="desktop-break" /> Repasan qué va a pasar ese día,
              ordenan tus preguntas y practicas para entrar con calma.
            </p>
            <div className="hero-actions">
              <BotonReserva texto="Elegir mi audiencia" href="#audiencias" />
              <Link href="/asesoria" className="hero-secondary">
                Cómo funciona <Flecha />
              </Link>
            </div>
          </div>
          <a href="#audiencias" className="hero-scroll">
            <span>ELIGE LA AUDIENCIA QUE VAS A PREPARAR</span>
            <span aria-hidden="true">↓</span>
          </a>
        </section>
        <div className="brand-strip">
          <div className="brand-strip-track">
            {[0, 1].map((copia) => (
              <div
                className="brand-strip-set"
                key={copia}
                aria-hidden={copia === 1 ? true : undefined}
              >
                {CINTA.map((texto) => (
                  <span key={texto} className="brand-strip-item">
                    <span>{texto}</span>
                    <span aria-hidden="true">✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <section
          id="audiencias"
          className="site-container audiencias-section"
        >
          <div className="section-heading">
            <span className="eyebrow">01 — ELIGE TU AUDIENCIA</span>
            <h2>
              Dos audiencias.
              <br />
              <em>Dos preparaciones.</em>
            </h2>
            <p>
              Cada sesión dura {MINUTOS_SESION} minutos y es solo contigo.
              Elige la de tu próxima cita en la corte.
            </p>
          </div>
          <div className="audiencias-boletos">
            {AUDIENCIAS.map((s) => (
              <Boleto key={s.id} servicio={s} />
            ))}
          </div>
          <p className="audiencias-nota">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8v.01" />
            </svg>
            <span>
              Henry es consultor migratorio certificado en el estado de Utah,
              no abogado. La sesión es orientación personal para que llegues
              preparado; no incluye representación legal.{" "}
              <Link href="/asesoria">Cómo funciona la sesión</Link>
            </span>
          </p>
        </section>
        <BandaTipografica />
        <section
          id="tu-momento"
          className="site-container conversation-section"
        >
          <div className="section-heading">
            <span className="eyebrow">02 — TU PUNTO DE PARTIDA</span>
            <h2>
              Muchas preguntas.
              <br />
              <em>Empecemos por una.</em>
            </h2>
            <p>
              No necesitas tenerlo todo resuelto para reservar. La sesión
              empieza donde tú estás.
            </p>
          </div>
          <TemasAsesoria />
        </section>
        <section className="henry-feature">
          <div className="site-container henry-feature-grid">
            <div className="feature-photo">
              <FotoHenry
                src="/imagenes/henry-conversacion.webp"
                alt="Henry en un espacio de conversación"
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <span className="feature-image-note">
                PERSONAS ANTES QUE PREGUNTAS.
              </span>
            </div>
            <div className="feature-copy">
              <span className="eyebrow">03 — LA PERSONA AL OTRO LADO</span>
              <h2>
                Mucho gusto.
                <br />
                Soy <em>Henry.</em>
              </h2>
              <p>
                Detrás de cada audiencia hay una historia. Y la tuya merece
                tiempo, atención y una conversación de verdad.
              </p>
              <p>
                Soy Henry Orellana, consultor migratorio certificado en el
                estado de Utah y fundador de ANDEX. Creé este espacio para
                que nadie llegue a la corte sin saber qué esperar, de persona a
                persona.
              </p>
              <Link href="/henry" className="text-link">
                Conoce a Henry <Flecha diagonal />
              </Link>
              <span className="henry-signature">Henry Orellana</span>
            </div>
          </div>
        </section>
        <section className="site-container journey-section">
          <div className="journey-heading">
            <span className="eyebrow">04 — DE LA DUDA A LA AUDIENCIA</span>
            <h2>
              Tu tiempo.
              <br />
              <em>Tu espacio.</em>
            </h2>
            <p>
              Una sesión personal, sin suscripciones.
              <br />
              {MINUTOS_SESION} minutos contigo. Desde ${PRECIO_DESDE} USD.
            </p>
            <BotonReserva texto="Elegir mi audiencia" href="#audiencias" />
          </div>
          <PasosSesion />
        </section>
        <CierreInvitacion />
      </main>
    </Sitio>
  );
}
