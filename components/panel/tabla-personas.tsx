"use client";

import { useMemo, useState } from "react";

/**
 * EL ARCHIVO DE QUIEN HA APARTADO.
 *
 * Buscar y filtrar se hacen en el navegador, sobre las filas que ya llegaron.
 * Es lo correcto para este tamaño —cientos de filas, no cientos de miles— y
 * evita mandar lo que se escribe en el buscador al servidor en cada tecla,
 * que con estos datos es exactamente lo que no hay que hacer.
 *
 * Y por eso mismo el buscador NO toca la URL: lo que se teclea aquí es un
 * nombre o un correo de una persona migrante, y una dirección se queda en el
 * historial, en el portapapeles de quien la copie y en los registros de
 * cualquier proxy por el que pase.
 */

export type Persona = {
  id: number;
  nombre: string;
  correo: string;
  pais: string;
  enEeuu: boolean;
  /** Ya formateado en el servidor, en hora de Utah: «JUE 20 · 9:00». */
  cuando: string;
  /** La hora que ve ESA persona. `null` si está a la misma hora que Utah. */
  horaSuya: string | null;
  /** Sólo dígitos, con código de país. `null` en las citas anteriores a esto. */
  whatsapp: string | null;
  apartoEl: string;
  cancelada: boolean;
  pasada: boolean;
};

type Filtro = "vienen" | "pasaron" | "canceladas" | "todas";

const FILTROS: { id: Filtro; texto: string }[] = [
  { id: "vienen", texto: "Las que vienen" },
  { id: "pasaron", texto: "Las que pasaron" },
  { id: "canceladas", texto: "Canceladas" },
  { id: "todas", texto: "Todas" },
];

export function TablaPersonas({
  personas,
  total,
  tope,
}: {
  personas: Persona[];
  total: number;
  tope: number;
}) {
  const [filtro, setFiltro] = useState<Filtro>("vienen");
  const [busca, setBusca] = useState("");

  const visibles = useMemo(() => {
    const aguja = busca.trim().toLowerCase();
    return personas.filter((p) => {
      if (filtro === "vienen" && (p.cancelada || p.pasada)) return false;
      if (filtro === "pasaron" && (p.cancelada || !p.pasada)) return false;
      if (filtro === "canceladas" && !p.cancelada) return false;
      if (!aguja) return true;
      return (
        p.nombre.toLowerCase().includes(aguja) ||
        p.correo.toLowerCase().includes(aguja) ||
        p.pais.toLowerCase().includes(aguja)
      );
    });
  }, [personas, filtro, busca]);

  function descargar() {
    const csv = aCsv(visibles);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "citas.csv";
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="pt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <h1 className="font-titulo text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-[34px]">
            Quién ha apartado
          </h1>
          <p className="text-[16px] text-tinta-tenue">
            {total === 0
              ? "Todavía nadie"
              : `${total} desde que abrió${total > tope ? ` · se ven las ${tope} últimas` : ""}`}
          </p>
        </div>

        <button
          type="button"
          onClick={descargar}
          disabled={visibles.length === 0}
          className="flex min-h-11 items-center gap-2.5 rounded-full border border-white/25 px-5 text-[15px] font-bold disabled:opacity-40"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M20 21H4" />
          </svg>
          Descargar la lista
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <label className="flex min-h-12 w-full max-w-[26rem] items-center gap-2.5 rounded-2xl border border-white/22 px-4">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="shrink-0 text-tinta-tenue"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre, correo o país"
            className="min-h-12 w-full bg-transparent text-[16px] text-tinta outline-none placeholder:text-tinta-tenue"
          />
        </label>

        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={
              filtro === f.id
                ? "min-h-11 rounded-full bg-white/10 px-4 text-[15px] font-bold"
                : "min-h-11 rounded-full px-4 text-[15px] text-tinta-tenue"
            }
          >
            {f.texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-8 text-[17px] text-tinta-suave">
          {personas.length === 0
            ? "Cuando alguien aparte una hora, aparece aquí con su nombre, de dónde es y si ya está en Estados Unidos."
            : "Nada coincide con lo que buscas."}
        </p>
      ) : (
        <>
          {/* ── Escritorio: tabla ── */}
          <div className="mt-5 hidden overflow-hidden rounded-[20px] border border-white/12 lg:block">
                <div className="grid grid-cols-[1.4fr_0.9fr_1.1fr_1.5fr_1.5fr_1.1fr] gap-4 bg-white/[0.045] px-6 py-3 text-[11px] font-medium tracking-[0.13em] text-tinta-tenue">
              <span>NOMBRE</span>
              <span>DE DÓNDE</span>
              <span>DÓNDE ESTÁ</span>
              <span>CORREO</span>
              <span>LA CITA</span>
              <span>WHATSAPP</span>
            </div>

            {visibles.map((p, i) => (
              <div
                key={p.id}
                className={
                  i % 2 === 1
                    ? "grid grid-cols-[1.4fr_0.9fr_1.1fr_1.5fr_1.5fr_1.1fr] items-center gap-4 border-t border-white/[0.07] bg-white/[0.02] px-6 py-3.5"
                    : "grid grid-cols-[1.4fr_0.9fr_1.1fr_1.5fr_1.5fr_1.1fr] items-center gap-4 border-t border-white/[0.07] px-6 py-3.5"
                }
              >
                <span className="min-w-0 truncate text-[17px] font-bold">
                  {p.nombre}
                  {p.cancelada ? (
                    <span className="ml-2 text-[14px] font-medium text-tinta-tenue">
                      cancelada
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 truncate text-[16px] text-tinta-suave">{p.pais}</span>
                <span
                  className={
                    p.enEeuu ? "text-[16px] text-acento" : "text-[16px] text-aviso"
                  }
                >
                  {p.enEeuu ? "Ya está aquí" : "Todavía no"}
                </span>
                <span className="min-w-0 truncate text-[16px] text-tinta-suave">
                  {p.correo}
                </span>
                <span className="min-w-0 text-[15px] tabular-nums">
                  <span className="block">{p.cuando} <span className="text-tinta-tenue">Utah</span></span>
                  {p.horaSuya ? (
                    <span className="block text-[14px] text-tinta-tenue">
                      {p.horaSuya} donde está
                    </span>
                  ) : null}
                </span>
                <BotonWhatsapp persona={p} />
              </div>
            ))}
          </div>

          {/* ── Teléfono: fichas ── */}
          <div className="mt-5 flex flex-col gap-2.5 lg:hidden">
            {visibles.map((p) => (
              <article
                key={p.id}
                className="rounded-[20px] border border-white/12 bg-panel px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-[18px] font-bold">{p.nombre}</span>
                  <span className="text-[15px] tabular-nums text-tinta-suave">
                    {p.cuando} Utah
                  </span>
                </div>
                <p className="mt-1.5 text-[16px] text-tinta-suave">
                  {p.pais} ·{" "}
                  <span className={p.enEeuu ? "text-acento" : "text-aviso"}>
                    {p.enEeuu ? "ya está aquí" : "todavía no está aquí"}
                  </span>
                </p>
                <p className="mt-1 break-all text-[16px] text-tinta-tenue">{p.correo}</p>
                {p.horaSuya ? (
                  <p className="mt-1 text-[15px] text-tinta-tenue">
                    Para esa persona son las {p.horaSuya}
                  </p>
                ) : null}
                <p className="mt-1 text-[15px] text-tinta-tenue">
                  Apartó el {p.apartoEl}
                  {p.cancelada ? " · cancelada" : ""}
                </p>
                <div className="mt-3">
                  <BotonWhatsapp persona={p} />
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-[15px] text-tinta-tenue">
            {visibles.length} de {personas.length}
          </p>
        </>
      )}

      <div className="mt-8 flex gap-3.5 rounded-[20px] border border-white/10 bg-white/[0.035] px-5 py-4">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="mt-0.5 shrink-0 text-tinta-tenue"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        <p className="max-w-[92ch] text-[16px] leading-[1.5] text-tinta-suave">
          Esta lista sólo la ves tú, con tu sesión iniciada. El sitio público no
          tiene permiso para leer ni una fila de esta tabla: para saber qué
          horas están ocupadas usa una consulta aparte que devuelve horas y nada
          más, ni nombres ni correos. Y nada de esto viaja nunca por la barra de
          direcciones.
        </p>
      </div>
    </main>
  );
}

/**
 * ABRIR SU CONVERSACIÓN DE WHATSAPP.
 *
 * `wa.me` con el número en dígitos: abre el chat con ESA persona, en la app
 * si está instalada y en el navegador si no. Sin mensaje escrito de
 * antemano, porque lo que Henry le manda —el enlace de la sesión, una
 * pregunta, un recordatorio— cambia cada vez.
 *
 * Las citas de antes de que se pidiera el número no lo tienen, y ahí se dice
 * en vez de dejar un botón que no lleva a ningún sitio.
 */
function BotonWhatsapp({ persona }: { persona: Persona }) {
  if (!persona.whatsapp) {
    return <span className="text-[14px] text-tinta-tenue">sin número</span>;
  }

  return (
    <a
      href={`https://wa.me/${persona.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-acento/40 px-3 text-[15px] font-bold text-acento transition-colors hover:border-acento"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
      Escribirle
    </a>
  );
}

/**
 * La lista en CSV.
 *
 * Cada campo va entre comillas y las comillas de dentro se duplican, que es
 * lo que dice el RFC 4180 y lo que evita que un nombre con una coma parta la
 * fila en dos.
 *
 * Y un campo que empieza por `=`, `+`, `-` o `@` se prefija con un apóstrofo:
 * sin eso, Excel y Sheets lo interpretan como una FÓRMULA al abrir el
 * archivo. Un nombre escrito con mala idea en el formulario público se
 * convertiría en código ejecutándose en el ordenador de Henry.
 */
function aCsv(personas: Persona[]): string {
  const cabecera = [
    "nombre",
    "pais",
    "esta_en_eeuu",
    "correo",
    "hora_utah",
    "hora_de_esa_persona",
    "whatsapp",
    "aparto_el",
    "estado",
  ];

  const filas = personas.map((p) => [
    p.nombre,
    p.pais,
    p.enEeuu ? "si" : "no",
    p.correo,
    p.cuando,
    p.horaSuya ?? "",
    p.whatsapp ?? "",
    p.apartoEl,
    p.cancelada ? "cancelada" : p.pasada ? "pasada" : "por venir",
  ]);

  return [cabecera, ...filas]
    .map((fila) => fila.map(escapar).join(","))
    .join("\r\n");
}

function escapar(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
