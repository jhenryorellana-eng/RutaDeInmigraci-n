"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarAgenda, eliminarEvento } from "@/app/panel/agenda-acciones";
import {
  fechaYHora,
  type CambioAgenda,
  type EntradaAgenda,
} from "@/lib/agenda";

const campo =
  "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-white/15 bg-white/[0.05] px-3 text-base text-tinta outline-none focus:border-acento focus:ring-2 focus:ring-acento/20 disabled:opacity-60 [color-scheme:dark]";

export function EditorAgenda({
  entrada,
  inicio,
  disponible,
  onCerrar,
  onGuardado,
}: {
  entrada?: EntradaAgenda;
  inicio: string;
  disponible: boolean;
  onCerrar: () => void;
  onGuardado: (mensaje: string) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const avisoSalida = useRef<HTMLDivElement>(null);
  const avisoError = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [datos, setDatos] = useState<CambioAgenda>(() => ({
    tipo: entrada?.tipo ?? "evento",
    id: entrada?.id,
    version: entrada?.version,
    titulo: entrada?.titulo ?? "",
    ...fechaYHora(entrada?.inicio ?? inicio),
    duracion: entrada
      ? Math.max(
          1,
          Math.round(
            (Date.parse(entrada.fin) - Date.parse(entrada.inicio)) / 3600000,
          ),
        )
      : 1,
    nota: entrada?.nota ?? "",
    ocupa: entrada?.ocupa ?? true,
    whatsapp: entrada?.whatsapp ?? "",
  }));
  const [error, setError] = useState("");
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [modificado, setModificado] = useState(false);
  const [pendiente, empezar] = useTransition();
  const esCita = datos.tipo === "cita";
  const retenida = entrada?.estado === "pendiente";
  useEffect(() => {
    if (confirmarSalida) avisoSalida.current?.focus();
  }, [confirmarSalida]);
  useEffect(() => {
    if (error) avisoError.current?.focus();
  }, [error]);

  useEffect(() => {
    const d = dialogo.current;
    const anterior = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    d?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = overflow;
      anterior?.focus();
    };
  }, []);

  function cambiar<K extends keyof CambioAgenda>(
    key: K,
    valor: CambioAgenda[K],
  ) {
    setDatos((prev) => ({ ...prev, [key]: valor }));
    setModificado(true);
    setError("");
  }
  function salir() {
    if (pendiente) return;
    if (modificado) setConfirmarSalida(true);
    else onCerrar();
  }
  function guardar() {
    if (!disponible) return;
    setError("");
    empezar(async () => {
      const resultado = await guardarAgenda(datos);
      if (!resultado.ok) {
        setError(resultado.motivo);
        return;
      }
      router.refresh();
      onGuardado(
        entrada
          ? "Cambios guardados. La agenda y el recordatorio están actualizados."
          : "Cita o evento añadido a tu agenda.",
      );
    });
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="editor-titulo"
      aria-describedby="editor-descripcion"
      onCancel={(e) => {
        e.preventDefault();
        salir();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[94dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-[28px] border border-white/15 bg-[#16223a] p-0 text-tinta shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:inset-0 sm:m-auto sm:max-h-[90dvh] sm:w-[560px] sm:rounded-[28px]"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar();
        }}
        className="flex min-h-0 flex-col"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#16223a] px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-acento">
              Tu agenda · Utah
            </p>
            <h2
              id="editor-titulo"
              className="mt-1 font-titulo text-2xl font-semibold"
            >
              {entrada ? "Editar y reprogramar" : "Agendar"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar editor"
            onClick={salir}
            disabled={pendiente}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-2xl disabled:opacity-40"
          >
            ×
          </button>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-7">
          {!disponible && (
            <p
              role="status"
              className="rounded-xl border border-aviso/30 bg-aviso/10 p-3 text-sm text-aviso"
            >
              La edición está pendiente de activación. Puedes consultar tus
              citas; los cambios de este formulario aún no se guardan.
            </p>
          )}
          <p
            id="editor-descripcion"
            className="text-sm leading-relaxed text-tinta-suave"
          >
            {esCita
              ? "Corrige los datos o cambia la fecha de esta reserva. Su servicio y pago se conservan."
              : "Añade una cita manual o un evento personal. Puedes bloquear ese espacio para que nadie lo reserve."}
          </p>
          {esCita && (
            <div className="rounded-xl border border-acento/20 bg-acento/5 p-3 text-sm">
              <strong>{entrada?.servicio || "Reserva"}</strong>
              {entrada?.precio != null && <span> · ${entrada.precio} USD</span>}
              <span className="mt-1 block text-tinta-suave">
                {retenida
                  ? "Pago pendiente · la hora se puede cambiar una vez confirmada."
                  : entrada?.estado === "atendida"
                    ? "Cita atendida"
                    : "Reserva confirmada"}
              </span>
            </div>
          )}
          <label className="block text-sm font-semibold">
            {esCita ? "Nombre" : "Nombre o título"}
            <input
              autoFocus
              required
              minLength={esCita ? 2 : 1}
              maxLength={esCita ? 120 : 80}
              value={datos.titulo}
              onChange={(e) => cambiar("titulo", e.target.value)}
              placeholder="Ej. Reunión con María"
              className={campo}
            />
          </label>
          <div className="grid min-w-0 grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-3">
            <label className="min-w-0 text-sm font-semibold">
              Fecha
              <input
                type="date"
                required
                value={datos.fecha}
                disabled={retenida}
                onChange={(e) => cambiar("fecha", e.target.value)}
                className={campo}
              />
            </label>
            <label className="min-w-0 text-sm font-semibold">
              Hora de Utah
              <select
                value={datos.hora}
                disabled={retenida}
                onChange={(e) => cambiar("hora", e.target.value)}
                className={campo}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!esCita && (
            <label className="block text-sm font-semibold">
              Duración
              <select
                className={campo}
                value={datos.duracion}
                onChange={(e) => cambiar("duracion", Number(e.target.value))}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} {i === 0 ? "hora" : "horas"}
                  </option>
                ))}
              </select>
            </label>
          )}
          {esCita && (
            <label className="block text-sm font-semibold">
              WhatsApp
              <input
                type="tel"
                autoComplete="tel"
                maxLength={25}
                value={datos.whatsapp}
                onChange={(e) => cambiar("whatsapp", e.target.value)}
                placeholder="Código de país + número"
                className={campo}
              />
            </label>
          )}
          {!esCita && (
            <>
              <label className="block text-sm font-semibold">
                Notas{" "}
                <span className="font-normal text-tinta-tenue">· opcional</span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={datos.nota}
                  onChange={(e) => cambiar("nota", e.target.value)}
                  placeholder="Detalles para recordar antes de la cita"
                  className={`${campo} py-3`}
                />
              </label>
              <label className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 p-3">
                <input
                  type="checkbox"
                  checked={datos.ocupa}
                  onChange={(e) => cambiar("ocupa", e.target.checked)}
                  className="size-5 shrink-0 accent-[var(--color-acento)]"
                />
                <span className="text-sm">
                  <strong className="block">Bloquear este horario</strong>
                  <span className="text-tinta-suave">
                    {datos.ocupa
                      ? "Este espacio queda reservado para ti."
                      : "Es un apunte; otras personas pueden reservar."}
                  </span>
                </span>
              </label>
            </>
          )}
          {esCita && (
            <p className="text-xs leading-relaxed text-tinta-suave">
              Si cambias la hora, acuerda el nuevo horario con la persona. El
              recordatorio de la PWA es para tu dispositivo.
            </p>
          )}
          {error && (
            <div
              ref={avisoError}
              tabIndex={-1}
              role="alert"
              className="rounded-xl border border-aviso/35 bg-aviso/10 p-3 text-sm text-aviso"
            >
              {error}
              {error.includes("Recarga") ||
              error.includes("Recarga".toLowerCase()) ? (
                <button
                  type="button"
                  onClick={() => {
                    router.refresh();
                    onCerrar();
                  }}
                  className="mt-2 block min-h-11 underline"
                >
                  Recargar agenda
                </button>
              ) : null}
            </div>
          )}
          {confirmarSalida && (
            <div
              ref={avisoSalida}
              tabIndex={-1}
              role="alert"
              className="rounded-xl border border-aviso/40 p-4"
            >
              <p className="text-sm">Tienes cambios sin guardar.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmarSalida(false)}
                  className="min-h-11 rounded-xl bg-white/10 px-3 text-sm"
                >
                  Seguir editando
                </button>
                <button
                  type="button"
                  onClick={onCerrar}
                  className="min-h-11 px-3 text-sm text-aviso"
                >
                  Descartar cambios
                </button>
              </div>
            </div>
          )}
          {disponible &&
            entrada?.tipo === "evento" &&
            (confirmarBorrado ? (
              <div className="rounded-xl border border-aviso/40 p-4">
                <p className="text-sm">
                  ¿Eliminar este evento y liberar su horario?
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() => setConfirmarBorrado(false)}
                    className="min-h-11 px-3 text-sm"
                  >
                    Conservar
                  </button>
                  <button
                    type="button"
                    disabled={pendiente}
                    onClick={() =>
                      empezar(async () => {
                        const r = await eliminarEvento(
                          entrada.id,
                          entrada.version,
                        );
                        if (!r.ok) setError(r.motivo);
                        else {
                          router.refresh();
                          onGuardado(
                            "Evento eliminado. Su horario vuelve a estar disponible.",
                          );
                        }
                      })
                    }
                    className="min-h-11 rounded-xl border border-aviso/50 px-3 text-sm text-aviso"
                  >
                    Sí, eliminar evento
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmarBorrado(true)}
                disabled={pendiente}
                className="min-h-11 text-sm text-aviso"
              >
                Eliminar evento…
              </button>
            ))}
        </div>
        <div className="sticky bottom-0 border-t border-white/10 bg-[#16223a] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
          <button
            disabled={pendiente || !disponible}
            type="submit"
            className="min-h-13 w-full rounded-2xl bg-acento px-5 text-base font-extrabold text-fondo disabled:opacity-50"
          >
            {pendiente
              ? "Guardando…"
              : entrada
                ? "Guardar cambios"
                : "Guardar en mi agenda"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
