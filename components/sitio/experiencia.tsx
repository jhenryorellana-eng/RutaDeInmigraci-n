"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";

const Movimiento = createContext(false);
let pausado = false;
const observadores = new Set<() => void>();
function suscribirPausa(callback: () => void) {
  observadores.add(callback);
  return () => {
    observadores.delete(callback);
  };
}
function cambiarPausa() {
  pausado = !pausado;
  observadores.forEach((callback) => callback());
}
function suscribirPreferencia(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const leerPausa = () => pausado;
const leerPreferencia = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const servidorPausa = () => false;
const servidorPreferencia = () => true;

export function useMovimiento() {
  return useContext(Movimiento);
}

export function ExperienciaSitio({
  children,
  reserva = false,
}: {
  children: React.ReactNode;
  reserva?: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const ruta = usePathname();
  const pausa = useSyncExternalStore(suscribirPausa, leerPausa, servidorPausa);
  const reducido = useSyncExternalStore(
    suscribirPreferencia,
    leerPreferencia,
    servidorPreferencia,
  );
  const activo = !reserva && !pausa && !reducido;

  useEffect(() => {
    if (!activo || !contenedor.current) return;
    let cancelado = false;
    let limpiar: (() => void) | undefined;
    const elemento = contenedor.current;
    // The booking flow keeps native scrolling; the animation engine is loaded
    // only for the editorial pages. Server-rendered content is always visible.
    import("./animaciones")
      .then(({ iniciarAnimaciones }) => {
        if (!cancelado) limpiar = iniciarAnimaciones(elemento);
      })
      .catch(() => {
        // A failed enhancement must never hide content or block navigation.
      });
    return () => {
      cancelado = true;
      limpiar?.();
    };
  }, [activo, ruta]);

  return (
    <Movimiento.Provider value={activo}>
      <MotionConfig reducedMotion="user">
        <div
          ref={contenedor}
          className={`asesoria-site ${reserva ? "is-booking" : ""}`}
          data-motion={activo ? "on" : "off"}
        >
          {!reserva ? (
            <div className="reading-progress" aria-hidden="true">
              <span />
            </div>
          ) : null}
          {children}
        </div>
      </MotionConfig>
    </Movimiento.Provider>
  );
}

export function ControlMovimiento() {
  const pausa = useSyncExternalStore(suscribirPausa, leerPausa, servidorPausa);
  const reducido = useSyncExternalStore(
    suscribirPreferencia,
    leerPreferencia,
    servidorPreferencia,
  );
  return (
    <button
      type="button"
      className="motion-control"
      onClick={cambiarPausa}
      disabled={reducido}
      aria-pressed={!pausa && !reducido}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {pausa || reducido ? (
          <path d="m5 3 8 5-8 5Z" />
        ) : (
          <path d="M4 3h2v10H4zm6 0h2v10h-2z" />
        )}
      </svg>
      {reducido
        ? "Movimiento reducido"
        : pausa
          ? "Activar efectos"
          : "Pausar efectos"}
    </button>
  );
}
