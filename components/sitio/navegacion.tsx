"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ControlMovimiento, useMovimiento } from "./experiencia";
import { useMobile } from "./use-mobile";
import { ASESORIA, MINUTOS_SESION } from "@/lib/servicios";

const ENLACES = [
  { href: "/", texto: "Inicio", nota: "Tu punto de partida" },
  { href: "/henry", texto: "Conoce a Henry", nota: "La persona al otro lado" },
  { href: "/asesoria", texto: "La asesoría", nota: "Un espacio para ti" },
];

export function NavegacionSitio() {
  const movimiento = useMovimiento();
  const movil = useMobile();
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!abierto || !movil) return;
    const dialog = dialogo.current;
    if (dialog && !dialog.open) dialog.showModal();
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierto, movil]);

  useEffect(() => {
    if (!movil) {
      dialogo.current?.close();
      setAbierto(false);
    }
  }, [movil]);

  function terminarCierre() {
    dialogo.current?.close();
    if (movil) botonMenu.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <nav
        id="navegacion-principal"
        className="site-nav desktop-nav"
        aria-label="Principal"
      >
        {ENLACES.map(({ href, texto }) => (
          <Link
            key={href}
            href={href}
            aria-current={ruta === href ? "page" : undefined}
          >
            {texto}
          </Link>
        ))}
        <Link href="/reservar" className="nav-reserve">
          Reservar mi asesoría <span aria-hidden="true">↗</span>
        </Link>
      </nav>
      <button
        ref={botonMenu}
        className="mobile-menu-button"
        type="button"
        aria-label="Explorar el sitio"
        aria-expanded={abierto}
        aria-controls="menu-movil"
        onClick={() => setAbierto(true)}
      >
        <span>Explorar</span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M4 7h12M4 13h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <dialog
        ref={dialogo}
        id="menu-movil"
        className="mobile-menu-dialog"
        aria-labelledby="menu-titulo"
        onCancel={(event) => {
          event.preventDefault();
          setAbierto(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setAbierto(false);
        }}
      >
        <AnimatePresence onExitComplete={terminarCierre}>
          {abierto ? (
            <motion.div
              key="menu"
              className="mobile-menu-surface"
              initial={{ y: movimiento ? 35 : 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: movimiento ? 20 : 0, opacity: 0 }}
              transition={{
                duration: movimiento ? 0.24 : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="mobile-menu-top">
                <span>
                  LA RUTA <i>DEL INMIGRANTE</i>
                </span>
                <button
                  type="button"
                  autoFocus
                  aria-label="Cerrar menú"
                  onClick={() => setAbierto(false)}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="m6 6 12 12M18 6 6 18"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              </div>
              <h2 id="menu-titulo">
                Tu próximo paso,
                <br />
                <em>a tu ritmo.</em>
              </h2>
              <nav aria-label="Explorar el sitio" className="mobile-menu-links">
                {ENLACES.map(({ href, texto, nota }, index) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={ruta === href ? "page" : undefined}
                    onClick={() => setAbierto(false)}
                  >
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{texto}</strong>
                      <small>{nota}</small>
                    </div>
                    <span aria-hidden="true">↗</span>
                  </Link>
                ))}
              </nav>
              <div className="mobile-menu-session">
                <Image
                  src="/imagenes/henry-utah.webp"
                  alt="Henry Orellana"
                  width={58}
                  height={64}
                />
                <div>
                  <strong>Solo tú y Henry.</strong>
                  <span>{MINUTOS_SESION} min · En español</span>
                </div>
                <strong>
                  ${ASESORIA.precioUsd}
                  <small> USD</small>
                </strong>
              </div>
              <Link
                href="/reservar"
                className="mobile-menu-reserve"
                onClick={() => setAbierto(false)}
              >
                Elegir mi momento <span aria-hidden="true">↗</span>
              </Link>
              <div className="mobile-menu-bottom">
                <span>
                  Desde Utah.
                  <br />
                  Contigo, donde estés.
                </span>
                <ControlMovimiento />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </dialog>
    </>
  );
}

function DockIcon({
  tipo,
}: {
  tipo: "inicio" | "henry" | "asesoria" | "reserva";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tipo === "inicio" ? (
        <path d="m3 10 9-7 9 7v10H3Zm6 10v-7h6v7" />
      ) : tipo === "henry" ? (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
        </>
      ) : tipo === "asesoria" ? (
        <path d="M20 15a3 3 0 0 1-3 3H9l-5 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3ZM8 8h8m-8 5h5" />
      ) : (
        <>
          <rect x="4" y="5" width="16" height="16" rx="3" />
          <path d="M8 3v4m8-4v4M4 11h16m-9 5h4m-2-2v4" />
        </>
      )}
    </svg>
  );
}

export function NavegacionInferior() {
  const ruta = usePathname();
  const movimiento = useMovimiento();
  return (
    <nav className="mobile-dock" aria-label="Navegación móvil">
      {[
        { href: "/", text: "Inicio", icon: "inicio" as const },
        { href: "/henry", text: "Henry", icon: "henry" as const },
        { href: "/asesoria", text: "Asesoría", icon: "asesoria" as const },
      ].map(({ href, text, icon }) => (
        <Link
          href={href}
          key={href}
          aria-current={ruta === href ? "page" : undefined}
          onClick={(event) => {
            if (
              ruta === href &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              window.scrollTo({
                top: 0,
                behavior: movimiento ? "smooth" : "instant",
              });
            }
          }}
        >
          <DockIcon tipo={icon} />
          <span>{text}</span>
        </Link>
      ))}
      <Link
        href="/reservar"
        className="dock-reserve"
        aria-label={"Reservar asesoría por " + ASESORIA.precioUsd + " dólares"}
      >
        <DockIcon tipo="reserva" />
        <span>
          Reservar<small>${ASESORIA.precioUsd} USD</small>
        </span>
      </Link>
    </nav>
  );
}
