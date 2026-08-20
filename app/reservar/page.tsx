import Link from "next/link";

import { FormularioReserva } from "@/components/formulario-reserva";
import { diasDisponibles } from "@/lib/citas";
import { hayBase } from "@/lib/supabase/servidor";

/**
 * HOJA 2 — APARTAR.
 *
 * Sigue siendo una conversación, no un formulario: Henry está en la pantalla,
 * se pregunta una cosa a la vez y lo ya elegido se encoge a una línea.
 *
 * Los huecos se calculan EN EL SERVIDOR y llegan ya marcados. Así la lista
 * de horas ocupadas no depende de que el navegador pida nada, y la página
 * sirve igual con JavaScript a medio cargar — que en un Android de gama
 * media con datos contados pasa más de lo que se suele suponer.
 *
 * `force-dynamic` porque la disponibilidad cambia cada vez que alguien
 * aparta: una página cacheada ofrecería horas que ya no existen.
 */
export const dynamic = "force-dynamic";

export default async function Reservar() {
  const dias = await diasDisponibles();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-6 pb-7 pt-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Volver"
          className="flex size-[38px] shrink-0 items-center justify-center rounded-full border border-white/20"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/henry.jpg"
          alt=""
          className="size-[38px] shrink-0 rounded-full object-cover [object-position:50%_22%]"
        />
        <span className="text-[15px] text-tinta-tenue">45 min con Henry · $150</span>
      </div>

      {dias.length === 0 ? (
        <p className="mt-10 text-[17px] leading-[1.5] text-tinta-suave">
          Ahora mismo no quedan horas libres. Vuelve mañana: se abren huecos
          nuevos cada día.
        </p>
      ) : (
        <FormularioReserva dias={dias} conectada={hayBase} />
      )}

      <p className="mt-auto pt-8 text-[14px] leading-[1.5] text-tinta-tenue">
        Lunes a viernes de 8:00 a 17:00 y sábados de 8:00 a 13:00, hora de
        Utah. Henry no es abogado y esto no es asesoría legal: cuando tu caso
        necesite uno, te lo dirá.
      </p>
    </main>
  );
}
