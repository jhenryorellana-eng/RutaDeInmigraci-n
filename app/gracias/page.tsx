import Link from "next/link";

import { PagoZelle } from "@/components/pago-zelle";

/**
 * HOJA 3 — APARTADA, Y AHORA EL PAGO.
 *
 * La hora ya está guardada cuando se llega aquí, y eso se dice primero: es
 * lo que quita la angustia. Después viene lo que falta, que es pagar.
 *
 * ── Por qué el pago va DESPUÉS de apartar y no antes ──
 *
 * Porque el pago es a mano y tarda: hay que abrir la app del banco, buscar
 * Zelle, teclear un número. Si la hora no estuviera ya guardada, alguien
 * podría quedarse sin ella mientras paga por ella. Se aparta primero, se
 * paga después, y Henry confirma.
 *
 * ── Lo que ya no dice esta pantalla ──
 *
 * «Te mandé un correo con el enlace de la videollamada». No se manda ningún
 * correo —no está montado— y esa frase llevaba semanas prometiendo algo que
 * no llegaba. Ahora el aviso va por donde de verdad va a ocurrir: WhatsApp.
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

      <PagoZelle />

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
