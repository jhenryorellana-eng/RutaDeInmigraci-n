import Link from "next/link";

import { CitaConfirmada } from "@/components/cita-confirmada";

/**
 * HOJA 3 — TODO HECHO.
 *
 * Llegar aquí significa que el pago ya salió y la hora ya es suya: en este
 * orden, el dinero se manda ANTES de tocar la agenda.
 *
 * ── Lo que esta pantalla dejó de hacer ──
 *
 * Cobrar. Antes era la pantalla del pago: enseñaba los datos de Zelle y
 * explicaba cómo transferir, porque la hora se apartaba primero y se pagaba
 * después. Ese orden se invirtió —la agenda se llenaba de horas apartadas
 * que nunca se pagaban— y con él se fue de aquí la caja del banco. Repetirla
 * ahora sería pedir el dinero dos veces.
 *
 * Lo único que puede quedar pendiente es el comprobante, y por eso el botón
 * de WhatsApp sigue estando.
 *
 * ── Lo que NO se promete ──
 *
 * Ningún correo. No está montado, y esa frase llevaba semanas prometiendo
 * algo que no llegaba. El aviso va por donde de verdad ocurre: WhatsApp.
 */
export default function Gracias() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col justify-center px-6 py-10 text-center lg:max-w-[46rem]">
      <span
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-acento/20 text-acento lg:size-20"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <h1 className="mt-6 font-titulo text-[38px] font-semibold leading-[1.08] tracking-[-0.02em] lg:mt-8 lg:text-[52px]">
        Tu hora quedó apartada.
      </h1>

      <CitaConfirmada />

      <p className="mt-7 text-[15px] font-bold text-tinta-tenue">
        Henry Orellana · Fundador de ANDEX
      </p>

      <Link
        href="/"
        className="mx-auto mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/25 px-7 text-[16px] font-bold"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
