"use client";
import { useId, useState } from "react";
import { motion } from "motion/react";
import { useMovimiento } from "./experiencia";
import { Flecha } from "./estructura";

const PASOS = [
  [
    "Elige tu momento",
    "Encuentra un día y una hora. La agenda te muestra tu hora local y la de Henry en Utah.",
  ],
  [
    "Completa tu reserva",
    "Deja tus datos y realiza el pago de $70. La sesión se confirma al verificar el pago y el horario.",
  ],
  [
    "Trae tus preguntas",
    "Henry te escribe por WhatsApp para coordinar los detalles. Lo demás, lo conversan juntos.",
  ],
];

export function PasosSesion() {
  const [abierto, setAbierto] = useState<number | null>(0);
  const movimiento = useMovimiento();
  const id = useId();
  return (
    <>
      <div className="journey-steps journey-desktop">
        <div className="journey-rail" aria-hidden="true">
          <span />
        </div>
        {PASOS.map(([titulo, texto], i) => (
          <article className="journey-step" key={titulo}>
            <span>0{i + 1}</span>
            <div>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </div>
            <Flecha diagonal />
          </article>
        ))}
      </div>
      <div className="journey-mobile">
        <p className="journey-mobile-hint">
          Así será nuestro encuentro <span>3 pasos</span>
        </p>
        {PASOS.map(([titulo, texto], i) => (
          <div
            className="journey-mobile-step"
            data-open={abierto === i}
            key={titulo}
          >
            <h3>
              <button
                type="button"
                id={`${id}-paso-${i}`}
                aria-expanded={abierto === i}
                aria-controls={`${id}-detalle-${i}`}
                onClick={() => setAbierto(abierto === i ? null : i)}
              >
                <span>0{i + 1}</span>
                <strong>{titulo}</strong>
                <span aria-hidden="true">{abierto === i ? "−" : "+"}</span>
              </button>
            </h3>
            <motion.div
              id={`${id}-detalle-${i}`}
              role="region"
              aria-labelledby={`${id}-paso-${i}`}
              aria-hidden={abierto !== i}
              inert={abierto !== i}
              initial={false}
              animate={{
                height: abierto === i ? "auto" : 0,
                opacity: abierto === i ? 1 : 0,
              }}
              transition={{ duration: movimiento ? 0.24 : 0 }}
            >
              <p>{texto}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </>
  );
}
