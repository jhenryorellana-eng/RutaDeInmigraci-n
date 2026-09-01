"use client";

import { useMemo, useState } from "react";

import type { DiaConHuecos } from "@/lib/citas";
import { diaSemanaDe } from "@/lib/horario";

/**
 * EL MES ENTERO, PARA ELEGIR EL DÍA.
 *
 * Antes esta pantalla enseñaba seis botones: los seis próximos días con
 * horas. Servía cuando quien reservaba quería «lo antes posible», y fallaba
 * en cuanto alguien tenía una fecha en la cabeza — «el 10» no aparecía y no
 * había forma de llegar a él. Pasó de verdad.
 *
 * Ahora se ve el mes, como en cualquier agenda: se reconoce la fecha de un
 * vistazo y se toca.
 *
 * ── Hasta dónde se puede mirar ──
 *
 * Sesenta días. No es una elección de esta pantalla: es el tope que
 * `horas_ocupadas()` impone en la base para que nadie pueda barrer el
 * calendario entero con la clave pública. Las flechas del mes no pasan de
 * ahí, y el último día visible es exactamente el último que se puede
 * reservar.
 *
 * ── Los tres estados de un día, y por qué el «lleno» se puede tocar ──
 *
 *   · con horas libres → se toca, y dice cuántas quedan;
 *   · cerrado (Henry no atiende, o ya pasó) → apagado, no se toca;
 *   · LLENO → se toca igual. Un botón muerto escondería la agenda: quien
 *     cayera ahí no vería que Henry atiende ese día, vería un hueco. Entra y
 *     encuentra las horas tachadas, que dicen dos cosas que el botón muerto
 *     callaba — que hay horario, y que está tomado.
 *
 * ── Y lo que NO sabe ──
 *
 * Zonas horarias. La fecha de cada día viene ya resuelta en hora de Utah
 * desde el servidor, en la `clave` («2026-09-10»). Aquí sólo se coloca en
 * su casilla. Volver a calcularla desde un instante con `getDate()` daría
 * el día equivocado por la tarde, cuando en UTC ya es mañana.
 */

const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const CABECERA = ["L", "M", "X", "J", "V", "S", "D"];

type Mes = { anio: number; mes: number };

function mesDe(claveDia: string): Mes {
  return { anio: Number(claveDia.slice(0, 4)), mes: Number(claveDia.slice(5, 7)) };
}

function mismoMes(a: Mes, b: Mes): boolean {
  return a.anio === b.anio && a.mes === b.mes;
}

function diasDelMes(anio: number, mes: number): number {
  /* El día 0 del mes siguiente es el último de éste. En UTC para que no lo
     mueva la zona del navegador. */
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

export function CalendarioMes({
  dias,
  onElegir,
}: {
  dias: DiaConHuecos[];
  onElegir: (clave: string) => void;
}) {
  /* Los meses que tienen al menos un día en la ventana, en orden. Es lo que
     limita las flechas: no se puede ir a un mes en el que no hay nada que
     reservar. */
  const meses = useMemo<Mes[]>(() => {
    const vistos: Mes[] = [];
    for (const d of dias) {
      const m = mesDe(d.clave);
      if (!vistos.some((v) => mismoMes(v, m))) vistos.push(m);
    }
    return vistos;
  }, [dias]);

  const porClave = useMemo(() => new Map(dias.map((d) => [d.clave, d])), [dias]);

  const [indice, setIndice] = useState(0);
  const actual = meses[indice] ?? meses[0];

  if (!actual) return null;

  const total = diasDelMes(actual.anio, actual.mes);
  /* Cuántas casillas vacías van antes del día 1 para que caiga en su
     columna: un lunes son cero, un domingo son seis. */
  const huecoInicial = diaSemanaDe(actual.anio, actual.mes, 1) - 1;

  const casillas: (number | null)[] = [
    ...Array.from({ length: huecoInicial }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-5 lg:mt-[18px]">
      {/* ── Cabecera: el mes y las flechas ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indice === 0}
          aria-label="Mes anterior"
          className="flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-acento disabled:opacity-25 disabled:hover:border-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="text-[18px] font-bold capitalize tracking-[-0.01em]">
          {NOMBRES_MES[actual.mes - 1]} {actual.anio}
        </span>

        <button
          type="button"
          onClick={() => setIndice((i) => Math.min(meses.length - 1, i + 1))}
          disabled={indice >= meses.length - 1}
          aria-label="Mes siguiente"
          className="flex size-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-acento disabled:opacity-25 disabled:hover:border-white/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* ── Las iniciales de los días ── */}
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {CABECERA.map((letra, i) => (
          <span
            key={letra + i}
            className="text-center text-[12px] font-bold uppercase tracking-[0.08em] text-tinta-tenue"
          >
            {letra}
          </span>
        ))}
      </div>

      {/* ── La rejilla ── */}
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {casillas.map((numero, i) => {
          if (numero === null) return <span key={`vacio-${i}`} aria-hidden="true" />;

          const claveDia = `${actual.anio}-${String(actual.mes).padStart(2, "0")}-${String(numero).padStart(2, "0")}`;
          const dia = porClave.get(claveDia);
          const libres = dia ? dia.huecos.filter((h) => h.libre).length : 0;
          const ofrecido = !!dia && dia.huecos.length > 0;

          /* Fuera de la ventana o sin horario ese día: apagado y sin toque.
             No se distingue entre «Henry no atiende los domingos» y «ya
             pasó» porque para quien reserva es lo mismo: ahí no hay nada. */
          if (!ofrecido) {
            return (
              <span
                key={claveDia}
                className="flex min-h-[52px] flex-col items-center justify-center rounded-[14px] text-[16px] text-apagado/60 lg:min-h-[60px]"
              >
                {numero}
              </span>
            );
          }

          const lleno = libres === 0;
          return (
            <button
              key={claveDia}
              type="button"
              onClick={() => onElegir(claveDia)}
              aria-label={
                lleno
                  ? `${numero} de ${NOMBRES_MES[actual.mes - 1]}, lleno`
                  : `${numero} de ${NOMBRES_MES[actual.mes - 1]}, ${libres} ${libres === 1 ? "hora libre" : "horas libres"}`
              }
              className={
                lleno
                  ? "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-white/10 text-apagado transition-colors hover:border-white/30 lg:min-h-[60px]"
                  : "flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[14px] border border-white/25 transition-colors hover:border-acento lg:min-h-[60px]"
              }
            >
              <span className="text-[17px] font-extrabold leading-none tracking-[-0.02em] lg:text-[18px]">
                {numero}
              </span>
              <span className={lleno ? "text-[11px]" : "text-[11px] text-acento"}>
                {lleno ? "lleno" : `${libres}h`}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[14px] leading-[1.45] text-tinta-tenue">
        Se puede reservar hasta dos meses por delante. Los días apagados no
        tienen horario.
      </p>
    </div>
  );
}
