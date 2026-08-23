"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SERVICIOS } from "@/lib/servicios";

/**
 * LAS TRES PREPARACIONES, EN UNA HOJA.
 *
 * Se abre desde la pared de enlaces. Tres opciones, tres precios y una sola
 * agenda detrás: da igual cuál se elija, la hora queda ocupada para las
 * tres.
 *
 * ── Por qué una hoja y no otra pantalla ──
 *
 * Porque elegir entre tres cosas no merece perder el sitio. Quien llega
 * aquí viene de una biografía de Instagram y todavía no sabe si le
 * interesa; mandarlo a otra página para enseñarle una lista de tres líneas
 * es pedirle que se comprometa antes de haber visto nada. La hoja enseña
 * las tres, se cierra deslizando y deja la pared donde estaba.
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
          <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-tinta/25" />

          <div className="mt-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="hoja-titulo" className="font-titulo text-[26px] font-normal leading-[1.15]">
                ¿Para qué audiencia?
              </h2>
              <p className="mt-1.5 text-[15px] leading-[1.45] text-tinta/60">
                Cada preparación tiene su precio. La agenda es la misma para las
                tres.
              </p>
            </div>

            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tinta/10 text-tinta/70"
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

          {/* Las tres, en una lista con separadores de un pelo: es la forma
              que tiene iOS de decir «esto es un grupo de opciones del mismo
              rango», y evita tres tarjetas compitiendo entre ellas. */}
          <div className="mt-6 overflow-hidden rounded-2xl bg-tinta/[0.06]">
            {SERVICIOS.map((s, i) => (
              <Link
                key={s.id}
                href={`/reservar?servicio=${s.id}`}
                onClick={cerrar}
                className={
                  i === 0
                    ? "flex min-h-[68px] items-center gap-4 px-4 py-3"
                    : "flex min-h-[68px] items-center gap-4 border-t border-tinta/10 px-4 py-3"
                }
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold tracking-[-0.01em]">
                    {s.nombre}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-tinta/55">{s.etapa}</span>
                </span>

                <span className="shrink-0 text-[19px] font-bold tabular-nums text-agua">
                  ${s.precioUsd}
                </span>

                <span aria-hidden="true" className="shrink-0 text-tinta/40">
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
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[14px] leading-[1.45] text-tinta/45">
            45 minutos uno a uno con Henry. Se paga después de apartar la hora.
          </p>
        </div>
      </dialog>
    </>
  );
}
