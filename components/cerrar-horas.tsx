"use client";

import { useState, useTransition } from "react";

import { cerrar, reabrir } from "@/app/panel/acciones";
import { fechaLarga, horaEnZona } from "@/lib/horario";

/**
 * ABRIR Y CERRAR HORAS.
 *
 * El horario base corre solo. Aquí sólo se toca la excepción — y la
 * excepción real es «el viernes no estoy», no cerrar horas sueltas. Por eso
 * «Todo el día» es lo primero y el tramo de horas es un extra plegado.
 */

type Cierre = { id: number; inicia_en: string; termina_en: string; nota: string | null };

const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export function CerrarHoras({ cierres }: { cierres: Cierre[] }) {
  const [enCurso, empezar] = useTransition();
  const [dia, setDia] = useState("");
  const [todoElDia, setTodoElDia] = useState(true);
  const [desde, setDesde] = useState(8);
  const [hasta, setHasta] = useState(17);
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enviar() {
    setError(null);
    empezar(async () => {
      const r = await cerrar(dia, todoElDia ? null : desde, todoElDia ? null : hasta, nota);
      if (r.ok) {
        setDia("");
        setNota("");
      } else {
        setError(r.motivo);
      }
    });
  }

  return (
    <aside>
      <h2 className="font-titulo text-[24px] font-semibold leading-[1.2]">
        Abrir y cerrar horas
      </h2>
      <p className="mt-2 text-[15px] leading-[1.45] text-tinta-tenue">
        El horario de siempre corre solo: lunes a viernes de 8 a 5 y sábados de
        8 a 1. Aquí sólo se marca lo que se sale de eso.
      </p>

      <div className="mt-5 flex flex-col gap-3 rounded-[20px] border border-white/12 p-5">
        <label className="block">
          <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
            Qué día
          </span>
          <input
            type="date"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="mt-2 min-h-[48px] w-full rounded-xl border border-white/25 bg-fondo px-3 text-[16px] text-tinta outline-none"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={todoElDia}
            onClick={() => setTodoElDia(true)}
            className={
              todoElDia
                ? "min-h-11 flex-1 rounded-xl border-2 border-acento bg-acento/15 text-[15px] font-bold"
                : "min-h-11 flex-1 rounded-xl border border-white/25 text-[15px]"
            }
          >
            Todo el día
          </button>
          <button
            type="button"
            aria-pressed={!todoElDia}
            onClick={() => setTodoElDia(false)}
            className={
              !todoElDia
                ? "min-h-11 flex-1 rounded-xl border-2 border-acento bg-acento/15 text-[15px] font-bold"
                : "min-h-11 flex-1 rounded-xl border border-white/25 text-[15px]"
            }
          >
            Sólo un rato
          </button>
        </div>

        {!todoElDia ? (
          <div className="flex items-center gap-2">
            <Selector valor={desde} onCambio={setDesde} etiqueta="Desde" />
            <span className="text-tinta-tenue">a</span>
            <Selector valor={hasta} onCambio={setHasta} etiqueta="Hasta" />
          </div>
        ) : null}

        <label className="block">
          <span className="sr-only">Nota</span>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota para ti (opcional)"
            className="min-h-[48px] w-full rounded-xl bg-white/[0.07] px-3 text-[16px] outline-none placeholder:text-tinta-tenue"
          />
        </label>

        {error ? (
          <p role="alert" className="text-[15px] text-aviso">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={enviar}
          disabled={enCurso || !dia}
          className="min-h-[48px] rounded-xl bg-white/[0.10] text-[15px] font-bold disabled:opacity-40"
        >
          {enCurso ? "Cerrando…" : "Cerrar esas horas"}
        </button>
      </div>

      <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
        Cerrado ahora mismo
      </p>

      {cierres.length === 0 ? (
        <p className="mt-2 text-[15px] text-tinta-tenue">
          Nada cerrado. Todo el horario está abierto.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {cierres.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block text-[15px] first-letter:uppercase">
                  {fechaLarga(new Date(c.inicia_en))}
                </span>
                <span className="block text-[14px] text-tinta-tenue">
                  {esDiaCompleto(c)
                    ? "todo el día"
                    : `${horaEnZona(new Date(c.inicia_en))} – ${horaEnZona(new Date(c.termina_en))}`}
                  {c.nota ? ` · ${c.nota}` : ""}
                </span>
              </span>
              <form
                action={async () => {
                  await reabrir(c.id);
                }}
              >
                <button className="min-h-11 shrink-0 text-[14px] text-acento underline underline-offset-4">
                  Reabrir
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

/** Un cierre de 24 horas o más se cuenta como día completo. */
function esDiaCompleto(c: Cierre): boolean {
  const horas =
    (new Date(c.termina_en).getTime() - new Date(c.inicia_en).getTime()) / 3_600_000;
  return horas >= 23;
}

function Selector({
  valor,
  onCambio,
  etiqueta,
}: {
  valor: number;
  onCambio: (v: number) => void;
  etiqueta: string;
}) {
  return (
    <label className="flex-1">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        className="min-h-[48px] w-full rounded-xl border border-white/25 bg-fondo px-3 text-[16px] text-tinta outline-none"
      >
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}:00
          </option>
        ))}
      </select>
    </label>
  );
}
