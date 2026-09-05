"use client";
import { useMemo, useState } from "react";
import type { DiaConHuecos } from "@/lib/citas";
import { diaSemanaDe } from "@/lib/horario";
const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
export function CalendarioMes({
  dias,
  onElegir,
  elegido,
}: {
  dias: DiaConHuecos[];
  onElegir: (clave: string, porPuntero?: boolean) => void;
  elegido?: string | null;
}) {
  const meses = useMemo(
    () => [...new Set(dias.map((d) => d.clave.slice(0, 7)))],
    [dias],
  );
  const [indice, setIndice] = useState(() =>
    Math.max(0, meses.indexOf(elegido?.slice(0, 7) ?? "")),
  );
  const porClave = useMemo(
    () => new Map(dias.map((d) => [d.clave, d])),
    [dias],
  );
  const actual = meses[indice] ?? meses[0];
  if (!actual) return null;
  const [anio, mes] = actual.split("-").map(Number);
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const casillas = [
    ...Array.from({ length: diaSemanaDe(anio, mes, 1) - 1 }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  return (
    <div className="booking-calendar">
      <div className="month-heading">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={indice === 0}
          onClick={() => setIndice((i) => i - 1)}
        >
          ←
        </button>
        <strong aria-live="polite">
          {MESES[mes - 1]} {anio}
        </strong>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={indice >= meses.length - 1}
          onClick={() => setIndice((i) => i + 1)}
        >
          →
        </button>
      </div>
      <div className="month-grid" aria-hidden="true">
        {["L", "M", "X", "J", "V", "S", "D"].map((letra, i) => (
          <span key={i}>{letra}</span>
        ))}
      </div>
      <div className="month-grid month-days">
        {casillas.map((numero, i) => {
          if (numero === null) return <span key={`empty-${i}`} />;
          const clave = `${actual}-${String(numero).padStart(2, "0")}`;
          const dia = porClave.get(clave);
          const libres = dia?.huecos.filter((h) => h.libre).length ?? 0;
          if (!dia?.huecos.length)
            return (
              <span
                key={clave}
                aria-label={`${numero} de ${MESES[mes - 1]}, sin horario`}
              >
                {numero}
              </span>
            );
          return (
            <button
              key={clave}
              type="button"
              disabled={libres === 0}
              aria-pressed={elegido === clave}
              aria-label={`${numero} de ${MESES[mes - 1]}, ${libres} horas libres`}
              onClick={(event) => onElegir(clave, event.detail > 0)}
            >
              <span>{numero}</span>
              <small className="day-availability-text" aria-hidden="true">
                {libres ? `${libres} libres` : "lleno"}
              </small>
              <span className="day-availability-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="calendar-note">
        <span className="calendar-desktop-note">
          Los días disponibles muestran sus horas libres. Calendario de Utah.
        </span>
        <span className="calendar-mobile-note">
          <i aria-hidden="true" /> Días disponibles · Calendario de Utah
        </span>
      </p>
    </div>
  );
}
