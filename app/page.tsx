import Link from "next/link";
import {
  BotonReserva,
  CierreInvitacion,
  Flecha,
  FotoHenry,
  Sitio,
} from "@/components/sitio/estructura";
import { TemasAsesoria } from "@/components/sitio/temas";
import { PasosSesion } from "@/components/sitio/pasos";
import { ASESORIA, MINUTOS_SESION } from "@/lib/servicios";
import { BandaTipografica, RumboVisual } from "@/components/sitio/rumbo-visual";

export default function Portada() {
  return (
    <Sitio>
      <main id="contenido">
        <section className="site-container home-hero">
          <RumboVisual />
          <div className="hero-title">
            <span className="eyebrow">
              <i /> ASESORÍA PERSONALIZADA CON HENRY ORELLANA
            </span>
            <h1>
              <span className="hero-line hero-line-first">
                <span className="hero-word">Hablemos de tu</span>
              </span>
              <br />
              <span className="hero-line">
                <span className="hero-word">próximo</span>
              </span>
              <br />
              <span className="hero-line hero-last-word">
                <span className="hero-word">paso.</span>
              </span>
              <svg viewBox="0 0 80 80" aria-hidden="true">
                <path d="M10 68 68 10M10 10h58v58" />
              </svg>
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
            <Link href="/reservar" className="session-ticket">
              <span className="ticket-top">
                TU ESPACIO CON HENRY <Flecha diagonal />
              </span>
              <strong>
                ${ASESORIA.precioUsd}
                <small> USD</small>
              </strong>
              <span className="ticket-bottom">
                {MINUTOS_SESION} MINUTOS <span>ATENCIÓN 1:1</span>
              </span>
            </Link>
            <span className="photo-location">
              UTAH, ESTADOS UNIDOS <i />
            </span>
          </div>
          <div className="hero-copy">
            <p>
              Tu historia es única. Dedícale una conversación.
              <br className="desktop-break" /> Orientación personal para ordenar
              tus dudas y mirar lo que viene con más claridad.
            </p>
            <div className="hero-actions">
              <BotonReserva texto="Reservar mi espacio" />
              <Link href="/asesoria" className="hero-secondary">
                Conocer la asesoría <Flecha />
              </Link>
            </div>
          </div>
          <a href="#tu-momento" className="hero-scroll">
            <span>ESTE ES TU PUNTO DE PARTIDA</span>
            <span aria-hidden="true">↓</span>
          </a>
        </section>
        <div className="brand-strip">
          <div className="site-container">
            <span>EN ESPAÑOL</span>
            <span aria-hidden="true">✳</span>
            <span>DESDE DONDE ESTÉS</span>
            <span aria-hidden="true">✳</span>
            <span>SOLO TÚ Y HENRY</span>
            <span aria-hidden="true">✳</span>
            <span>UN PASO A LA VEZ</span>
          </div>
        </div>
        <BandaTipografica />
        <section
          id="tu-momento"
          className="site-container conversation-section"
        >
          <div className="section-heading">
            <span className="eyebrow">01 — TU PUNTO DE PARTIDA</span>
            <h2>
              Muchas preguntas.
              <br />
              <em>Empecemos por una.</em>
            </h2>
            <p>
              No necesitas tenerlo todo resuelto para reservar. Este espacio
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
              <span className="eyebrow">02 — LA PERSONA AL OTRO LADO</span>
              <h2>
                Mucho gusto.
                <br />
                Soy <em>Henry.</em>
              </h2>
              <p>
                Detrás de cada duda hay una historia. Y la tuya merece tiempo,
                atención y una conversación de verdad.
              </p>
              <p>
                Soy Henry Orellana, fundador de ANDEX. Creé este espacio para
                escucharte y conversar sobre tu próximo paso, de persona a
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
            <span className="eyebrow">03 — DE LA DUDA A LA CONVERSACIÓN</span>
            <h2>
              Tu tiempo.
              <br />
              <em>Tu espacio.</em>
            </h2>
            <p>
              Una sesión personal, sin suscripciones.
              <br />
              45 minutos contigo. $70 USD.
            </p>
            <BotonReserva texto="Elegir mi momento" />
          </div>
          <PasosSesion />
        </section>
        <CierreInvitacion />
      </main>
    </Sitio>
  );
}
