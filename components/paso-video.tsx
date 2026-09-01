"use client";

import { useState } from "react";

import type { Servicio } from "@/lib/servicios";

/**
 * EL VIDEO, ANTES DE PEDIR NADA.
 *
 * Es lo primero que ve quien elige una preparación: Henry explicando qué es
 * esa audiencia y qué se hace en los 45 minutos. Va antes del pago y antes
 * del formulario a propósito — quien llega de TikTok no sabe qué está
 * comprando, y pedirle datos antes de explicárselo es lo que hace que se
 * vaya.
 *
 * ── Por qué NO se obliga a verlo entero ──
 *
 * Porque hay dos personas distintas al otro lado: la que llega perdida y
 * necesita los tres minutos, y la que ya habló con Henry por WhatsApp y sólo
 * quiere pagar. Bloquear el botón hasta el final castiga a la segunda y no
 * convence a la primera — quien no quiere ver un video lo deja correr en
 * silencio con el móvil boca abajo. El video se ofrece; seguir es decisión
 * suya.
 *
 * ── Por qué `preload="none"` ──
 *
 * Porque este público abre esto con datos contados. Sin esto, el navegador
 * empieza a descargar el video aunque nadie le dé al play, y en un plan de
 * datos eso se nota. Con el póster se ve de qué va antes de gastar un mega.
 *
 * ── Y si el archivo no está ──
 *
 * Se dice y se sigue. Un video que falla en silencio deja un rectángulo
 * negro y a alguien pensando que la página está rota; y quedarse ahí
 * atascado sería perder la reserva por un archivo que no cargó.
 */
export function PasoVideo({
  servicio,
  onContinuar,
}: {
  servicio: Servicio;
  onContinuar: () => void;
}) {
  const [falla, setFalla] = useState(false);

  return (
    <div className="mt-6 lg:mt-7">
      <h1 className="font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:text-[40px] lg:leading-[1.12]">
        Antes de nada, míralo
      </h1>
      <p className="mt-2.5 max-w-[46ch] text-[17px] leading-[1.5] text-tinta-suave">
        Henry te cuenta en un par de minutos qué es tu {servicio.nombre.toLowerCase()} y
        qué vais a hacer en los 45 minutos.
      </p>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-white/15 bg-panel">
        {falla ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <p className="text-[17px] leading-[1.5] text-tinta-suave">
              El video no se pudo cargar. No pasa nada — puedes seguir y
              preguntarle lo que sea en la sesión.
            </p>
          </div>
        ) : (
          <video
            key={servicio.id}
            controls
            playsInline
            preload="none"
            poster="/henry-retrato.jpg"
            onError={() => setFalla(true)}
            className="block aspect-video w-full bg-fondo object-cover"
          >
            <source src={`/videos/${servicio.id}.mp4`} type="video/mp4" />
            Tu navegador no puede reproducir este video.
          </video>
        )}
      </div>

      <button
        type="button"
        onClick={onContinuar}
        className="mt-6 flex min-h-[60px] w-full items-center justify-between rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo transition-transform active:scale-[0.99]"
      >
        <span>Continuar</span>
        <span className="tabular-nums">{`$${servicio.precioUsd}`}</span>
      </button>

      <div className="mt-6 flex items-center gap-2.5 border-t border-white/15 pt-4">
        <span
          aria-hidden="true"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-white/25 text-[12px] text-tinta-tenue"
        >
          3
        </span>
        <span className="text-[16px] text-tinta-tenue">
          Después: el pago, tu hora y tus datos.
        </span>
      </div>
    </div>
  );
}
