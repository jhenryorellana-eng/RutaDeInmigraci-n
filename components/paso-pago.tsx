"use client";

import { useState, useTransition } from "react";

import { abrirPagoConTarjeta } from "@/app/reservar/pagar";
import {
  ZELLE_NOMBRE,
  ZELLE_TELEFONO,
  ZELLE_TELEFONO_CRUDO,
  enlaceWhatsapp,
} from "@/lib/pago";
import type { Servicio } from "@/lib/servicios";
import { codigoParaMostrar } from "@/lib/zelle/dominio";

/** El pago corresponde a una solicitud. La hora se confirma al verificar el pago y su disponibilidad. */

type Metodo = "elegir" | "tarjeta" | "zelle";

export function PasoPago({
  servicio,
  solicitudId,
  codigoPago,
  correo,
  hayTarjeta,
  onListo,
}: {
  servicio: Servicio;
  solicitudId: number;
  codigoPago: string;
  correo: string;
  /** Falso si Stripe no está configurado: entonces no se ofrece la tarjeta. */
  hayTarjeta: boolean;
  onListo: () => void;
}) {
  const [metodo, setMetodo] = useState<Metodo>("elegir");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();

  async function copiar(texto: string, cual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* Sin portapapeles queda el dato a la vista para teclearlo. */
    }
  }

  function irATarjeta() {
    setError(null);
    empezar(async () => {
      try {
        const r = await abrirPagoConTarjeta({ solicitudId, servicioId: servicio.id, correo });
        if ("url" in r) window.location.href = r.url;
        else setError(r.error);
      } catch {
        setError("No se pudo abrir el pago. Vuelve a intentarlo.");
      }
    });
  }

  return (
    <div className="mt-6 lg:mt-7">
      <h2 className="font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:text-[40px] lg:leading-[1.12]">
        Último paso: el pago
      </h2>
      {/* Se dice claro que la hora NO está guardada todavía. Prometer lo
          contrario para que alguien pague tranquilo sería mentir, y esa
          mentira se descubre justo en el peor momento. */}
      <p className="mt-2.5 max-w-[46ch] text-[17px] leading-[1.5] text-tinta-suave">
        Tu reserva se confirma al <strong className="font-bold text-tinta">verificar el pago y la disponibilidad</strong>. Mientras tanto, la hora sigue disponible para otras personas.
      </p>

      {/* ── Elegir método ── */}
      {metodo === "elegir" ? (
        <div className="mt-6 flex flex-col gap-2.5">
          {hayTarjeta ? (
            <button
              type="button"
              onClick={irATarjeta}
              disabled={enCurso}
              className="flex min-h-[76px] items-center gap-4 rounded-[20px] border-2 border-acento bg-acento/10 px-5 py-4 text-left disabled:opacity-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] font-bold tracking-[-0.01em]">
                  {enCurso ? "Abriendo…" : "Pagar con tarjeta"}
                </span>
                <span className="mt-0.5 block text-[15px] text-tinta-suave">
                  Pago seguro a través de Stripe.
                </span>
              </span>
              <span className="shrink-0 text-[22px] font-extrabold tabular-nums text-acento">
                ${servicio.precioUsd}
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setMetodo("zelle")}
            className="flex min-h-[76px] items-center gap-4 rounded-[20px] border border-white/25 px-5 py-4 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[19px] font-bold tracking-[-0.01em]">
                Pagar con Zelle
              </span>
              <span className="mt-0.5 block text-[15px] text-tinta-suave">
                Desde la app de tu banco. Requiere verificar el pago.
              </span>
            </span>
            <span className="shrink-0 text-[22px] font-extrabold tabular-nums">
              ${servicio.precioUsd}
            </span>
          </button>

          {error ? (
            <p role="alert" className="text-[15px] leading-[1.45] text-aviso">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Zelle ── */}
      {metodo === "zelle" ? (
        <>
          {/* El código, en grande y lo primero. Es lo único de esta pantalla
              que quien paga tiene que llevarse a otra aplicación, y va antes
              que los datos del banco porque es lo que se olvida. */}
          <div className="mt-6 rounded-[24px] border-2 border-acento bg-acento/10 p-5 text-center">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-acento">
              Escribe esto en el memo
            </p>
            <p className="mt-2 text-[46px] font-extrabold leading-none tracking-[0.06em] tabular-nums">
              {codigoParaMostrar(codigoPago)}
            </p>
            <button
              type="button"
              onClick={() => copiar(codigoParaMostrar(codigoPago), "codigo")}
              className="mt-3 min-h-11 rounded-full border border-acento/50 px-5 text-[15px] font-bold text-acento"
            >
              {copiado === "codigo" ? "Copiado" : "Copiar el código"}
            </button>
            <p className="mt-3 text-[15px] leading-[1.45] text-tinta-suave">
              Este código ayuda a identificar tu pago. Inclúyelo en la nota o memo de la transferencia.
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/15 bg-panel p-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-tinta-tenue">
                Zelle
              </span>
              <span className="text-[26px] font-extrabold tabular-nums tracking-[-0.02em]">
                ${servicio.precioUsd}
              </span>
            </div>
            <Dato
              etiqueta="A nombre de"
              valor={ZELLE_NOMBRE}
              copiado={copiado === "nombre"}
              onCopiar={() => copiar(ZELLE_NOMBRE, "nombre")}
            />
            <Dato
              etiqueta="Al número"
              valor={ZELLE_TELEFONO}
              copiado={copiado === "telefono"}
              onCopiar={() => copiar(ZELLE_TELEFONO_CRUDO, "telefono")}
            />
            <p className="mt-5 text-[16px] leading-[1.45] text-tinta-suave">
              Abre la app de tu banco, busca Zelle y manda los ${servicio.precioUsd} a
              ese número. Comprueba que sale el nombre de arriba antes de enviar.
            </p>
          </div>

          <a
            href={enlaceWhatsapp()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full border border-white/25 px-6 text-[16px] font-bold"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
            </svg>
            Enviar comprobante por WhatsApp
          </a>

          <button
            type="button"
            onClick={onListo}
            className="mt-4 flex min-h-[60px] w-full items-center justify-center rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo"
          >
            Ya envié el pago
          </button>

          <p className="mt-4 text-[15px] leading-[1.45] text-tinta-tenue">
            El pago debe verificarse antes de confirmar la reserva. Henry te escribirá por WhatsApp con los detalles de tu sesión.
          </p>

          <button
            type="button"
            onClick={() => setMetodo("elegir")}
            className="mt-3 min-h-11 text-[15px] text-tinta-tenue underline underline-offset-4"
          >
            Prefiero pagar de otra forma
          </button>
        </>
      ) : null}
    </div>
  );
}

function Dato({
  etiqueta,
  valor,
  copiado,
  onCopiar,
}: {
  etiqueta: string;
  valor: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  return (
    <div className="mt-5 flex items-end justify-between gap-3 border-t border-white/12 pt-4">
      <span className="min-w-0">
        <span className="block text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
          {etiqueta}
        </span>
        <span className="mt-1 block break-words text-[19px] font-bold leading-[1.25]">
          {valor}
        </span>
      </span>
      <button
        type="button"
        onClick={onCopiar}
        className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/25 px-4 text-[15px] font-bold"
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
