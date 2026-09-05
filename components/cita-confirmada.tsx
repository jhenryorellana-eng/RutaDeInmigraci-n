"use client";
import { useEffect, useState } from "react";
import { CLAVE_CITA, enlaceWhatsapp } from "@/lib/pago";

type Resumen = { completa: string; utah: string };

/** El resumen local recuerda la hora solicitada; nunca acredita un pago. */
export function CitaConfirmada() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  useEffect(() => {
    try {
      const valor: unknown = JSON.parse(
        sessionStorage.getItem(CLAVE_CITA) ?? "null",
      );
      if (
        valor &&
        typeof valor === "object" &&
        "completa" in valor &&
        "utah" in valor &&
        typeof valor.completa === "string" &&
        typeof valor.utah === "string"
      ) {
        setResumen({ completa: valor.completa, utah: valor.utah });
      }
    } catch {
      /* El almacenamiento es opcional. */
    }
  }, []);

  return (
    <>
      <p className="lead">
        Si ya realizaste el pago, Henry te escribirá por WhatsApp para confirmar
        la sesión y coordinar los detalles.
      </p>
      <div className="receipt-detail">
        <span className="eyebrow">CONFIRMACIÓN POR WHATSAPP</span>
        {resumen ? (
          <p>
            Horario que solicitaste:
            <br />
            <strong>{resumen.completa}</strong>
          </p>
        ) : null}
        <p>
          La reserva requiere confirmar el pago y la disponibilidad del horario.
          Si aún no recibiste la confirmación, espera el mensaje de Henry antes de
          dar la cita por reservada.
        </p>
        <p>
          Si pagaste con Zelle, puedes enviarle el comprobante para facilitar la
          revisión. Si Henry ya te confirmó, conserva ese mensaje con los
          detalles de tu cita.
        </p>
        <a
          href={enlaceWhatsapp(resumen?.utah)}
          target="_blank"
          rel="noopener noreferrer"
          className="route-button"
        >
          Coordinar por WhatsApp <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  );
}
