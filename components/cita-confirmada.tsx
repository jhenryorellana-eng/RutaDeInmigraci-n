"use client";
import { useEffect, useState } from "react";
import { CLAVE_CITA, enlaceCambioDeHora, enlaceWhatsapp } from "@/lib/pago";
import { MINUTOS_SESION } from "@/lib/servicios";

type Resumen = {
  completa: string;
  utah: string;
  servicio?: string;
  precio?: number;
  tema?: string;
};

/** Cómo dice que pagó. Viene de la URL, así que sólo cambia el texto: nunca acredita nada. */
export type MetodoDeVuelta = "tarjeta" | "zelle" | null;

function texto(valor: object, clave: string): string | undefined {
  const v = (valor as Record<string, unknown>)[clave];
  return typeof v === "string" ? v : undefined;
}

/** El resumen local recuerda la hora solicitada; nunca acredita un pago. */
export function CitaConfirmada({ metodo }: { metodo: MetodoDeVuelta }) {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  useEffect(() => {
    try {
      const valor: unknown = JSON.parse(
        sessionStorage.getItem(CLAVE_CITA) ?? "null",
      );
      if (!valor || typeof valor !== "object") return;
      const completa = texto(valor, "completa");
      const utah = texto(valor, "utah");
      if (!completa || !utah) return;
      const precio = (valor as Record<string, unknown>).precio;
      setResumen({
        completa,
        utah,
        servicio: texto(valor, "servicio"),
        precio:
          typeof precio === "number" && Number.isFinite(precio)
            ? precio
            : undefined,
        tema: texto(valor, "tema"),
      });
    } catch {
      /* El almacenamiento es opcional. */
    }
  }, []);

  /* La URL de vuelta la puede escribir cualquiera, así que ninguno de estos
     textos dice «pagado»: dicen qué se está comprobando. */
  const lead =
    metodo === "tarjeta"
      ? "Gracias. En cuanto Stripe confirme el cobro, tu hora queda reservada y Henry te escribirá por WhatsApp para coordinar los detalles."
      : metodo === "zelle"
        ? "Gracias. Cuando Henry verifique tu transferencia, te escribirá por WhatsApp para confirmar la sesión."
        : "Si ya realizaste el pago, Henry te escribirá por WhatsApp para confirmar la sesión y coordinar los detalles.";

  const pasos: [string, string][] = [
    ["Solicitud enviada", "Recibimos tu horario y tus datos de contacto."],
    [
      "Verificación del pago",
      metodo === "tarjeta"
        ? "Stripe confirma el cobro y la hora queda guardada para ti."
        : "Henry comprueba tu transferencia y que la hora siga libre.",
    ],
    [
      "Confirmación por WhatsApp",
      "Henry te escribe con los detalles. Hasta entonces, no des la cita por reservada.",
    ],
    [
      "Tu sesión con Henry",
      `${MINUTOS_SESION} minutos para ti. Trae anotadas las preguntas que más te importan.`,
    ],
  ];
  const estados = ["hecho", "ahora", "luego", "luego"];

  return (
    <>
      <p className="lead">{lead}</p>

      {resumen ? (
        <div className="receipt-summary">
          <span className="eyebrow">TU SOLICITUD</span>
          <strong>{resumen.completa}</strong>
          <span>{resumen.utah} en Utah</span>
          {resumen.servicio || resumen.tema ? (
            <ul>
              {resumen.servicio ? (
                <li>
                  {resumen.servicio}
                  {resumen.precio !== undefined
                    ? ` · $${resumen.precio} USD`
                    : ""}
                </li>
              ) : null}
              {resumen.tema ? <li>Punto de partida: {resumen.tema}</li> : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="receipt-detail">
        <span className="eyebrow">QUÉ PASA AHORA</span>
        <ol className="receipt-steps">
          {pasos.map(([titulo, detalle], i) => (
            <li key={titulo} data-estado={estados[i]}>
              <span aria-hidden="true">{i === 0 ? "✓" : i + 1}</span>
              <div>
                <strong>
                  {titulo}
                  {i === 0 ? <span className="sr-only"> (hecho)</span> : null}
                  {i === 1 ? <span className="sr-only"> (en curso)</span> : null}
                </strong>
                <p>{detalle}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="receipt-actions">
          <a
            href={enlaceWhatsapp(resumen?.utah, resumen?.tema)}
            target="_blank"
            rel="noopener noreferrer"
            className="route-button"
          >
            Escribir a Henry por WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <a
            href={enlaceCambioDeHora(resumen?.utah)}
            target="_blank"
            rel="noopener noreferrer"
            className="link-button"
          >
            Necesito cambiar la hora
          </a>
        </div>
      </div>
    </>
  );
}
