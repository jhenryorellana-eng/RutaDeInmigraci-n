"use client";

import { useState, useTransition } from "react";

import { anadirTramo, quitarTramo } from "@/app/panel/acciones";
import { horaSuelta, nombreDiaSemana } from "@/lib/horario";
import type { TramoConId } from "@/lib/tramos";

/**
 * LOS TRAMOS DE CADA DÍA.
 *
 * Un día tiene VARIOS tramos, no una hora de entrada y otra de salida. Ésa
 * es toda la idea: «de 8 a 1 y de 3 a 5» son dos tramos con un agujero en
 * medio, y ese agujero es lo que antes no se podía decir.
 *
 * Un tramo es `[desde, hasta)`: la hora de cierre no se ofrece, porque una
 * sesión que empezara ahí acabaría cuarenta y cinco minutos después de
 * cerrar. Eso sale escrito debajo de cada tramo en vez de dejarlo a que
 * alguien lo deduzca contando huecos en el calendario.
 */

const DIAS = [1, 2, 3, 4, 5, 6, 7];
const HORAS = Array.from({ length: 24 }, (_, i) => i);

export function EditorHorario({ tramos }: { tramos: TramoConId[] }) {
  const [abierto, setAbierto] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();

  const vacio = tramos.length === 0;

  return (
    <section>
      <h1 className="font-titulo text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-[34px]">
        Cuándo estás
      </h1>
      <p className="mt-2.5 max-w-[62ch] text-[17px] leading-[1.5] text-tinta-suave">
        Esto vale para todas las semanas. Un día puede tener varios tramos: si
        por la tarde no estás de 1 a 3, se pone en dos tramos y ese rato deja
        de ofrecerse.
      </p>

      {vacio ? (
        <p className="mt-5 rounded-2xl border border-aviso/30 bg-aviso/10 px-5 py-3.5 text-[16px] text-aviso">
          Ahora mismo no hay ningún tramo abierto, así que el sitio no ofrece
          ninguna hora a nadie.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-5 text-[16px] text-aviso">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {DIAS.map((dia) => {
          const suyos = tramos
            .filter((t) => t.diaSemana === dia)
            .sort((a, b) => a.desdeHora - b.desdeHora);
          const cerrado = suyos.length === 0;

          return (
            <div
              key={dia}
              className={
                cerrado
                  ? "rounded-[20px] border border-white/10 px-5 py-4"
                  : "rounded-[20px] border border-white/12 bg-panel px-5 py-4"
              }
            >
              <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                <span
                  className={
                    cerrado
                      ? "w-[7rem] shrink-0 pt-2 text-[18px] font-extrabold capitalize text-tinta-tenue"
                      : "w-[7rem] shrink-0 pt-2 text-[18px] font-extrabold capitalize"
                  }
                >
                  {nombreDiaSemana(dia)}
                </span>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                  {suyos.map((t) => (
                    <span
                      key={t.id}
                      className="flex min-h-11 items-center gap-3 rounded-full border border-acento/45 bg-acento/[0.16] py-1 pl-4 pr-1.5"
                    >
                      <span className="text-[16px] tabular-nums">
                        {horaSuelta(t.desdeHora)} – {horaSuelta(t.hastaHora)}
                      </span>
                      <button
                        type="button"
                        disabled={enCurso}
                        aria-label={`Quitar el tramo de ${horaSuelta(t.desdeHora)} a ${horaSuelta(t.hastaHora)} del ${nombreDiaSemana(dia)}`}
                        onClick={() =>
                          empezar(async () => {
                            setError(null);
                            const r = await quitarTramo(t.id);
                            if (!r.ok) setError(r.motivo);
                          })
                        }
                        className="flex size-8 items-center justify-center rounded-full bg-fondo/40 text-tinta-suave disabled:opacity-50"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}

                  {cerrado ? (
                    <span className="text-[16px] text-tinta-tenue">Cerrado</span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setAbierto(abierto === dia ? null : dia);
                    }}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-dashed border-white/28 px-4 text-[15px] text-tinta-suave"
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
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {cerrado ? `Abrir los ${nombreDiaSemana(dia)}` : "Añadir tramo"}
                  </button>
                </div>
              </div>

              {abierto === dia ? (
                <NuevoTramo
                  dia={dia}
                  ocupado={enCurso}
                  onCancelar={() => setAbierto(null)}
                  onGuardar={(desde, hasta) =>
                    empezar(async () => {
                      setError(null);
                      const r = await anadirTramo(dia, desde, hasta);
                      if (r.ok) setAbierto(null);
                      else setError(r.motivo);
                    })
                  }
                />
              ) : null}

              {suyos.length > 0 ? (
                <p className="mt-3 text-[15px] text-tinta-tenue sm:ml-[7rem] sm:pl-5">
                  Se ofrecen las {listaDeHoras(suyos)}.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-[16px] text-tinta-tenue">
        Los cambios se ven al momento en el sitio. No hace falta guardar nada.
      </p>
    </section>
  );
}

/** «8:00, 9:00, 10:00, 11:00 y 12:00» — las horas que ese día ofrece. */
function listaDeHoras(tramos: TramoConId[]): string {
  const horas: number[] = [];
  for (const t of tramos) {
    for (let h = t.desdeHora; h < t.hastaHora; h += 1) horas.push(h);
  }
  const textos = horas.map(horaSuelta);
  if (textos.length === 1) return textos[0];
  return `${textos.slice(0, -1).join(", ")} y ${textos[textos.length - 1]}`;
}

function NuevoTramo({
  dia,
  ocupado,
  onCancelar,
  onGuardar,
}: {
  dia: number;
  ocupado: boolean;
  onCancelar: () => void;
  onGuardar: (desde: number, hasta: number) => void;
}) {
  const [desde, setDesde] = useState(15);
  const [hasta, setHasta] = useState(17);

  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-2xl bg-fondo/50 px-4 py-3.5 sm:ml-[7rem]">
      <label className="flex items-center gap-2.5">
        <span className="text-[16px] text-tinta-suave">De</span>
        <select
          value={desde}
          onChange={(e) => setDesde(Number(e.target.value))}
          aria-label={`Hora de apertura del nuevo tramo del ${nombreDiaSemana(dia)}`}
          className="min-h-12 min-w-[7rem] rounded-xl border border-white/28 bg-fondo px-3 text-[16px] text-tinta tabular-nums outline-none"
        >
          {HORAS.map((h) => (
            <option key={h} value={h}>
              {horaSuelta(h)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2.5">
        <span className="text-[16px] text-tinta-suave">a</span>
        <select
          value={hasta}
          onChange={(e) => setHasta(Number(e.target.value))}
          aria-label={`Hora de cierre del nuevo tramo del ${nombreDiaSemana(dia)}`}
          className="min-h-12 min-w-[7rem] rounded-xl border border-white/28 bg-fondo px-3 text-[16px] text-tinta tabular-nums outline-none"
        >
          {HORAS.slice(1).concat(24).map((h) => (
            <option key={h} value={h}>
              {horaSuelta(h)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        disabled={ocupado}
        onClick={() => onGuardar(desde, hasta)}
        className="min-h-12 rounded-full bg-acento px-6 text-[15px] font-extrabold text-fondo disabled:opacity-50"
      >
        Añadir
      </button>
      <button
        type="button"
        onClick={onCancelar}
        className="min-h-12 px-3 text-[15px] text-tinta-suave"
      >
        Cancelar
      </button>

      <p className="w-full text-[15px] text-tinta-tenue">
        La última sesión empieza a las {horaSuelta(Math.max(desde, hasta - 1))}: la
        hora de cierre no se ofrece, porque una sesión que empezara ahí acabaría
        45 minutos después.
      </p>
    </div>
  );
}
