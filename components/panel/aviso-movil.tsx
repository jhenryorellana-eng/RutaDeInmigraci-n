"use client";

import { useEffect, useState, useTransition } from "react";
import {
  cambiarRecordatorio,
  consultarAviso,
  guardarAviso,
  probarAviso,
  quitarAviso,
} from "@/app/panel/avisos";

type Estado =
  | "cargando"
  | "imposible"
  | "bloqueado"
  | "apagado"
  | "encendido"
  | "error";

async function registroPush() {
  await navigator.serviceWorker.register("/sw.js");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, rechazar) => {
        timer = setTimeout(
          () => rechazar(new Error("La app no está lista")),
          10000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function AvisoMovil({
  clavePublica,
  recordatoriosDisponibles,
}: {
  clavePublica: string;
  recordatoriosDisponibles: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [endpoint, setEndpoint] = useState("");
  const [minutos, setMinutos] = useState<0 | 5 | null>(5);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [intento, setIntento] = useState(0);
  const [pendiente, empezar] = useTransition();

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window) ||
        !clavePublica
      ) {
        if (vivo) setEstado("imposible");
        return;
      }
      if (Notification.permission === "denied") {
        if (vivo) setEstado("bloqueado");
        return;
      }
      try {
        const registro = await registroPush();
        const s = await registro.pushManager.getSubscription();
        if (!vivo) return;
        if (!s) {
          setEstado("apagado");
          return;
        }
        const r = await consultarAviso(s.endpoint);
        if (!vivo) return;
        if (!r.ok) {
          setError(r.motivo);
          setEstado("error");
          return;
        }
        setEndpoint(s.endpoint);
        setMinutos(r.registrado ? r.minutos : 5);
        setEstado(r.registrado ? "encendido" : "apagado");
      } catch {
        if (vivo) {
          setEstado("error");
          setError(
            "No se pudo comprobar este dispositivo. Revisa tu conexión y vuelve a intentarlo.",
          );
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [clavePublica, intento]);

  function activar() {
    setError("");
    setMensaje("");
    empezar(async () => {
      try {
        // El permiso se solicita inmediatamente desde el gesto del usuario (iOS).
        const permiso = await Notification.requestPermission();
        if (permiso === "denied") {
          setEstado("bloqueado");
          return;
        }
        if (permiso !== "granted") {
          setMensaje(
            "Acepta el permiso para recibir avisos en este dispositivo.",
          );
          return;
        }
        const registro = await registroPush();
        const s =
          (await registro.pushManager.getSubscription()) ??
          (await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: aBytes(clavePublica),
          }));
        const bruto = s.toJSON();
        const r = await guardarAviso({
          endpoint: s.endpoint,
          p256dh: bruto.keys?.p256dh ?? "",
          auth: bruto.keys?.auth ?? "",
          descripcion: navigator.userAgent.slice(0, 80),
        });
        if (!r.ok) {
          setError(r.motivo);
          return;
        }
        if (recordatoriosDisponibles) {
          const preferencia = await cambiarRecordatorio(s.endpoint, minutos);
          if (!preferencia.ok) {
            setError(preferencia.motivo);
            return;
          }
        }
        setEndpoint(s.endpoint);
        setEstado("encendido");
        setMensaje(
          recordatoriosDisponibles
            ? "Avisos activados. Puedes probarlos ahora."
            : "Avisos de nuevas reservas activados.",
        );
      } catch {
        setError(
          "No se pudo activar. Comprueba tu conexión y los permisos de la app.",
        );
      }
    });
  }

  function desactivar() {
    setError("");
    setMensaje("");
    empezar(async () => {
      try {
        const r = await quitarAviso(endpoint);
        if (!r.ok) {
          setError(r.motivo);
          return;
        }
        // Tras quitarlo del servidor ya no puede recibir avisos, aunque falle
        // la baja local. Activar reutiliza y vuelve a registrar esa suscripción.
        const registro = await registroPush();
        const s = await registro.pushManager.getSubscription();
        await s?.unsubscribe().catch(() => false);
        setEstado("apagado");
        setMensaje("Avisos desactivados en este dispositivo.");
      } catch {
        setError(
          "No se pudo completar la desactivación. Comprueba la conexión.",
        );
        setIntento((v) => v + 1);
      }
    });
  }

  return (
    <section
      aria-labelledby="recordatorios-titulo"
      className="rounded-[22px] border border-acento/20 bg-gradient-to-br from-acento/[.07] to-transparent p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-acento/10 text-acento"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="recordatorios-titulo"
            className="font-titulo text-xl font-semibold"
          >
            Que no se te pase una cita
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-tinta-suave">
            Recibe un recordatorio en este dispositivo, incluso con la agenda
            cerrada.
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-[#16223a]/60 p-3 sm:p-4">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${estado === "encendido" ? "bg-acento" : "bg-aviso"}`}
          />
          {estado === "cargando"
            ? "Comprobando dispositivo…"
            : estado === "encendido"
              ? "Notificaciones activas en este dispositivo"
              : estado === "bloqueado"
                ? "Permiso bloqueado en el navegador"
                : estado === "imposible"
                  ? "Requiere una app o navegador compatible"
                  : estado === "error"
                    ? "No se pudo comprobar la suscripción"
                    : "Notificaciones desactivadas"}
        </p>
        {!recordatoriosDisponibles && (
          <p className="mt-3 text-sm text-aviso">
            Los recordatorios de horario están pendientes de activación. Los
            avisos de nuevas reservas mantienen su configuración.
          </p>
        )}
        {recordatoriosDisponibles &&
          (estado === "encendido" || estado === "apagado") && (
            <>
              <label className="mt-4 block text-sm font-semibold">
                Recordarme
                <select
                  aria-label="Cuándo recibir el recordatorio"
                  disabled={pendiente}
                  value={minutos === null ? "no" : minutos}
                  onChange={(e) => {
                    const valor =
                      e.target.value === "no"
                        ? null
                        : (Number(e.target.value) as 0 | 5);
                    if (estado !== "encendido") {
                      setMinutos(valor);
                      return;
                    }
                    setError("");
                    setMensaje("");
                    empezar(async () => {
                      try {
                        const r = await cambiarRecordatorio(endpoint, valor);
                        if (r.ok) {
                          setMinutos(valor);
                          setMensaje(
                            "Preferencia guardada para este dispositivo.",
                          );
                        } else setError(r.motivo);
                      } catch {
                        setError("No se pudo guardar la preferencia.");
                      }
                    });
                  }}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-[#16223a] px-3 text-base font-normal [color-scheme:dark]"
                >
                  <option value={5}>5 minutos antes</option>
                  <option value={0}>A la hora de la cita</option>
                  <option value="no">Sin recordatorios de horario</option>
                </select>
              </label>
              <p className="mt-2 text-xs leading-relaxed text-tinta-tenue">
                Incluye reservas confirmadas y tu agenda manual. Los avisos de
                nuevas reservas siguen activos.
              </p>
            </>
          )}
        {estado === "bloqueado" && (
          <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
            Permite las notificaciones en los ajustes de este sitio o de la app.
            Después vuelve a comprobar el permiso.
          </p>
        )}
        {estado === "imposible" && (
          <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
            {!clavePublica
              ? "Falta configurar la clave de notificaciones del sitio."
              : "En iPhone (iOS 16.4 o posterior), abre la agenda en Safari, toca Compartir → Añadir a pantalla de inicio. Abre la app instalada y activa los avisos. En Android puedes usar Chrome o instalar la app."}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {estado === "apagado" && (
            <button
              type="button"
              disabled={pendiente}
              onClick={activar}
              className="min-h-12 w-full rounded-xl bg-acento px-4 text-sm font-extrabold text-fondo sm:w-auto"
            >
              {pendiente ? "Activando…" : "Activar notificaciones"}
            </button>
          )}
          {estado === "encendido" && (
            <>
              {recordatoriosDisponibles && (
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => {
                    setError("");
                    setMensaje("");
                    empezar(async () => {
                      try {
                        const r = await probarAviso(endpoint);
                        if (r.ok)
                          setMensaje(
                            "Prueba solicitada al servidor. Comprueba si aparece el aviso en este dispositivo; puede tardar unos segundos.",
                          );
                        else setError(r.motivo);
                      } catch {
                        setError("No se pudo solicitar la prueba.");
                      }
                    });
                  }}
                  className="min-h-11 rounded-xl bg-acento px-4 text-sm font-bold text-fondo disabled:opacity-50"
                >
                  Probar notificación
                </button>
              )}
              <button
                type="button"
                disabled={pendiente}
                onClick={desactivar}
                className="min-h-11 rounded-xl border border-white/20 px-4 text-sm disabled:opacity-50"
              >
                Desactivar
              </button>
            </>
          )}
          {["bloqueado", "imposible", "error"].includes(estado) && (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                setError("");
                setEstado("cargando");
                setIntento((v) => v + 1);
              }}
              className="min-h-11 rounded-xl border border-white/20 px-4 text-sm"
            >
              Volver a comprobar
            </button>
          )}
        </div>
      </div>
      {mensaje && (
        <p role="status" className="mt-3 text-sm leading-relaxed text-acento">
          {mensaje}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-aviso">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-tinta-tenue">
        La entrega depende de tu conexión y los permisos del teléfono. Revisa
        también el modo «No molestar».
      </p>
    </section>
  );
}

function aBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const texto = atob(
    (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4))
      .replace(/-/g, "+")
      .replace(/_/g, "/"),
  );
  const bytes = new Uint8Array(new ArrayBuffer(texto.length));
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}
