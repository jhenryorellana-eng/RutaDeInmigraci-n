"use client";

import { useEffect, useState } from "react";

import { CLAVE_CITA, enlaceWhatsapp } from "@/lib/pago";

/**
 * LO QUE SE ENSEÑA CUANDO YA ESTÁ TODO HECHO.
 *
 * Sustituye a la pantalla de pago que había aquí. Cuando el pago iba después
 * de apartar, esta hoja tenía que enseñar los datos de Zelle y explicar cómo
 * transferir; ahora el pago ocurre antes de tocar la agenda, así que llegar
 * aquí significa que ya está: la hora es suya y el dinero salió.
 *
 * Lo único que puede faltar es el comprobante — quien saltó ese botón en la
 * pantalla del pago no tiene otra forma de mandarlo — así que se vuelve a
 * ofrecer aquí y en ningún sitio más.
 *
 * ── De dónde sale la hora ──
 *
 * De `sessionStorage`, escrito por la pantalla anterior. NO de la URL: una
 * dirección se queda en el historial del teléfono y en el portapapeles de
 * quien la copie. Y se lee dentro de un efecto, no al pintar, porque en el
 * servidor no existe y React protestaría por la diferencia.
 *
 * Si el almacenamiento está bloqueado —modo privado— la pantalla sigue
 * sirviendo: la confirmación no depende de poder repetir la hora.
 */

type Cita = {
  completa: string;
  utah: string;
  /** «Preparación · Segunda audiencia (Preliminar)». */
  servicio?: string;
  /** El de ESTA cita, guardado cuando se apartó. */
  precio?: number;
};

export function CitaConfirmada() {
  const [cita, setCita] = useState<Cita | null>(null);

  useEffect(() => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_CITA);
      if (crudo) setCita(JSON.parse(crudo) as Cita);
    } catch {
      /* Modo privado, almacenamiento bloqueado o un JSON de una versión
         anterior. La confirmación vale igual. */
    }
  }, []);

  return (
    <>
      <p className="mx-auto mt-4 max-w-[42ch] text-[17px] leading-[1.55] text-tinta-suave lg:text-[19px]">
        {cita ? (
          <>
            {cita.servicio ? (
              <>
                <strong className="font-bold text-tinta">{cita.servicio}</strong>.{" "}
              </>
            ) : null}
            Te espero el{" "}
            <strong className="font-bold text-tinta">{cita.completa}</strong>.
          </>
        ) : (
          <>Ya está: tu hora es tuya y nadie más puede tomarla.</>
        )}
      </p>

      {/* ── Qué pasa ahora ── */}
      <div className="mx-auto mt-7 w-full max-w-[30rem] rounded-[24px] border border-acento/40 bg-panel p-6 text-left">
        <span className="text-[13px] font-bold uppercase tracking-[0.14em] text-acento">
          Qué pasa ahora
        </span>
        <p className="mt-4 text-[17px] leading-[1.5] text-tinta-suave">
          Henry revisa tu pago a mano —este sitio no ve tu banco— y te escribe
          por WhatsApp para confirmarte. Por ahí te llega también el enlace de
          la sesión.
        </p>
        <p className="mt-3.5 text-[17px] leading-[1.5] text-tinta-suave">
          Si algo te sale y no puedes venir, avísale por ahí mismo y liberas la
          hora para alguien más.
        </p>
      </div>

      {/* ── Por si no mandó el comprobante ── */}
      <div className="mx-auto mt-4 w-full max-w-[30rem] text-left">
        <p className="text-[16px] leading-[1.5] text-tinta-tenue">
          ¿No le mandaste todavía la captura del pago? Es lo que le confirma que
          eres tú.
        </p>
        <a
          href={enlaceWhatsapp(cita?.utah)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex min-h-[60px] w-full items-center justify-center gap-3 rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo"
        >
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Mandarle la captura
        </a>
      </div>
    </>
  );
}
