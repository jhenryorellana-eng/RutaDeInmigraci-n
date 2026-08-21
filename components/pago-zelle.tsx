"use client";

import { useEffect, useState } from "react";

import {
  CLAVE_CITA,
  PRECIO_USD,
  ZELLE_NOMBRE,
  ZELLE_TELEFONO,
  ZELLE_TELEFONO_CRUDO,
  enlaceWhatsapp,
} from "@/lib/pago";

/**
 * CÓMO SE PAGA, DESPUÉS DE APARTAR.
 *
 * La hora ya está apartada cuando se llega aquí. Esto no es una caja: es una
 * instrucción. Se enseña a dónde mandar el dinero y por dónde avisar, y el
 * pago ocurre entero dentro del banco de cada uno.
 *
 * ── Por qué los datos se copian con un botón ──
 *
 * Porque el siguiente paso es teclearlos en la app del banco, casi siempre
 * en el mismo teléfono. Un número de nueve cifras copiado a mano desde otra
 * pantalla es donde se cuela el dígito que manda el dinero a un desconocido,
 * y Zelle no se puede revertir.
 *
 * ── De dónde sale la hora ──
 *
 * De `sessionStorage`, escrito por la pantalla anterior. NO de la URL: una
 * dirección se queda en el historial del teléfono y en el portapapeles de
 * quien la copie. Y se lee dentro de un efecto, no al pintar, porque en el
 * servidor no existe y React protestaría por la diferencia.
 */

type Cita = { completa: string; utah: string };

export function PagoZelle() {
  const [cita, setCita] = useState<Cita | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_CITA);
      if (crudo) setCita(JSON.parse(crudo) as Cita);
    } catch {
      /* Modo privado, almacenamiento bloqueado o un JSON de una versión
         anterior. Sin la hora se sigue pudiendo pagar, que es lo que
         importa: los datos del banco no dependen de esto. */
    }
  }, []);

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
    <>
      <p className="mx-auto mt-4 max-w-[40ch] text-[17px] leading-[1.55] text-tinta-suave lg:text-[19px]">
        {cita ? (
          <>
            Te espero el{" "}
            <strong className="font-bold text-tinta">{cita.completa}</strong>.
            Falta un paso: el pago.
          </>
        ) : (
          <>Falta un paso para cerrarla: el pago.</>
        )}
      </p>

      {/* ── Los datos para el banco ── */}
      <div className="mx-auto mt-7 w-full max-w-[30rem] rounded-[24px] border border-acento/40 bg-panel p-6 text-left">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-acento">
            Zelle
          </span>
          <span className="text-[26px] font-extrabold tracking-[-0.02em]">
            ${PRECIO_USD}
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
          Abre la app de tu banco, busca Zelle y manda los ${PRECIO_USD} a ese
          número. Comprueba que sale el nombre de arriba antes de enviar.
        </p>
      </div>

      {/* ── Y avisar ── */}
      <div className="mx-auto mt-4 w-full max-w-[30rem] text-left">
        <p className="text-[17px] leading-[1.5] text-tinta-suave">
          Cuando lo hayas mandado, <strong className="font-bold text-tinta">envíale
          la captura por WhatsApp</strong>. Es el mismo número. Así Henry sabe que
          eres tú y te confirma la cita.
        </p>

        <a
          href={enlaceWhatsapp(cita?.utah)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Mandarle la captura
        </a>
      </div>

      {/* ── Lo que el sitio NO sabe, dicho en voz alta ── */}
      <div className="mx-auto mt-6 w-full max-w-[30rem] rounded-[20px] border border-white/12 px-5 py-4 text-left">
        <p className="text-[16px] leading-[1.5] text-tinta-suave">
          Tu hora ya está guardada y nadie más puede cogerla. El pago lo revisa
          Henry a mano —este sitio no ve tu banco— y él te confirma por
          WhatsApp. Si algo te sale y no puedes venir, avísale por ahí mismo y
          libera la hora para alguien más.
        </p>
      </div>
    </>
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
