"use client";

import { useEffect, useState, useTransition } from "react";

import { guardarAviso, quitarAviso } from "@/app/panel/avisos";

/**
 * EL AVISO EN EL TELÉFONO.
 *
 * Un interruptor: encendido, cada vez que alguien aparta una hora el
 * teléfono de Henry suena.
 *
 * ── Los tres estados que hay que distinguir, y por qué ──
 *
 * «No se puede», «no lo has activado» y «lo has bloqueado» son cosas muy
 * distintas y llevan a acciones distintas. Un botón que en los tres casos
 * dice «activar» y no hace nada es el peor de los mundos: se toca, no pasa
 * nada, y no hay forma de saber por qué.
 *
 *   · si el navegador no puede, se dice y no se ofrece el botón;
 *   · si está bloqueado, se explica que hay que desbloquearlo en los ajustes
 *     del navegador, porque desde aquí ya no se puede volver a preguntar —
 *     una vez que alguien dice que no, el navegador no vuelve a mostrar el
 *     diálogo;
 *   · y si sólo falta activarlo, el botón hace su trabajo.
 *
 * ── En iPhone hay un paso previo ──
 *
 * Safari sólo deja avisar si la web está INSTALADA en la pantalla de inicio.
 * Desde una pestaña normal, `Notification` ni siquiera existe, así que la
 * pantalla lo dice en vez de dejar a alguien tocando un botón que nunca va a
 * funcionar.
 */

type Estado = "cargando" | "imposible" | "bloqueado" | "apagado" | "encendido";

export function AvisoMovil({ clavePublica }: { clavePublica: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();

  useEffect(() => {
    let vivo = true;

    (async () => {
      const puede =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!puede || !clavePublica) {
        if (vivo) setEstado("imposible");
        return;
      }
      if (Notification.permission === "denied") {
        if (vivo) setEstado("bloqueado");
        return;
      }

      try {
        const registro = await navigator.serviceWorker.ready;
        const suscrito = await registro.pushManager.getSubscription();
        if (vivo) setEstado(suscrito ? "encendido" : "apagado");
      } catch {
        if (vivo) setEstado("imposible");
      }
    })();

    return () => {
      vivo = false;
    };
  }, [clavePublica]);

  function encender() {
    setError(null);
    empezar(async () => {
      try {
        const permiso = await Notification.requestPermission();
        if (permiso === "denied") {
          setEstado("bloqueado");
          return;
        }
        if (permiso !== "granted") return;

        const registro = await navigator.serviceWorker.ready;
        const suscripcion = await registro.pushManager.subscribe({
          /* Obligatorio en todos los navegadores: promete que cada aviso que
             llegue se le va a ENSEÑAR a la persona. Sin esto, la suscripción
             se rechaza — y con razón: un push silencioso es un rastreador. */
          userVisibleOnly: true,
          applicationServerKey: aBytes(clavePublica),
        });

        const bruto = suscripcion.toJSON();
        const r = await guardarAviso({
          endpoint: suscripcion.endpoint,
          p256dh: bruto.keys?.p256dh ?? "",
          auth: bruto.keys?.auth ?? "",
          descripcion: navigator.userAgent.slice(0, 80),
        });

        if (r.ok) setEstado("encendido");
        else {
          setError(r.motivo);
          /* Si no se pudo guardar, se deshace la suscripción del navegador:
             dejarla viva significaría que el teléfono cree que está avisado
             y la base no sabe de él. */
          await suscripcion.unsubscribe().catch(() => {});
        }
      } catch {
        setError("No se pudo activar en este teléfono.");
      }
    });
  }

  function apagar() {
    setError(null);
    empezar(async () => {
      try {
        const registro = await navigator.serviceWorker.ready;
        const suscripcion = await registro.pushManager.getSubscription();
        if (suscripcion) {
          await quitarAviso(suscripcion.endpoint);
          await suscripcion.unsubscribe();
        }
        setEstado("apagado");
      } catch {
        setError("No se pudo desactivar.");
      }
    });
  }

  if (estado === "cargando") return null;

  return (
    <div className="rounded-[20px] border border-white/12 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <div className="min-w-0">
          <p className="text-[17px] font-bold">Avisarme en el teléfono</p>
          <p className="mt-1 max-w-[52ch] text-[16px] leading-[1.45] text-tinta-suave">
            {estado === "encendido"
              ? "Este teléfono suena cuando alguien aparta una hora."
              : estado === "bloqueado"
                ? "Los avisos están bloqueados en este navegador. Se desbloquean en sus ajustes, en los permisos de este sitio — desde aquí ya no se puede volver a preguntar."
                : estado === "imposible"
                  ? "Este navegador no puede avisar. En un iPhone hay que instalar antes la agenda en la pantalla de inicio: compartir y «Añadir a inicio»."
                  : "Cuando alguien aparte una hora, este teléfono te avisa con su nombre y la hora."}
          </p>
        </div>

        {estado === "encendido" ? (
          <button
            type="button"
            onClick={apagar}
            disabled={enCurso}
            className="min-h-11 shrink-0 rounded-full border border-white/25 px-5 text-[15px] font-bold disabled:opacity-50"
          >
            {enCurso ? "…" : "Desactivar"}
          </button>
        ) : estado === "apagado" ? (
          <button
            type="button"
            onClick={encender}
            disabled={enCurso}
            className="min-h-11 shrink-0 rounded-full bg-acento px-6 text-[15px] font-extrabold text-fondo disabled:opacity-50"
          >
            {enCurso ? "Activando…" : "Activar"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[16px] text-aviso">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * La clave VAPID, de texto a bytes.
 *
 * `applicationServerKey` no acepta la cadena tal cual: quiere los bytes. Y
 * la clave viene en base64 «de URL», que cambia `+` por `-`, `/` por `_` y
 * se come el relleno — hay que deshacer las tres cosas antes de decodificar,
 * o el navegador rechaza la suscripción con un error que no explica nada.
 */
function aBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);

  /* El `ArrayBuffer` se crea a mano y no se deja al constructor: desde
     TypeScript 5.7 un `Uint8Array` suelto puede ir sobre memoria compartida,
     y `applicationServerKey` no la acepta. Diciéndolo aquí, el tipo cuadra
     sin castings. */
  const buffer = new ArrayBuffer(crudo.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}
