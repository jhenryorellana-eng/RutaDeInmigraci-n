import Image from "next/image";
import Link from "next/link";
import { ASESORIA, MINUTOS_SESION } from "@/lib/servicios";
import { NavegacionInferior, NavegacionSitio } from "./navegacion";
import { ControlMovimiento, ExperienciaSitio } from "./experiencia";

export function Flecha({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M6 18 18 6M6 6h12v12" />
      ) : (
        <path d="M4 12h16m-6-6 6 6-6 6" />
      )}
    </svg>
  );
}
export function Marca() {
  return (
    <Link
      href="/"
      className="site-brand"
      aria-label="La ruta del inmigrante, inicio"
    >
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <path
            d="M4 36 36 4M4 4h32v32"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path d="M4 21V4h17" stroke="currentColor" strokeWidth="5" />
        </svg>
      </span>
      <span>
        LA RUTA<span>DEL INMIGRANTE</span>
      </span>
    </Link>
  );
}
export function BotonReserva({
  texto = "Reservar mi asesoría",
  claro = false,
}: {
  texto?: string;
  claro?: boolean;
}) {
  return (
    <Link
      className={`route-button ${claro ? "is-light" : ""}`}
      href="/reservar"
    >
      <span>{texto}</span>
      <span className="button-arrow">
        <Flecha diagonal />
      </span>
    </Link>
  );
}
export function Sitio({
  children,
  reserva = false,
}: {
  children: React.ReactNode;
  reserva?: boolean;
}) {
  return (
    <ExperienciaSitio reserva={reserva}>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="site-container header-inner">
          <Marca />
          <NavegacionSitio />
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="site-container footer-top">
          <div>
            <Marca />
            <p>
              Una conversación puede ser
              <br />
              el comienzo de tu próxima etapa.
            </p>
          </div>
          <div className="footer-links">
            <Link href="/henry">
              Conoce a Henry <Flecha diagonal />
            </Link>
            <Link href="/asesoria">
              La asesoría <Flecha diagonal />
            </Link>
            <Link href="/reservar">
              Reserva tu espacio <Flecha diagonal />
            </Link>
            <Link href="/links">
              Nuestros proyectos <Flecha diagonal />
            </Link>
          </div>
          <div className="footer-location">
            <span className="eyebrow">PARTE DE UNA MISMA VISIÓN</span>
            <div className="parent-brand">
              <Image
                src="/marca-usalatinoprime.png"
                alt=""
                width={48}
                height={60}
              />
              <span>
                USALATINO<span>PRIME</span>
              </span>
            </div>
            <span>Desde Utah. Contigo, donde estés.</span>
          </div>
        </div>
        <div className="site-container footer-bottom">
          <span>© {new Date().getFullYear()} Orellana Group</span>
          {!reserva ? <ControlMovimiento /> : null}
          <p>
            Orientación personal. Henry no es abogado y la sesión no sustituye
            asesoría legal.
          </p>
          <Link href="#contenido" aria-label="Volver arriba">
            ↑
          </Link>
        </div>
      </footer>
      {!reserva ? <NavegacionInferior /> : null}
    </ExperienciaSitio>
  );
}
export function CierreInvitacion() {
  return (
    <section className="closing-section">
      <div className="site-container">
        <div className="closing-overline">
          <span className="eyebrow">TU SIGUIENTE CAPÍTULO EMPIEZA CONTIGO</span>
          <span className="eyebrow">01 PERSONA. TODA LA ATENCIÓN.</span>
        </div>
        <Link href="/reservar" className="closing-link">
          <h2>¿Lo hablamos?</h2>
          <span className="closing-arrow">
            <Flecha diagonal />
          </span>
        </Link>
        <div className="closing-bottom">
          <p>
            Trae tus preguntas.
            <br />
            Henry pone el tiempo y la escucha.
          </p>
          <span>
            {MINUTOS_SESION} MINUTOS <i /> ${ASESORIA.precioUsd} USD
          </span>
          <Link href="/reservar" className="text-link">
            Elegir mi momento <Flecha />
          </Link>
        </div>
      </div>
    </section>
  );
}
export function FotoHenry({
  src = "/imagenes/henry-oficina.webp",
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 760px) 100vw, 50vw",
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`editorial-photo ${className}`}
    />
  );
}
