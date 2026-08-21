import Link from "next/link";

/**
 * HOJA 3 — LISTO.
 *
 * Corta a propósito. Lo único que hace falta después de apartar es saber que
 * quedó apartado y qué va a pasar ahora.
 *
 * Lo que NO dice: la hora exacta. Esta pantalla se puede abrir de vuelta
 * desde el historial, y repetir ahí los datos de la cita sería enseñárselos
 * a quien tome el teléfono prestado. Van al correo, que es de quien reservó.
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

      <h1 className="mt-6 font-titulo text-[38px] font-semibold leading-[1.08] tracking-[-0.02em] lg:mt-8 lg:text-[56px]">
        Tu hora quedó apartada.
      </h1>

      <p className="mx-auto mt-4 max-w-[36ch] text-[17px] leading-[1.55] text-tinta-suave lg:max-w-[44ch] lg:text-[19px]">
        Te mandé un correo con el día, la hora y el enlace de la videollamada.
        Si no lo ves, mira en «no deseado» antes de escribirme.
      </p>

      <p className="mx-auto mt-4 max-w-[36ch] text-[17px] leading-[1.55] text-tinta-suave lg:max-w-[44ch] lg:text-[19px]">
        Si algo te sale y no puedes venir, avísame y libero la hora para
        alguien más.
      </p>

      <p className="mt-6 text-[15px] font-bold text-tinta-tenue">
        Henry Orellana · Fundador de ANDEX
      </p>

      <Link
        href="/"
        className="mx-auto mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/25 px-7 text-[16px] font-bold"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
