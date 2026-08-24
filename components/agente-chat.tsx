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
 * LA GUÍA · con las formas de Mensajes.
 *
 * Burbujas con cola, avatar arriba, las sugerencias donde iOS pone las del
 * teclado y los tres puntos de «escribiendo». Es el patrón que este público
 * usa cien veces al día: no hay nada que aprender.
 *
 * ── El riesgo de parecerse tanto ──
 *
 * Que se espere que conteste como una persona. Y no hay nadie: son
 * respuestas escritas de antemano. Eso se paga en tres sitios y a la vista:
 * bajo el nombre («Respuestas escritas de antemano»), en el pie («toca una
 * pregunta — aquí no se escribe») y en la primera frase que dice.
 *
 * ── Por qué el avatar no es la cara de Henry ──
 *
 * Porque con su cara esto sería hacerse pasar por él. Quien abre un hilo con
 * la foto de alguien da por hecho que lee a ese alguien, y aquí lee un guion.
 * El avatar es una marca sin cara y el nombre es «Guía».
 *
 * ── Los tres puntos no son adorno ──
 *
 * Separan la pregunta de la respuesta. Sin ese medio segundo, tocar un botón
 * y ver aparecer cuatro párrafos de golpe se lee como una página que se
 * recarga, no como alguien que contesta.
 *
 * ── Lo que no sale de aquí ──
 *
 * Nada. No hay red, no hay almacenamiento, no hay registro de qué preguntó
 * quién. La conversación vive en la memoria de la pestaña y desaparece al
 * cerrarla. Con este público —gente con un caso de inmigración abierto— eso
 * no es una omisión, es el requisito.
 */

type Turno =
  | { de: "guia"; dice: string[]; enlaces?: Enlace[] }
  | { de: "quien"; dice: string };

/** Lo que tarda en «escribir» antes de contestar. */
const TECLEANDO_MS = 650;

export function AgenteChat({ abierto, alCerrar }: { abierto: boolean; alCerrar: () => void }) {
  const [turnos, setTurnos] = useState<Turno[]>([{ de: "guia", dice: [SALUDO] }]);
  const [ofrece, setOfrece] = useState<string[]>(PRIMERAS);
  const [tecleando, setTecleando] = useState(false);
  const fondo = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (reloj.current) clearTimeout(reloj.current);
    },
    [],
  );

  /* La conversación baja sola al último turno. `block: "nearest"` para que
     mueva SÓLO este panel: con el ajuste por defecto, el navegador arrastra
     también la página de detrás y la pared se va de sitio. */
  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turnos, tecleando]);

  function preguntar(id: string) {
    const r = respuestaPorId(id);
    if (!r || tecleando) return;

    setTurnos((antes) => [...antes, { de: "quien", dice: r.pregunta }]);
    setTecleando(true);

    reloj.current = setTimeout(() => {
      setTecleando(false);
      setTurnos((antes) => [...antes, { de: "guia", dice: r.dice, enlaces: r.enlaces }]);
      /* Sin `luego` propio, se vuelve a ofrecer todo menos lo que se acaba de
         preguntar: repetir la pregunta recién contestada ocupa sitio y no
         lleva a ninguna parte. */
      setOfrece(
        (r.luego ?? []).length ? r.luego! : RESPUESTAS.map((x) => x.id).filter((x) => x !== id),
      );
    }, TECLEANDO_MS);
  }

  function reiniciar() {
    if (reloj.current) clearTimeout(reloj.current);
    setTecleando(false);
    setTurnos([{ de: "guia", dice: [SALUDO] }]);
    setOfrece(PRIMERAS);
  }

  if (!abierto) return null;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Guía de la página"
      tabIndex={-1}
      /* Crece con la conversación en vez de ocupar tres cuartos de pantalla
         desde el primer mensaje. Un hilo de Mensajes está lleno porque tiene
         historia; éste empieza con una frase, y un panel medio vacío al abrir
         se lee como algo que se rompió. */
      className="msg-hoja fixed inset-x-0 bottom-0 z-40 flex max-h-[76dvh] flex-col overflow-hidden rounded-t-[28px] border-t border-tinta/15 bg-noche-panel/95 backdrop-blur-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[380px] sm:rounded-[28px] sm:border"
    >
      {/* La cabecera de un hilo: quién es, en el centro, y qué es debajo. */}
      <div className="relative flex shrink-0 flex-col items-center border-b border-tinta/10 px-4 pb-3 pt-3">
        <button
          type="button"
          onClick={alCerrar}
          className="absolute left-3 top-1/2 min-h-[44px] -translate-y-1/2 px-1 text-[16px] text-agua"
        >
          Cerrar
        </button>

        {turnos.length > 1 ? (
          <button
            type="button"
            onClick={reiniciar}
            aria-label="Volver al principio"
            className="absolute right-3 top-1/2 flex size-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-tinta/10 text-tinta/70"
          >
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </button>
        ) : null}

        {/* Sin cara. Ver «Por qué el avatar no es la cara de Henry». */}
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-full border border-tinta/15 bg-tinta/[0.07] text-oro"
        >
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
          </svg>
        </span>
        <span className="mt-1.5 text-[15px] font-semibold">Guía</span>
        <span className="text-[12px] text-tinta/55">Respuestas escritas de antemano</span>
      </div>

      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto px-4 py-4">
        {turnos.map((t, i) =>
          t.de === "quien" ? (
            <p
              key={i}
              className="msg-entra msg-mio relative max-w-[78%] self-end rounded-[20px] bg-agua px-4 py-2.5 text-[15px] font-medium leading-[1.4] text-noche"
            >
              {t.dice}
            </p>
          ) : (
            <div key={i} className="flex max-w-[86%] flex-col gap-2 self-start">
              {t.dice.map((parrafo, n) => (
                <p
                  key={n}
                  className={`msg-entra relative rounded-[20px] bg-tinta/10 px-4 py-2.5 text-[15px] leading-[1.5] text-oro ${
                    n === t.dice.length - 1 ? "msg-guia" : ""
                  }`}
                  style={{ animationDelay: `${n * 90}ms` }}
                >
                  {parrafo}
                </p>
              ))}
              {t.enlaces?.map((e) => <Boton key={e.href} enlace={e} />)}
            </div>
          ),
        )}

        {tecleando ? (
          <div
            role="status"
            aria-label="Escribiendo"
            className="msg-entra msg-guia relative flex gap-1.5 self-start rounded-[20px] bg-tinta/10 px-4 py-3.5"
          >
            <span className="msg-punto size-[7px] rounded-full bg-tinta/80" />
            <span className="msg-punto size-[7px] rounded-full bg-tinta/80" />
            <span className="msg-punto size-[7px] rounded-full bg-tinta/80" />
          </div>
        ) : null}

        <div ref={fondo} />
      </div>

      {/* Las preguntas, TODAS a la vista.
          Estaban en una fila que se deslizaba —como las sugerencias del
          teclado de iOS— y de cinco se veían dos y media: nadie descubre por
          su cuenta que hay más a la derecha, así que la mitad del guion no
          existía. Ahora es una rejilla de dos y se ven las cinco sin mover
          nada.

          Cuando el número es impar, la PRIMERA ocupa el ancho entero. Así la
          rejilla nunca deja un hueco, y de paso la que encabeza cada tanda es
          siempre la que orienta: «¿Cuál me toca?» al empezar, «¿Cómo se
          paga?» dentro de la preparación.

          Y cada servicio lleva el punto de su color. Es lo que ata el botón
          al cuadro de la pared: quien vio pasar la luz malva por el borde de
          «Servicio Migratorio» reconoce el punto malva sin leer. */}
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-tinta/10 px-4 py-3">
        {ofrece.map((id, i) => {
          const r = respuestaPorId(id);
          if (!r) return null;
          const ancha = ofrece.length % 2 === 1 && i === 0;
          return (
            <button
              key={id}
              type="button"
              onClick={() => preguntar(id)}
              disabled={tecleando}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-tinta/10 px-3 text-center text-[14.5px] leading-[1.25] text-tinta transition-opacity active:bg-tinta/20 disabled:opacity-40 ${
                ancha ? "col-span-2" : ""
              } ${r.tono ? `tono-${r.tono}` : ""}`}
            >
              {r.tono ? (
                <span
                  aria-hidden="true"
                  className="size-[7px] shrink-0 rounded-full"
                  style={{ background: "rgb(var(--tono))" }}
                />
              ) : null}
              {r.corto}
            </button>
          );
        })}
      </div>

      {/* Al 45% medía 4,23:1 y el mínimo es 4,5. Es la línea que dice que
          aquí no hay nadie escribiendo: la que menos puede permitirse pasar
          desapercibida. */}
      <p className="shrink-0 pb-4 pt-2.5 text-center text-[12.5px] text-tinta/60">
        Toca una pregunta — aquí no se escribe
      </p>
    </div>
  );
}

/** El botón de una respuesta: dentro del sitio con `Link`, fuera con `<a>`. */
function Boton({ enlace }: { enlace: Enlace }) {
  const clases =
    "msg-entra flex min-h-[44px] items-center self-start rounded-full border border-agua/40 bg-agua/15 px-[18px] text-[15px] font-semibold text-agua";

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
