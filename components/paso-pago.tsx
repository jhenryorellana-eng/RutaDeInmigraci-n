"use client";

import { useState } from "react";

import {
  ZELLE_NOMBRE,
  ZELLE_TELEFONO,
  ZELLE_TELEFONO_CRUDO,
  enlaceWhatsapp,
} from "@/lib/pago";
import type { Servicio } from "@/lib/servicios";

/**
 * EL PAGO, ANTES DE ELEGIR LA HORA.
 *
 * ── Lo que esta pantalla NO puede hacer, y por eso lo dice ──
 *
 * Comprobar que se ha pagado. El pago es por Zelle y ocurre entero dentro
 * del banco de cada uno: Zelle no avisa a nadie más que al banco de Henry,
 * así que este sitio no lo ve. El botón de abajo no es una puerta — es una
 * declaración de quien la pulsa, y quien quiera saltársela puede.
 *
 * Esa es una decisión tomada a sabiendas: se prefiere una fricción honesta
 * antes de la agenda a una pasarela de pago. Quien lo cambie, que cambie
 * también este comentario.
 *
 * ── El riesgo de cobrar antes de apartar, y cómo se amortigua ──
 *
 * Cobrando primero aparece un problema que el orden anterior no tenía: la
 * persona paga, tarda diez minutos en el banco, vuelve, y su hora ya no
 * está. Zelle no se puede revertir, así que eso es una devolución a mano y
 * una persona enfadada con razón.
 *
 * No se puede eliminar sin bloquear la hora antes de cobrar —que es
 * justamente el orden que se descartó— pero sí se puede amortiguar: esta
 * pantalla dice CUÁNTAS HORAS QUEDAN LIBRES antes de que nadie abra el
 * banco. Nadie paga a ciegas, y si quedan dos horas en tres semanas, se
 * entera antes y no después.
 *
 * ── Los datos se copian con un botón ──
 *
 * Porque el paso siguiente es teclearlos en la app del banco, casi siempre
 * en el mismo teléfono. Un número de nueve cifras copiado a mano desde otra
 * pantalla es donde se cuela el dígito que manda el dinero a un desconocido.
 */
export function PasoPago({
  servicio,
  horasLibres,
  onPagado,
}: {
  servicio: Servicio;
  /** Cuántos huecos quedan en los próximos días. Se dice antes de cobrar. */
  horasLibres: number;
  onPagado: () => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(texto: string, cual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(cual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* Sin permiso de portapapeles queda el dato a la vista para teclearlo. */
    }
  }

  return (
    <div className="mt-6 lg:mt-7">
      <h1 className="font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:text-[40px] lg:leading-[1.12]">
        Ahora el pago
      </h1>
      <p className="mt-2.5 max-w-[46ch] text-[17px] leading-[1.5] text-tinta-suave">
        {servicio.nombre} · {servicio.etapa}. Se paga por Zelle, desde tu propio
        banco.
      </p>

      {/* Cuántas horas quedan, ANTES de mandar a nadie a su banco. */}
      <p
        className={
          horasLibres === 0
            ? "mt-4 rounded-2xl border border-aviso/40 bg-aviso/10 px-4 py-3 text-[16px] leading-[1.45] text-aviso"
            : "mt-4 rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[16px] leading-[1.45] text-tinta-suave"
        }
      >
        {horasLibres === 0 ? (
          <>
            Ahora mismo <strong className="font-bold">no quedan horas libres</strong>.
            No pagues todavía: vuelve mañana, que se abren huecos nuevos cada día.
          </>
        ) : (
          <>
            Quedan{" "}
            <strong className="font-bold text-tinta">
              {horasLibres} {horasLibres === 1 ? "hora libre" : "horas libres"}
            </strong>{" "}
            en los próximos días. Eliges la tuya en cuanto vuelvas de pagar.
          </>
        )}
      </p>

      {/* ── Los datos para el banco ── */}
      <div className="mt-4 rounded-[24px] border border-acento/40 bg-panel p-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-acento">
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
        className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-3 rounded-full border border-acento/50 px-6 text-[16px] font-bold text-acento"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
        Mandarle el comprobante
      </a>

      <button
        type="button"
        onClick={onPagado}
        className="mt-4 flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo transition-transform active:scale-[0.99]"
      >
        Ya hice el pago · elegir mi hora
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Lo que el sitio no sabe, dicho donde se decide. */}
      <p className="mt-4 text-[15px] leading-[1.45] text-tinta-tenue">
        Este sitio no ve tu banco: quien confirma el pago es Henry, a mano.
        Tu hora todavía no está apartada — la eliges en el paso siguiente.
      </p>
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
        {copiado ? (
          <>
            <svg
              aria-hidden="true"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copiado
          </>
        ) : (
          "Copiar"
        )}
      </button>
    </div>
  );
}
