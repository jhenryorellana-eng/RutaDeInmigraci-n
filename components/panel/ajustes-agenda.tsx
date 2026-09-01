"use client";

import { useState } from "react";

import { CerrarHoras } from "@/components/cerrar-horas";
import { AvisoMovil } from "@/components/panel/aviso-movil";
import { EditorHorario } from "@/components/panel/editor-horario";
import { describirHorario, type Tramo } from "@/lib/horario";
import type { TramoConId } from "@/lib/tramos";

/**
 * LO QUE SE TOCA UNA VEZ CADA MUCHO.
 *
 * Antes esto era una pantalla entera —«Mi horario»— y ése era el problema:
 * mezclaba tres cosas que no tienen que ver entre sí, y obligaba a cambiar
 * de pantalla para responder preguntas que se hacen mirando la semana.
 *
 * Dos de las tres ya las hace mejor el calendario arrastrando: cerrar horas
 * y apuntar cosas. Lo que queda aquí es lo que de verdad no cabía en la
 * rejilla:
 *
 *   · las horas que se ofrecen TODAS las semanas;
 *   · los cierres largos, que pueden caer en semanas que no se ven;
 *   · el aviso al teléfono, que no es horario sino un ajuste.
 *
 * ── Por qué va cerrado y con un resumen ──
 *
 * Porque lo que se hace todos los días es mirar la semana, y lo que se hace
 * dos veces al año es cambiar el horario. Una pantalla que enseña las dos
 * cosas con el mismo peso hace que la frecuente cueste más de encontrar.
 *
 * El resumen de una línea es lo que hace que estar cerrado no sea esconder:
 * «De lunes a miércoles, de 13:00 a 17:00…» se lee sin abrir nada, y si eso
 * es lo que esperaba, no hay nada que abrir.
 *
 * ── Y por qué el horario semanal NO se edita desde la rejilla ──
 *
 * Es la tentación obvia —tocar un martes a las 12 y que se abra— y es la
 * forma más rápida de cerrar todos los viernes del año queriendo cerrar
 * uno. Un toque de más en la semana no puede cambiar todas las semanas, así
 * que eso vive aquí, con su propio título y sus propios botones.
 */
export function AjustesAgenda({
  tramos,
  cierres,
  clavePublica,
}: {
  tramos: TramoConId[];
  cierres: { id: number; inicia_en: string; termina_en: string; nota: string | null }[];
  clavePublica: string;
}) {
  const [abierto, setAbierto] = useState(false);

  /* El mismo texto que ve quien va a reservar. Si el resumen y la realidad
     se separaran, este panel mentiría — y aquí se lee lo mismo que allí. */
  const enUnaFrase = describirHorario(tramos as readonly Tramo[]);

  return (
    <section className="mt-9 rounded-[20px] border border-white/12">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold">Mis horas y mis ausencias</span>
          <span className="mt-0.5 block truncate text-[15px] text-tinta-tenue">
            {enUnaFrase || "No hay ningún tramo abierto: el sitio no ofrece horas."}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={
            abierto
              ? "shrink-0 rotate-180 text-tinta-tenue transition-transform"
              : "shrink-0 text-tinta-tenue transition-transform"
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {abierto ? (
        <div className="grid gap-9 border-t border-white/12 px-5 py-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <EditorHorario tramos={tramos} />

          <div>
            {/* La regla escrita donde se toma la decisión, no en el README. */}
            <div className="rounded-[20px] border border-aviso/30 bg-aviso/[0.09] px-5 py-4">
              <p className="text-[16px] font-extrabold text-aviso">
                Las citas ya pagadas siguen en pie
              </p>
              <p className="mt-2 text-[16px] leading-[1.45] text-tinta-suave">
                Cerrar horas sólo quita lo que todavía está libre. Si alguien ya
                pagó las 4 de un jueves, esa hora se queda suya aunque cierres
                la tarde entera.
              </p>
            </div>

            <div className="mt-7">
              <CerrarHoras cierres={cierres} />
            </div>

            <div className="mt-7">
              <AvisoMovil clavePublica={clavePublica} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
