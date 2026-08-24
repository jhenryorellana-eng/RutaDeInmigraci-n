"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  PRIMERAS,
  RESPUESTAS,
  SALUDO,
  respuestaPorId,
  type Enlace,
} from "@/lib/guia-respuestas";

/**
 * EL CHAT DEL GUÍA.
 *
 * Preguntas escritas de antemano, respuestas escritas de antemano. No hay
 * casilla donde escribir, y es a propósito: una casilla vacía promete que
 * alguien va a entender lo que le escribas, y aquí no hay nadie al otro
 * lado. Tocar una pregunta y recibir su respuesta no promete nada que no
 * pueda cumplir.
 *
 * ── Lo que no sale de aquí ──
 *
 * Nada. No hay red, no hay almacenamiento, no hay registro de qué preguntó
 * quién. La conversación vive en la memoria de la pestaña y desaparece al
 * cerrarla. Con este público —gente con un caso de inmigración abierto— eso
 * no es una omisión, es el requisito.
 *
 * ── Por qué el cuerpo va a 15px ──
 *
 * Porque esto son párrafos que hay que leer, no rótulos. A 14px cabía más
 * conversación en pantalla y se leía peor: el sitio se abre en la calle, con
 * el sol de cara y a veces con vista cansada.
 *
 * ── La salida ──
 *
 * Toda rama termina pudiendo llegar a Henry. Un guion cerrado sin salida es
 * un callejón: quien trae una pregunta que no está prevista se queda mirando
 * cinco botones que no le sirven.
 */

type Turno =
  | { de: "guia"; dice: string[]; enlaces?: Enlace[] }
  | { de: "quien"; dice: string };

export function AgenteChat({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const [turnos, setTurnos] = useState<Turno[]>([{ de: "guia", dice: [SALUDO] }]);
  const [ofrece, setOfrece] = useState<string[]>(PRIMERAS);
  const fondo = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /* Al abrir, el foco entra en el panel. Sin esto, quien navega con teclado
     abre el chat y sigue tabulando por la pared de detrás sin enterarse de
     que hay algo abierto. */
  useEffect(() => {
    if (abierto) panel.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const teclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [abierto, alCerrar]);

  /* La conversación baja sola al último turno. `block: "nearest"` para que
     mueva SÓLO este panel: con el ajuste por defecto, el navegador arrastra
     también la página de detrás y la pared se va de sitio. */
  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turnos]);

  function preguntar(id: string) {
    const r = respuestaPorId(id);
    if (!r) return;
    setTurnos((antes) => [
      ...antes,
      { de: "quien", dice: r.pregunta },
      { de: "guia", dice: r.dice, enlaces: r.enlaces },
    ]);
    /* Sin `luego` propio, se vuelve a ofrecer todo menos lo que se acaba de
       preguntar: repetir la pregunta recién contestada ocupa sitio y no
       lleva a ninguna parte. */
    setOfrece((r.luego ?? []).length ? r.luego! : RESPUESTAS.map((x) => x.id).filter((x) => x !== id));
  }

  if (!abierto) return null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Guía de la página"
      tabIndex={-1}
      className="fixed inset-x-3 bottom-3 z-40 flex max-h-[76dvh] flex-col overflow-hidden rounded-3xl border border-agua/25 bg-noche-panel shadow-[0_0_30px_rgba(159,232,216,.16),0_20px_60px_rgba(0,0,0,.6)] sm:left-auto sm:w-[352px]"
    >
      <div className="flex items-center gap-2.5 border-b border-tinta/10 px-4 py-3">
        <span className="size-2 shrink-0 rounded-full bg-agua" aria-hidden="true" />
        <span className="flex-1 text-[15px] font-semibold">Guía</span>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar la guía"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tinta/10 text-tinta/80"
        >
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {turnos.map((t, i) =>
            t.de === "quien" ? (
              <p
                key={i}
                className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-agua/15 px-3.5 py-2.5 text-[15px] leading-[1.4] text-tinta"
              >
                {t.dice}
              </p>
            ) : (
              <div key={i} className="flex max-w-[92%] flex-col gap-2 self-start">
                {t.dice.map((parrafo, n) => (
                  <p
                    key={n}
                    className="rounded-2xl rounded-bl-md bg-tinta/[0.07] px-3.5 py-2.5 text-[15px] leading-[1.5] text-tinta/90"
                  >
                    {parrafo}
                  </p>
                ))}
                {t.enlaces?.map((e) => <Boton key={e.href} enlace={e} />)}
              </div>
            ),
          )}
        </div>
        <div ref={fondo} />
      </div>

      {/* Las preguntas. Son botones y no una casilla: lo que se puede
          preguntar se ve, en vez de adivinarse. */}
      <div className="flex flex-wrap gap-2 border-t border-tinta/10 px-4 py-3.5">
        {ofrece.map((id) => {
          const r = respuestaPorId(id);
          if (!r) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => preguntar(id)}
              className="min-h-[44px] rounded-full border border-agua/30 px-3.5 text-[14px] font-medium text-agua transition-colors active:bg-agua/15"
            >
              {r.pregunta}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** El botón de una respuesta: dentro del sitio con `Link`, fuera con `<a>`. */
function Boton({ enlace }: { enlace: Enlace }) {
  const clases =
    "flex min-h-[44px] items-center justify-center rounded-full bg-agua px-4 text-[15px] font-bold text-noche";

  return enlace.interno ? (
    <Link href={enlace.href} className={clases}>
      {enlace.texto}
    </Link>
  ) : (
    <a href={enlace.href} target="_blank" rel="noopener noreferrer" className={clases}>
      {enlace.texto}
    </a>
  );
}
