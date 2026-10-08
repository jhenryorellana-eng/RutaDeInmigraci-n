"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AUDIENCIAS, MINUTOS_SESION } from "@/lib/servicios";

/**
 * LA RUTA DEL INMIGRANTE, EN UNA HOJA.
 *
 * Se abre desde la tarjeta de La ruta en la pared de enlaces, y es la
 * entrada a todo lo de la audiencia: se elige la preparación y de ahí se
 * pasa a las horas libres y a la reserva. Arriba lleva la marca del sitio
 * —la flecha y el nombre, como su cabecera— para que quien toca sepa que
 * ya está dentro de La ruta y no en otro sitio.
 *
 * Una opción por audiencia, cada una con su precio y una sola agenda
 * detrás: da igual cuál se elija, la hora queda ocupada para todas.
 *
 * ── Por qué una hoja y no otra pantalla ──
 *
 * Porque elegir entre dos cosas no merece perder el sitio. Quien llega
 * aquí viene de una biografía de Instagram y todavía no sabe si le
 * interesa; mandarlo a otra página para enseñarle una lista de dos líneas
 * es pedirle que se comprometa antes de haber visto nada. La hoja enseña
 * las dos, se cierra deslizando y deja la pared donde estaba. Quien quiere
 * conocer antes a Henry tiene su página a un toque, debajo.
 *
 * ── Por qué `<dialog>` ──
 *
 * Porque trae hecho lo que se suele olvidar: el foco atrapado dentro, el
 * Escape, el fondo inerte para el lector de pantalla y el papel de diálogo.
 * Un `<div>` con `position: fixed` parece lo mismo y deja el foco paseando
 * por detrás de la hoja.
 */

export function HojaServicios({ children }: { children: React.ReactNode }) {
  const hoja = useRef<HTMLDialogElement>(null);
  const [abierta, setAbierta] = useState(false);

  function abrir() {
    setAbierta(true);
    hoja.current?.showModal();
  }

  function cerrar() {
    setAbierta(false);
    hoja.current?.close();
  }

  /* Cerrar tocando fuera. El `<dialog>` no lo hace solo, y en una hoja de
     iOS tocar el velo es LA forma de cerrarla — quien lo intenta y no pasa
     nada da por hecho que se ha quedado atascada.

     Se compara contra el propio dialog porque el elemento ocupa toda la
     pantalla incluido el velo: los toques en la hoja los para el `<div>` de
     dentro. */
  useEffect(() => {
    const d = hoja.current;
    if (!d) return;

    const tocarFuera = (e: MouseEvent) => {
      if (e.target === d) cerrar();
    };
    const alCerrar = () => setAbierta(false);

    d.addEventListener("click", tocarFuera);
    d.addEventListener("close", alCerrar);
    return () => {
      d.removeEventListener("click", tocarFuera);
      d.removeEventListener("close", alCerrar);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-haspopup="dialog"
        aria-expanded={abierta}
        className="w-full text-left"
      >
        {children}
      </button>

      <dialog ref={hoja} className="hoja" aria-labelledby="hoja-titulo">
        <div className="mx-auto w-full max-w-[30rem] rounded-t-[28px] border-t border-tinta/12 bg-noche-panel/95 px-5 pb-8 pt-3 backdrop-blur-2xl">
          {/* El asa. No hace nada por sí sola —cerrar es tocar fuera o el
              botón— pero es lo que dice «esto es una hoja» antes de leer
              una palabra. */}
          <div
            aria-hidden="true"
            className="mx-auto h-1 w-9 rounded-full bg-tinta/35"
          />

          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {/* La marca, como en la cabecera del sitio: dice dónde se está. */}
              <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-tinta/80">
                <MarcaRuta className="size-[18px] text-oro" />
                La ruta del inmigrante
              </p>
              <h2
                id="hoja-titulo"
                className="mt-3 font-titulo text-[28px] font-normal leading-[1.1]"
              >
                Prepara tu audiencia
              </h2>
              <p className="mt-2 text-[15px] leading-[1.45] text-tinta/75">
                Elige cuál vas a preparar y verás las horas libres de Henry.
              </p>
            </div>

            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tinta/15 text-tinta/85"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Las opciones, en una lista con separadores de un pelo: es la forma
              que tiene iOS de decir «esto es un grupo de opciones del mismo
              rango», y evita tarjetas compitiendo entre ellas. */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-tinta/[0.06] ring-1 ring-oro/15">
            {AUDIENCIAS.map((s, i) => (
              <Link
                key={s.id}
                href={`/reservar?servicio=${s.id}`}
                onClick={cerrar}
                className={`flex min-h-[72px] items-center gap-4 px-4 py-3 transition-colors hover:bg-tinta/[0.05] ${
                  i > 0 ? "border-t border-tinta/10" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold tracking-[-0.01em]">
                    {s.nombre}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-tinta/70">
                    {s.etapa} · {MINUTOS_SESION} min con Henry
                  </span>
                </span>

                <span className="shrink-0 text-[20px] font-bold tabular-nums text-oro">
                  ${s.precioUsd}
                </span>

                <Chevron />
              </Link>
            ))}
          </div>

          {/* Para quien quiere saber con quién va a hablar antes de elegir. */}
          <Link
            href="/"
            onClick={cerrar}
            className="mt-3 flex min-h-[56px] items-center gap-3.5 rounded-2xl bg-tinta/[0.04] px-4 py-3 transition-colors hover:bg-tinta/[0.07]"
          >
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-oro/12 text-oro"
            >
              <MarcaRuta className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-[15px] font-semibold">
              Conoce a Henry y cómo trabaja
            </span>
            <Chevron />
          </Link>

          <p className="mt-4 text-[13.5px] leading-[1.45] text-tinta/60">
            La reserva se confirma al verificar el pago.
          </p>
        </div>
      </dialog>
    </>
  );
}

/** La flecha de la marca, la misma de la cabecera del sitio. */
function MarcaRuta({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 42 42"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 36 36 4M4 4h32v32" />
      <path d="M4 21V4h17" />
    </svg>
  );
}

function Chevron() {
  return (
    <span aria-hidden="true" className="shrink-0 text-tinta/55">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </span>
  );
}
