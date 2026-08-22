"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { cerrarHoras, cerrarRestoDeHoy, reabrirHora } from "@/app/panel/acciones";
import { horaSuelta } from "@/lib/horario";

/**
 * LA REJILLA DE LA SEMANA.
 *
 * Todo lo que sabe de fechas se lo dieron ya resuelto: aquí no se calcula ni
 * una zona horaria. Lo que sí hace, y es su único trabajo de verdad, es el
 * gesto: TOCAR UNA HORA LA CIERRA, y arrastrar por varias las marca todas.
 *
 * ── Por qué dos maquetaciones y no una responsive ──
 *
 * Seis columnas no entran en 390 px. Estrechar la rejilla hasta que quepa da
 * celdas donde no cabe un nombre, y entonces no informa de nada. Así que en
 * el teléfono no se enseña la semana: se enseña UN DÍA en vertical, con la
 * tira de días arriba para cambiar. Son dos vistas del mismo dato, no una
 * encogida.
 */

export type CeldaDia =
  | {
      estado: "cita";
      iso: string;
      nombre: string;
      pais: string;
      enEeuu: boolean;
      /** En hora de Utah, que es la de Henry. */
      hora: string;
      /** La de esa persona. `null` si está a la misma hora que Utah. */
      horaSuya: string | null;
      whatsapp: string | null;
    }
  | { estado: "libre"; iso: string }
  | { estado: "cerrada"; iso: string; suelta: boolean }
  | { estado: "pasada"; iso: string }
  | { estado: "fuera" };

export type DiaPintado = {
  clave: string;
  abreviatura: string;
  numero: number;
  esHoy: boolean;
  celdas: CeldaDia[];
};

type Props = {
  dias: DiaPintado[];
  horas: number[];
  horasDeDescanso: number[];
  titulo: string;
  apartadas: number;
  libres: number;
  salto: number;
  esSemanaActual: boolean;
  puedeRetroceder: boolean;
  puedeAvanzar: boolean;
  tramosVacios: boolean;
};

export function Calendario({
  dias,
  horas,
  horasDeDescanso,
  titulo,
  apartadas,
  libres,
  salto,
  esSemanaActual,
  puedeRetroceder,
  puedeAvanzar,
  tramosVacios,
}: Props) {
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();

  /* El día que se ve en el teléfono. Arranca en hoy si hoy está en esta
     semana; si no, en el primero. */
  const [diaVisible, setDiaVisible] = useState(
    () => dias.find((d) => d.esHoy)?.clave ?? dias[0]?.clave ?? "",
  );

  /* Cambiar de semana lo reinicia todo, pero no con un efecto: el padre le
     pone `key={salto}` y React remonta. Con un efecto que mirara a `dias`,
     cada recarga de datos —cerrar una hora ya provoca una— devolvería al
     teléfono al día de hoy, y quien estaba mirando el viernes se encontraría
     de vuelta en el jueves sin haber tocado nada. */

  /* El arrastre acaba aunque se suelte el dedo fuera de la rejilla. Sin
     esto, salir por el borde deja el gesto pegado y la siguiente celda que
     se roza se marca sola. */
  useEffect(() => {
    if (!arrastrando) return;
    const soltar = () => setArrastrando(false);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, [arrastrando]);

  const resumen = useMemo(() => describir(marcadas, dias, horas), [marcadas, dias, horas]);

  function alternar(iso: string) {
    setError(null);
    setMarcadas((previas) =>
      previas.includes(iso) ? previas.filter((x) => x !== iso) : [...previas, iso],
    );
  }

  function anadir(iso: string) {
    setMarcadas((previas) => (previas.includes(iso) ? previas : [...previas, iso]));
  }

  function confirmarCierre() {
    setError(null);
    const lista = [...marcadas];
    empezar(async () => {
      const r = await cerrarHoras(lista);
      if (r.ok) setMarcadas([]);
      else setError(r.motivo);
    });
  }

  function abrir(iso: string) {
    setError(null);
    empezar(async () => {
      const r = await reabrirHora(iso);
      if (!r.ok) setError(r.motivo);
    });
  }

  function cerrarHoy() {
    setError(null);
    empezar(async () => {
      const r = await cerrarRestoDeHoy();
      if (!r.ok) setError(r.motivo);
    });
  }

  const delDia = dias.find((d) => d.clave === diaVisible) ?? dias[0];

  return (
    <main className="pt-6">
      {/* ── Cabecera ── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <h1 className="font-titulo text-[26px] font-semibold leading-[1.1] tracking-tight sm:text-[32px]">
            {titulo}
          </h1>
          <p className="text-[16px] text-tinta-tenue">
            {apartadas === 0 ? "Ninguna hora apartada" : `${apartadas} apartadas`} ·{" "}
            {libres} libres
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {esSemanaActual ? (
            <button
              type="button"
              onClick={cerrarHoy}
              disabled={enCurso}
              className="flex min-h-11 items-center gap-2 rounded-full border border-aviso/50 px-4 text-[15px] font-bold text-aviso disabled:opacity-50"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              Cerrar lo que queda de hoy
            </button>
          ) : null}

          <Flecha
            hacia={salto - 1}
            activa={puedeRetroceder}
            etiqueta="Semana anterior"
            direccion="atras"
          />
          <Flecha
            hacia={salto + 1}
            activa={puedeAvanzar}
            etiqueta="Semana siguiente"
            direccion="adelante"
          />
        </div>
      </div>

      {tramosVacios ? (
        <p className="mt-4 rounded-2xl border border-aviso/30 bg-aviso/10 px-5 py-3.5 text-[16px] text-aviso">
          No tienes ningún tramo abierto, así que el sitio no ofrece horas.
          Añádelos en Mi horario.
        </p>
      ) : (
        <p className="mt-2.5 hidden text-[16px] text-tinta-tenue md:block">
          Toca una hora libre para cerrarla. Arrastra por varias para cerrar un
          rato entero.
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-4 text-[16px] text-aviso">
          {error}
        </p>
      ) : null}

      {/* ══════════ ESCRITORIO: la semana ══════════ */}
      <div className="mt-5 hidden overflow-hidden rounded-[20px] border border-white/12 md:block">
        <div
          className="grid bg-white/[0.045]"
          style={{ gridTemplateColumns: `80px repeat(${dias.length}, minmax(0, 1fr))` }}
        >
          {/* «MT» a secas obligaba a saberse las siglas. Ahora dice de quién
              es la hora, que es lo que evita el lío: todo el panel va en la
              hora de Henry, y la de cada persona se enseña aparte. */}
          <span className="px-3 py-2.5 text-[11px] font-medium leading-tight tracking-[0.1em] text-tinta-tenue">
            TU HORA
            <span className="block text-[10px] tracking-[0.08em]">UTAH</span>
          </span>
          {dias.map((d) => (
            <span
              key={d.clave}
              className={
                d.esHoy
                  ? "px-2 py-2.5 text-center text-[14px] font-bold text-acento"
                  : "px-2 py-2.5 text-center text-[14px] font-bold text-tinta-suave"
              }
            >
              {d.abreviatura} {d.numero}
            </span>
          ))}
        </div>

        {horas.map((h, fila) => {
          const esDescanso = horasDeDescanso.includes(h);

          return (
            <div
              key={h}
              className={
                esDescanso
                  ? "grid border-t border-white/[0.07] bg-aviso/[0.045]"
                  : "grid border-t border-white/[0.07]"
              }
              style={{ gridTemplateColumns: `80px repeat(${dias.length}, minmax(0, 1fr))` }}
            >
              <span
                className={
                  esDescanso
                    ? "px-3 py-3.5 text-[15px] text-aviso"
                    : "px-3 py-3.5 text-[15px] text-tinta-tenue"
                }
              >
                {horaSuelta(h)}
              </span>

              {esDescanso ? (
                <span
                  className="m-[3px] flex items-center gap-3 rounded-xl px-4 py-2.5"
                  style={{ gridColumn: `span ${dias.length}`, background: FRANJA_AVISO }}
                >
                  <span className="text-[15px] font-bold text-aviso">
                    Tu descanso, todos los días
                  </span>
                  <span className="hidden text-[15px] text-tinta-suave lg:inline">
                    se cambia en «Mi horario»
                  </span>
                </span>
              ) : (
                dias.map((d) => (
                  <Celda
                    key={d.clave + fila}
                    celda={d.celdas[fila]}
                    etiqueta={`${d.abreviatura} ${d.numero}, ${horaSuelta(h)}`}
                    marcada={
                      d.celdas[fila].estado === "libre" &&
                      marcadas.includes(d.celdas[fila].iso)
                    }
                    ocupado={enCurso}
                    arrastrando={arrastrando}
                    onEmpezar={(iso) => {
                      setArrastrando(true);
                      alternar(iso);
                    }}
                    onEntrar={anadir}
                    onAlternar={alternar}
                    onReabrir={abrir}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* ── La barra de lo marcado ── */}
      {marcadas.length > 0 ? (
        <div className="mt-3.5 hidden flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-[18px] border border-acento/40 bg-panel px-6 py-3.5 md:flex">
          <span className="text-[17px]">{resumen}</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMarcadas([])}
              className="min-h-11 rounded-full px-4 text-[15px] text-tinta-suave"
            >
              Quitar la marca
            </button>
            <button
              type="button"
              onClick={confirmarCierre}
              disabled={enCurso}
              className="min-h-12 rounded-full bg-acento px-6 text-[16px] font-extrabold text-fondo disabled:opacity-50"
            >
              {enCurso ? "Cerrando…" : "Cerrar estas horas"}
            </button>
          </div>
        </div>
      ) : null}

      <Leyenda />

      {/* ══════════ TELÉFONO: un día ══════════ */}
      <div className="md:hidden">
        <div className="mt-4 flex gap-1.5">
          {dias.map((d) => (
            <button
              key={d.clave}
              type="button"
              onClick={() => setDiaVisible(d.clave)}
              aria-pressed={d.clave === diaVisible}
              className={
                d.clave === diaVisible
                  ? "flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-acento text-fondo"
                  : "flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/15"
              }
            >
              <span
                className={
                  d.clave === diaVisible
                    ? "text-[11px] font-extrabold tracking-[0.08em]"
                    : "text-[11px] font-extrabold tracking-[0.08em] text-tinta-tenue"
                }
              >
                {d.abreviatura}
              </span>
              <span className="text-[17px] font-bold tabular-nums">{d.numero}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {delDia?.celdas.map((celda, i) =>
            celda.estado === "fuera" ? null : (
              <FilaTelefono
                key={delDia.clave + i}
                hora={horas[i]}
                celda={celda}
                descanso={horasDeDescanso.includes(horas[i])}
                ocupado={enCurso}
                onCerrar={(iso) =>
                  empezar(async () => {
                    const r = await cerrarHoras([iso]);
                    if (!r.ok) setError(r.motivo);
                  })
                }
                onReabrir={abrir}
              />
            ),
          )}

          {/* El descanso no pertenece a ningún día, así que en la lista de un
              día concreto se pinta una vez, con su rango entero. */}
          {horasDeDescanso.length > 0 ? (
            <div
              className="flex items-center gap-3.5 rounded-2xl border border-aviso/25 px-4 py-3.5"
              style={{ background: FRANJA_AVISO }}
            >
              <span className="w-[52px] shrink-0 text-[14px] leading-tight text-aviso tabular-nums">
                {horaSuelta(horasDeDescanso[0])}
                <br />
                {horaSuelta(horasDeDescanso[horasDeDescanso.length - 1] + 1)}
              </span>
              <span className="min-w-0">
                <span className="block text-[16px] font-bold text-aviso">Tu descanso</span>
                <span className="block text-[14px] text-tinta-suave">
                  todos los días · cámbialo en Mi horario
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

/* El rayado va aquí y no en una clase de Tailwind porque un degradado
   repetido no se puede expresar con utilidades. Usa los mismos tokens de
   color que el resto: no hay ningún hex nuevo. */
const FRANJA_AVISO =
  "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-aviso) 13%, transparent) 0 7px, transparent 7px 14px)";
const FRANJA_GRIS =
  "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-tinta) 7%, transparent) 0 6px, transparent 6px 12px)";

function Celda({
  celda,
  etiqueta,
  marcada,
  ocupado,
  arrastrando,
  onEmpezar,
  onEntrar,
  onAlternar,
  onReabrir,
}: {
  celda: CeldaDia;
  etiqueta: string;
  marcada: boolean;
  ocupado: boolean;
  arrastrando: boolean;
  onEmpezar: (iso: string) => void;
  onEntrar: (iso: string) => void;
  onAlternar: (iso: string) => void;
  onReabrir: (iso: string) => void;
}) {
  if (celda.estado === "fuera") {
    return <span className="m-[3px] rounded-xl bg-white/[0.03]" aria-hidden="true" />;
  }

  if (celda.estado === "cita") {
    return (
      <span
        className="m-[3px] min-w-0 rounded-xl border border-acento/45 bg-acento/[0.16] px-2.5 py-2"
        title={
          celda.horaSuya
            ? `${celda.nombre} · ${celda.hora} tu hora · ${celda.horaSuya} la suya`
            : `${celda.nombre} · ${celda.hora}`
        }
      >
        <span className="block truncate text-[16px] font-bold">{celda.nombre}</span>
        <span
          className={
            celda.enEeuu
              ? "block truncate text-[14px] text-tinta-suave"
              : "block truncate text-[14px] text-aviso"
          }
        >
          {celda.pais}
        </span>
      </span>
    );
  }

  if (celda.estado === "pasada") {
    return (
      <span className="m-[3px] rounded-xl bg-white/[0.045] px-2.5 py-2 text-[15px] text-tinta-tenue">
        ya pasó
      </span>
    );
  }

  if (celda.estado === "cerrada") {
    if (!celda.suelta) {
      return (
        <span
          className="m-[3px] rounded-xl px-2.5 py-2 text-[15px] text-tinta-suave"
          style={{ background: FRANJA_GRIS }}
          title="Parte de un cierre más largo. Se quita desde Mi horario."
        >
          cerrado
        </span>
      );
    }
    return (
      <button
        type="button"
        disabled={ocupado}
        aria-label={`${etiqueta}: cerrada. Reabrir`}
        onClick={() => onReabrir(celda.iso)}
        style={{ background: FRANJA_GRIS }}
        className="m-[3px] rounded-xl px-2.5 py-2 text-left text-[15px] text-tinta-suave disabled:opacity-50"
      >
        cerrado
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={ocupado}
      aria-pressed={marcada}
      aria-label={`${etiqueta}: libre. Marcar para cerrar`}
      onPointerDown={(e) => {
        /* `preventDefault` para que arrastrar no seleccione texto por toda la
           rejilla. Bloquea también el `click` del ratón, y por eso el toggle
           vive aquí y no en `onClick`. */
        e.preventDefault();
        onEmpezar(celda.iso);
      }}
      onPointerEnter={() => {
        if (arrastrando) onEntrar(celda.iso);
      }}
      onClick={(e) => {
        /* Un clic hecho con el teclado —Intro o Espacio sobre el botón— no
           pasa por ningún puntero, así que llega aquí y sólo aquí. Se
           reconoce porque `detail` vale 0; los del ratón traen el número de
           pulsaciones. Sin esto, la rejilla sería inalcanzable sin ratón. */
        if (e.detail === 0) onAlternar(celda.iso);
      }}
      className={
        marcada
          ? "m-[3px] rounded-xl border-2 border-acento bg-acento/20 px-2.5 py-2 text-left text-[15px] font-bold text-acento disabled:opacity-50"
          : "m-[3px] rounded-xl border border-dashed border-white/20 px-2.5 py-2 text-left text-[15px] text-tinta-tenue disabled:opacity-50"
      }
    >
      {marcada ? "marcada" : "libre"}
    </button>
  );
}

function FilaTelefono({
  hora,
  celda,
  descanso,
  ocupado,
  onCerrar,
  onReabrir,
}: {
  hora: number;
  celda: Exclude<CeldaDia, { estado: "fuera" }>;
  descanso: boolean;
  ocupado: boolean;
  onCerrar: (iso: string) => void;
  onReabrir: (iso: string) => void;
}) {
  if (descanso) return null;

  if (celda.estado === "cita") {
    return (
      <div className="rounded-2xl border border-acento/45 bg-acento/[0.16] px-4 py-3.5">
        <div className="flex items-center gap-3.5">
          <span className="w-[52px] shrink-0 text-[16px] text-acento tabular-nums">
            {horaSuelta(hora)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-bold">{celda.nombre}</span>
            <span
              className={
                celda.enEeuu
                  ? "block text-[14px] text-tinta-suave"
                  : "block text-[14px] text-aviso"
              }
            >
              {celda.pais} · {celda.enEeuu ? "ya está aquí" : "todavía no está aquí"}
            </span>
          </span>
        </div>

        {/* La hora que ve ESA persona, cuando no vive a tu hora. Es la línea
            que evita el «nos vemos a las 11» que cada uno entiende a una hora
            distinta. */}
        {celda.horaSuya ? (
          <p className="mt-2 pl-[66px] text-[14px] text-tinta-suave">
            Para esa persona son las <strong className="font-bold">{celda.horaSuya}</strong>
          </p>
        ) : null}

        {celda.whatsapp ? (
          <a
            href={`https://wa.me/${celda.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-full border border-acento/50 text-[15px] font-bold text-acento"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
            </svg>
            Escribirle por WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  if (celda.estado === "pasada") {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] px-4 py-3">
        <span className="w-[52px] shrink-0 text-[16px] text-tinta-tenue tabular-nums">
          {horaSuelta(hora)}
        </span>
        <span className="text-[16px] text-tinta-tenue">ya pasó</span>
      </div>
    );
  }

  if (celda.estado === "cerrada") {
    return (
      <div
        className="flex items-center gap-3.5 rounded-2xl px-4 py-3"
        style={{ background: FRANJA_GRIS }}
      >
        <span className="w-[52px] shrink-0 text-[16px] text-tinta-suave tabular-nums">
          {horaSuelta(hora)}
        </span>
        <span className="text-[16px] text-tinta-suave">cerrado</span>
        {celda.suelta ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => onReabrir(celda.iso)}
            className="ml-auto min-h-11 shrink-0 rounded-full px-4 text-[15px] font-bold text-acento disabled:opacity-50"
          >
            Reabrir
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-white/20 py-2.5 pl-4 pr-2.5">
      <span className="w-[52px] shrink-0 text-[16px] text-tinta-tenue tabular-nums">
        {horaSuelta(hora)}
      </span>
      <span className="text-[16px] text-tinta-tenue">libre</span>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => onCerrar(celda.iso)}
        className="ml-auto min-h-11 shrink-0 rounded-full bg-white/[0.09] px-4 text-[15px] font-bold disabled:opacity-50"
      >
        Cerrar
      </button>
    </div>
  );
}

function Flecha({
  hacia,
  activa,
  etiqueta,
  direccion,
}: {
  hacia: number;
  activa: boolean;
  etiqueta: string;
  direccion: "atras" | "adelante";
}) {
  const punta =
    direccion === "atras" ? "M15 18 9 12l6-6" : "m9 18 6-6-6-6";

  if (!activa) {
    return (
      <span
        aria-hidden="true"
        className="flex size-11 items-center justify-center rounded-full border border-white/12 text-tinta-tenue opacity-40"
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
        >
          <path d={punta} />
        </svg>
      </span>
    );
  }

  return (
    <Link
      href={hacia === 0 ? "/panel" : `/panel?s=${hacia}`}
      aria-label={etiqueta}
      className="flex size-11 items-center justify-center rounded-full border border-white/25"
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
        <path d={punta} />
      </svg>
    </Link>
  );
}

function Leyenda() {
  return (
    <div className="mt-4 hidden flex-wrap items-center gap-x-6 gap-y-2 md:flex">
      <Marca clase="border border-acento bg-acento/20">apartada por alguien</Marca>
      <Marca clase="border border-dashed border-white/30">libre · tócala para cerrarla</Marca>
      <Marca estilo={FRANJA_GRIS}>cerrada por ti · tócala para reabrirla</Marca>
      <Marca estilo={FRANJA_AVISO}>tu descanso fijo</Marca>
      <Marca clase="bg-white/[0.05]">fuera de tu horario</Marca>
    </div>
  );
}

function Marca({
  clase = "",
  estilo,
  children,
}: {
  clase?: string;
  estilo?: string;
  children: string;
}) {
  return (
    <span className="flex items-center gap-2 text-[15px] text-tinta-tenue">
      <span
        className={`size-3.5 shrink-0 rounded ${clase}`}
        style={estilo ? { background: estilo } : undefined}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

/**
 * «Martes 25 · de 15:00 a 17:00 · 2 horas marcadas».
 *
 * Sólo se atreve con el rango cuando lo marcado es un bloque seguido de un
 * mismo día. Si hay huecos —porque en medio había una cita— dice el número y
 * ya: mentir con un rango que no es continuo sería peor que no decirlo.
 */
function describir(marcadas: string[], dias: DiaPintado[], horas: number[]): string {
  if (marcadas.length === 0) return "";
  const cuenta = `${marcadas.length} ${marcadas.length === 1 ? "hora marcada" : "horas marcadas"}`;

  const juego = new Set(marcadas);
  for (const d of dias) {
    const indices = d.celdas
      .map((c, i) => (c.estado === "libre" && juego.has(c.iso) ? i : -1))
      .filter((i) => i >= 0);

    if (indices.length !== marcadas.length) continue;

    const seguido = indices.every((v, k) => k === 0 || v === indices[k - 1] + 1);
    const titulo = `${d.abreviatura} ${d.numero}`;

    if (!seguido) return `${titulo} · ${cuenta}`;

    const primera = horas[indices[0]];
    const ultima = horas[indices[indices.length - 1]];
    return `${titulo} · de ${horaSuelta(primera)} a ${horaSuelta(ultima + 1)} · ${cuenta}`;
  }

  return cuenta;
}
