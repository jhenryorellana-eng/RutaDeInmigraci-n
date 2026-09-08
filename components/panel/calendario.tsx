"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  apuntarEvento,
  cerrarHoras,
  cerrarRestoDeHoy,
  reabrirHora,
} from "@/app/panel/acciones";
import { fechaYHora, instanteAgenda, type EntradaAgenda } from "@/lib/agenda";
import { horaEnZona, horaSuelta } from "@/lib/horario";
import { EditorAgenda } from "./editor-agenda";
import type { DiaPintado } from "@/lib/agenda";

type Props = {
  dias: DiaPintado[];
  horas: number[];
  horasDeDescanso: number[];
  entradas: EntradaAgenda[];
  titulo: string;
  apartadas: number;
  libres: number;
  salto: number;
  esSemanaActual: boolean;
  puedeRetroceder: boolean;
  puedeAvanzar: boolean;
  tramosVacios: boolean;
  edicionDisponible: boolean;
};

const boton =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-3 text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-acento disabled:opacity-40";

export function Calendario({
  dias,
  horas,
  entradas,
  titulo,
  apartadas,
  libres,
  salto,
  esSemanaActual,
  puedeRetroceder,
  puedeAvanzar,
  tramosVacios,
  edicionDisponible,
}: Props) {
  const router = useRouter();
  const [dia, setDia] = useState(
    () => dias.find((d) => d.esHoy)?.clave ?? dias[0]?.clave,
  );
  const [editor, setEditor] = useState<{
    entrada?: EntradaAgenda;
    inicio: string;
  } | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [tituloManual, setTituloManual] = useState("");
  const [ocupa, setOcupa] = useState(true);
  const [cerrarHoy, setCerrarHoy] = useState(false);
  const [pendiente, empezar] = useTransition();
  const [conexion, setConexion] = useState(true);

  useEffect(() => {
    const soltar = () => setArrastrando(false);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    const online = () => {
      setConexion(true);
      router.refresh();
    };
    const offline = () => setConexion(false);
    setConexion(navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    const refrescar = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        router.refresh();
    };
    document.addEventListener("visibilitychange", refrescar);
    const reloj = window.setInterval(refrescar, 60000);
    return () => {
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", refrescar);
      window.clearInterval(reloj);
    };
  }, [router]);

  const visible = dias.find((d) => d.clave === dia) ?? dias[0];
  function delDia(e: EntradaAgenda, clave: string) {
    const inicio = instanteAgenda(clave, "00:00");
    if (!inicio) return false;
    // El siguiente día puede durar 23 o 25 horas en Utah.
    const fecha = new Date(`${clave}T12:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + 1);
    const fin = instanteAgenda(fecha.toISOString().slice(0, 10), "00:00")!;
    return (
      Date.parse(e.inicio) < fin.getTime() &&
      Date.parse(e.fin) > inicio.getTime()
    );
  }
  const entradasDelDia = entradas.filter((e) => delDia(e, visible.clave));
  const libresDelDia = visible.celdas.filter((c) => c.estado === "libre");

  function agendar(iso?: string) {
    const libre = visible.celdas.find((c) => c.estado === "libre");
    let predeterminado =
      libre?.estado === "libre"
        ? libre.iso
        : instanteAgenda(visible.clave, "09:00")!.toISOString();
    if (Date.parse(predeterminado) <= Date.now()) {
      const siguiente = dias
        .flatMap((d) => d.celdas)
        .find((c) => c.estado === "libre" && Date.parse(c.iso) > Date.now());
      predeterminado =
        siguiente?.estado === "libre"
          ? siguiente.iso
          : new Date(
              Math.ceil((Date.now() + 1) / 3600000) * 3600000,
            ).toISOString();
    }
    setEditor({ inicio: iso ?? predeterminado });
    setMensaje("");
    setError("");
  }
  function editar(e: EntradaAgenda) {
    setEditor({ entrada: e, inicio: e.inicio });
    setMensaje("");
  }
  function marcar(iso: string) {
    setSeleccion((s) =>
      s.includes(iso) ? s.filter((v) => v !== iso) : [...s, iso],
    );
  }
  function ejecutar(
    accion: () => Promise<{ ok: true } | { ok: false; motivo: string }>,
    mensaje: string,
  ) {
    setError("");
    setMensaje("");
    empezar(async () => {
      try {
        const r = await accion();
        if (!r.ok) setError(r.motivo);
        else {
          setMensaje(mensaje);
          setSeleccion([]);
          setTituloManual("");
          setCerrarHoy(false);
          router.refresh();
        }
      } catch {
        setError("No se pudo conectar con la agenda. Vuelve a intentarlo.");
      }
    });
  }

  return (
    <main className="pt-5 sm:pt-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-acento">
            Tu tiempo, en orden
          </p>
          <h1 className="mt-1 font-titulo text-[30px] font-semibold tracking-tight sm:text-4xl">
            Mi agenda
          </h1>
        </div>
        <button
          type="button"
          onClick={() => agendar()}
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-2xl bg-acento px-4 font-extrabold text-fondo shadow-[0_8px_28px_-12px_var(--color-acento)] sm:px-6"
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            +
          </span>{" "}
          Agendar
        </button>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
        {[
          ["Citas", apartadas],
          ["En mi agenda", entradas.filter((e) => e.tipo === "evento").length],
          ["Horas libres", libres],
        ].map(([label, valor]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3 sm:px-4"
          >
            <span className="block text-xl font-semibold tabular-nums sm:text-2xl">
              {valor}
            </span>
            <span className="mt-1 block text-xs text-tinta-suave">
              {label} · semana
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div>
          <h2 className="font-titulo text-lg font-semibold sm:text-xl">
            {titulo}
          </h2>
          <p className="mt-1 text-xs text-tinta-suave">
            Todas las horas en Utah · America/Denver
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Navegar
            salto={salto - 1}
            permitido={puedeRetroceder}
            nombre="Semana anterior"
          >
            ‹
          </Navegar>
          <Link href="/panel" className={boton}>
            Hoy
          </Link>
          <Navegar
            salto={salto + 1}
            permitido={puedeAvanzar}
            nombre="Semana siguiente"
          >
            ›
          </Navegar>
        </div>
      </div>
      {!conexion && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-aviso/30 bg-aviso/10 p-3 text-sm text-aviso"
        >
          Sin conexión. Reconecta para guardar cambios y consultar la
          disponibilidad actual.
        </p>
      )}
      {tramosVacios && (
        <p className="mt-4 text-sm text-aviso">
          Las reservas públicas están cerradas. Configura «Mis horas y mis
          ausencias» para abrirlas. Tu agenda manual sigue disponible.
        </p>
      )}
      {mensaje && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-acento/25 bg-acento/10 p-3 text-sm text-acento"
        >
          {mensaje}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-aviso/30 bg-aviso/10 p-3 text-sm text-aviso"
        >
          {error}
        </p>
      )}

      <div className="mt-5 md:hidden">
        <div aria-label="Días de la semana" className="grid grid-cols-7 gap-1">
          {dias.map((d) => (
            <button
              key={d.clave}
              type="button"
              aria-label={`${d.abreviatura} ${d.numero}${d.esHoy ? ", hoy" : ""}`}
              aria-pressed={d.clave === dia}
              onClick={() => setDia(d.clave)}
              className={`flex min-h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors ${d.clave === dia ? "border-acento bg-acento text-fondo" : "border-white/10 bg-white/[.025] text-tinta-suave"}`}
            >
              <span className="text-[10px] font-bold">{d.abreviatura}</span>
              <span className="text-lg font-bold tabular-nums">{d.numero}</span>
              <span
                aria-hidden="true"
                className={`size-1 rounded-full ${entradas.some((e) => delDia(e, d.clave)) ? "bg-current" : "bg-transparent"}`}
              />
            </button>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {visible.esHoy
              ? "Tu día de hoy"
              : `${visible.abreviatura} ${visible.numero}`}
          </h3>
          <span className="text-xs text-tinta-suave">
            {entradasDelDia.length} en agenda
          </span>
        </div>
        <div className="mt-3 space-y-3">
          {entradasDelDia.length ? (
            entradasDelDia.map((e) => (
              <Tarjeta
                key={`${e.tipo}-${e.id}`}
                entrada={e}
                onEditar={() => editar(e)}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 px-5 py-6">
              <p className="font-semibold">Un día con espacio para ti</p>
              <p className="mt-2 text-sm text-tinta-suave">
                No tienes citas ni eventos. Elige una hora disponible o añade
                algo a tu agenda.
              </p>
            </div>
          )}
        </div>
        <details
          className="group mt-5 rounded-2xl border border-white/10 bg-white/[.025]"
          open
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-semibold">
            Horas disponibles{" "}
            <span className="text-xs font-normal text-tinta-suave">
              {libresDelDia.length} libres ·{" "}
              <span className="inline-block transition-transform group-open:rotate-180">
                ⌄
              </span>
            </span>
          </summary>
          <div className="space-y-2 border-t border-white/10 p-3">
            {visible.celdas.map((c, i) =>
              c.estado === "libre" ? (
                <div
                  key={horas[i]}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#16223a] p-2 pl-3"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold tabular-nums">
                    {horaSuelta(horas[i])}
                    <span className="ml-2 text-xs font-normal text-tinta-tenue">
                      Libre
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => agendar(c.iso)}
                    aria-label={`Agendar a las ${horaSuelta(horas[i])}`}
                    className="min-h-11 rounded-xl bg-acento/15 px-3 text-sm font-bold text-acento"
                  >
                    Agendar
                  </button>
                  <button
                    type="button"
                    aria-label={`Cerrar las ${horaSuelta(horas[i])}`}
                    disabled={pendiente}
                    onClick={() =>
                      ejecutar(() => cerrarHoras([c.iso]), "Hora cerrada.")
                    }
                    className="min-h-11 rounded-xl px-2 text-xs text-tinta-suave"
                  >
                    Cerrar
                  </button>
                </div>
              ) : c.estado === "cerrada" ? (
                <div
                  key={horas[i]}
                  className="flex min-h-12 items-center gap-2 px-3 text-sm text-tinta-tenue"
                >
                  <span className="flex-1">
                    {horaSuelta(horas[i])} · Cerrada
                  </span>
                  {c.suelta && (
                    <button
                      type="button"
                      disabled={pendiente}
                      onClick={() =>
                        ejecutar(() => reabrirHora(c.iso), "Hora reabierta.")
                      }
                      className="min-h-11 px-2 text-acento"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              ) : null,
            )}
            {!libresDelDia.length && (
              <p className="px-1 py-2 text-sm text-tinta-suave">
                No quedan horas disponibles en este día. Puedes elegir otro día.
              </p>
            )}
          </div>
        </details>
      </div>

      <div className="mt-5 hidden md:block">
        <p className="mb-3 text-xs text-tinta-suave">
          Toca una cita para editarla. Marca o arrastra horas libres para
          agendar o cerrar.
        </p>
        <div className="overflow-hidden rounded-2xl border border-white/12">
          <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] bg-white/5">
            <span className="p-3 text-[10px] text-tinta-tenue">UTAH</span>
            {dias.map((d) => (
              <span
                key={d.clave}
                className={`p-3 text-center text-xs font-bold ${d.esHoy ? "text-acento" : "text-tinta-suave"}`}
              >
                {d.abreviatura} {d.numero}
              </span>
            ))}
          </div>
          {horas.map((h, i) => (
            <div
              key={h}
              className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-t border-white/10"
            >
              <span className="p-3 text-sm text-tinta-suave">
                {horaSuelta(h)}
              </span>
              {dias.map((d) => {
                const c = d.celdas[i];
                const iso = instanteAgenda(
                  d.clave,
                  `${String(h).padStart(2, "0")}:00`,
                )?.toISOString();
                const registros = iso
                  ? entradas.filter(
                      (e) =>
                        Date.parse(e.inicio) <= Date.parse(iso) &&
                        Date.parse(e.fin) > Date.parse(iso),
                    )
                  : [];
                return (
                  <div
                    key={d.clave}
                    className="min-h-[76px] min-w-0 border-l border-white/[.06] p-1"
                  >
                    {registros.length ? (
                      <div className="space-y-1">
                        {registros.map((e) => (
                          <button
                            key={`${e.tipo}-${e.id}`}
                            type="button"
                            onClick={() => editar(e)}
                            title={`Editar ${e.titulo}`}
                            className={`min-h-[66px] w-full min-w-0 rounded-xl border p-2 text-left ${e.tipo === "evento" ? "border-personal/40 bg-personal/10" : e.estado === "pendiente" ? "border-aviso/40 bg-aviso/10" : "border-acento/30 bg-acento/10"}`}
                          >
                            <span className="block text-[10px] text-tinta-suave">
                              {etiqueta(e)}
                            </span>
                            <span className="mt-1 block break-words text-sm font-semibold">
                              {e.titulo}
                            </span>
                            <span className="mt-1 block text-[10px] text-tinta-suave">
                              Editar ↗
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : c.estado === "libre" ? (
                      <button
                        type="button"
                        disabled={pendiente}
                        aria-label={`${d.abreviatura} ${d.numero}, ${horaSuelta(h)}: marcar hora libre`}
                        aria-pressed={seleccion.includes(c.iso)}
                        onPointerDown={(event) => {
                          if (
                            event.pointerType === "mouse" &&
                            event.button === 0
                          ) {
                            event.preventDefault();
                            setArrastrando(true);
                            marcar(c.iso);
                          }
                        }}
                        onPointerEnter={() => {
                          if (arrastrando)
                            setSeleccion((s) =>
                              s.includes(c.iso) ? s : [...s, c.iso],
                            );
                        }}
                        onClick={(event) => {
                          if (
                            event.detail === 0 ||
                            (event.nativeEvent instanceof PointerEvent &&
                              event.nativeEvent.pointerType !== "mouse")
                          )
                            marcar(c.iso);
                        }}
                        className={`min-h-[66px] w-full rounded-xl border border-dashed px-2 text-left text-xs ${seleccion.includes(c.iso) ? "border-acento bg-acento/20 text-acento" : "border-white/15 text-tinta-tenue hover:border-acento/50"}`}
                      >
                        {seleccion.includes(c.iso) ? "Seleccionada" : "+ Libre"}
                      </button>
                    ) : c.estado === "cerrada" ? (
                      <button
                        type="button"
                        disabled={!c.suelta || pendiente}
                        title={
                          c.suelta
                            ? "Reabrir hora"
                            : "Cambia este cierre en Mis horas y mis ausencias"
                        }
                        onClick={() =>
                          ejecutar(() => reabrirHora(c.iso), "Hora reabierta.")
                        }
                        className="min-h-[66px] w-full rounded-xl bg-white/5 text-xs text-tinta-tenue"
                      >
                        Cerrada
                        {c.suelta && (
                          <span className="mt-1 block text-acento">
                            Reabrir
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="block p-2 text-xs text-tinta-tenue">
                        {c.estado === "pasada" ? "Ya pasó" : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {!horas.length && (
            <p className="p-6 text-sm text-tinta-suave">
              Tu semana está vacía. Usa «Agendar» para añadir tu primer evento.
            </p>
          )}
        </div>
        {!!seleccion.length && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ejecutar(
                () => apuntarEvento(seleccion, tituloManual, ocupa),
                "Evento añadido a la agenda.",
              );
            }}
            className="mt-4 rounded-2xl border border-acento/30 bg-panel p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {seleccion.length}{" "}
                {seleccion.length === 1
                  ? "hora seleccionada"
                  : "horas seleccionadas"}
              </p>
              <button
                type="button"
                onClick={() => setSeleccion([])}
                className={boton}
              >
                Quitar selección
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                required
                maxLength={80}
                value={tituloManual}
                onChange={(e) => setTituloManual(e.target.value)}
                aria-label="Nombre del evento seleccionado"
                placeholder="Nombre de la cita o evento"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-base"
              />
              <button
                type="submit"
                disabled={pendiente || !tituloManual.trim()}
                className={`${boton} border-acento bg-acento text-fondo`}
              >
                Agendar selección
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() =>
                  ejecutar(() => cerrarHoras(seleccion), "Horas cerradas.")
                }
                className={boton}
              >
                Cerrar horas
              </button>
            </div>
            <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-tinta-suave">
              <input
                type="checkbox"
                checked={ocupa}
                onChange={(e) => setOcupa(e.target.checked)}
                className="size-4 accent-[var(--color-acento)]"
              />
              Bloquear estas horas para reservas públicas
            </label>
          </form>
        )}
      </div>
      {esSemanaActual && (
        <div className="mt-5 border-t border-white/10 pt-4">
          {cerrarHoy ? (
            <div className="rounded-xl border border-aviso/30 p-4">
              <p className="text-sm">
                ¿Cerrar las horas que quedan libres hoy? Las citas existentes
                siguen en pie.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCerrarHoy(false)}
                  className={boton}
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    ejecutar(
                      cerrarRestoDeHoy,
                      "Las horas libres de hoy están cerradas.",
                    )
                  }
                  className={`${boton} text-aviso`}
                >
                  Confirmar cierre
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCerrarHoy(true)}
              className="min-h-11 text-sm text-tinta-suave underline decoration-white/20 underline-offset-4"
            >
              Cerrar lo que queda de hoy
            </button>
          )}
        </div>
      )}
      {editor && (
        <EditorAgenda
          {...editor}
          disponible={edicionDisponible}
          onCerrar={() => setEditor(null)}
          onGuardado={(texto) => {
            setEditor(null);
            setMensaje(texto);
            setSeleccion([]);
          }}
        />
      )}
    </main>
  );
}

function etiqueta(e: EntradaAgenda) {
  return e.tipo === "evento"
    ? e.ocupa
      ? "Agenda manual · ocupa la hora"
      : "Apunte · no bloquea"
    : e.estado === "pendiente"
      ? "Pendiente de pago"
      : e.estado === "atendida"
        ? "Atendida"
        : "Reserva confirmada";
}

function Tarjeta({
  entrada: e,
  onEditar,
}: {
  entrada: EntradaAgenda;
  onEditar: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border ${e.tipo === "evento" ? "border-personal/35 bg-personal/[.07]" : e.estado === "pendiente" ? "border-aviso/30 bg-aviso/[.06]" : "border-acento/30 bg-acento/[.06]"}`}
    >
      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar ${e.titulo}`}
        className="w-full p-4 text-left"
      >
        <span className="flex items-center justify-between gap-3">
          <span
            className={`text-lg font-bold tabular-nums ${e.tipo === "evento" ? "text-personal" : "text-acento"}`}
          >
            {horaEnZona(new Date(e.inicio))}
            <span className="ml-1 text-xs font-normal text-tinta-suave">
              –{" "}
              {horaEnZona(
                new Date(
                  e.tipo === "cita" ? Date.parse(e.inicio) + 45 * 60000 : e.fin,
                ),
              )}
            </span>
          </span>
          <span className="rounded-lg border border-white/15 px-2 py-1.5 text-xs text-tinta-suave">
            Editar ↗
          </span>
        </span>
        <span className="mt-3 block break-words text-lg font-semibold">
          {e.titulo}
        </span>
        <span className="mt-1 block text-xs text-tinta-suave">
          {etiqueta(e)}
        </span>
        {e.servicio && (
          <span className="mt-2 block text-sm text-tinta-suave">
            {e.servicio}
          </span>
        )}
        {e.detalle && (
          <span className="mt-1 block text-xs leading-relaxed text-tinta-tenue">
            {e.detalle}
          </span>
        )}
        {e.nota && (
          <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-tinta-suave">
            {e.nota}
          </span>
        )}
      </button>
      {e.whatsapp && (
        <a
          href={`https://wa.me/${e.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center border-t border-white/10 text-sm font-semibold text-acento"
        >
          Abrir WhatsApp ↗
        </a>
      )}
    </article>
  );
}

function Navegar({
  salto,
  permitido,
  nombre,
  children,
}: {
  salto: number;
  permitido: boolean;
  nombre: string;
  children: string;
}) {
  return permitido ? (
    <Link
      href={salto === 0 ? "/panel" : `/panel?s=${salto}`}
      aria-label={nombre}
      className={`${boton} w-11 px-0 text-2xl`}
    >
      {children}
    </Link>
  ) : (
    <span
      aria-hidden="true"
      className={`${boton} w-11 px-0 text-2xl opacity-30`}
    >
      {children}
    </span>
  );
}
