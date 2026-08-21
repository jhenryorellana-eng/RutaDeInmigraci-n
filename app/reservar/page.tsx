import Image from "next/image";
import Link from "next/link";

import { FormularioReserva } from "@/components/formulario-reserva";
import { diasDisponibles } from "@/lib/citas";
import { describirHorario } from "@/lib/horario";
import { hayBase } from "@/lib/supabase/servidor";
import { leerTramos } from "@/lib/tramos";

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
  const [dias, tramos] = await Promise.all([diasDisponibles(), leerTramos()]);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[520px] lg:grid lg:max-w-none lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] lg:gap-0">
      {/* ── Él, a la izquierda, sólo en escritorio ──

          En el teléfono no cabe y no hace falta: allí Henry aparece en la
          cabecera, pequeño y redondo. Aquí, con sitio de sobra, se queda
          mirando mientras se elige la hora. Sigue siendo una conversación
          con alguien y no un formulario, que es lo que separa esta pantalla
          de cualquier otro sistema de reservas. */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/henry-retrato.jpg"
          alt=""
          width={1100}
          height={1653}
          sizes="34vw"
          className="absolute inset-0 size-full object-cover object-[50%_18%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-fondo/10 from-0% via-fondo/55 via-[62%] to-fondo to-100%"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-fondo/55 from-0% via-transparent via-[26%] to-fondo/90 to-100%"
        />

        <span className="absolute left-11 top-8 text-[20px] font-extrabold tracking-[-0.022em]">
          ANDEX
        </span>

        <div className="absolute inset-x-11 bottom-10">
          <p className="font-titulo text-[30px] font-semibold leading-[1.2]">
            Nos vemos 45 minutos y sales con tu plan.
          </p>
          <p className="mt-3 text-[16px] text-tinta-suave">
            Henry Orellana · Fundador de ANDEX
          </p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col px-6 pb-7 pt-6 lg:mx-auto lg:w-full lg:max-w-[58rem] lg:justify-center lg:px-16 lg:pb-10 lg:pt-10">
      <div className="flex items-center gap-3 lg:hidden">
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
        {/* Por `next/image` y no por un `<img>` suelto: esto son 38 píxeles y
            el archivo pesa 120 KB. Sin optimizar, el teléfono se descargaba
            el retrato entero para pintar un círculo del tamaño de una uña. */}
        <Image
          src="/henry-retrato.jpg"
          alt=""
          width={76}
          height={76}
          className="size-[38px] shrink-0 rounded-full object-cover [object-position:50%_14%]"
        />
        <span className="text-[15px] text-tinta-tenue">45 min con Henry · $150</span>
      </div>

      {/* En escritorio el precio va arriba a la derecha, donde el artboard:
          la cabecera del teléfono no existe aquí, así que si no se dice, no
          se dice en ningún sitio. */}
      <div className="hidden items-baseline justify-between gap-5 lg:flex">
        <Link href="/" className="text-[16px] text-tinta-tenue underline underline-offset-4">
          Volver
        </Link>
        <span className="text-[20px] font-extrabold text-tinta-tenue">$150</span>
      </div>

      {dias.length === 0 ? (
        <p className="mt-10 text-[17px] leading-[1.5] text-tinta-suave">
          Ahora mismo no quedan horas libres. Vuelve mañana: se abren huecos
          nuevos cada día.
        </p>
      ) : (
        <FormularioReserva dias={dias} conectada={hayBase} />
      )}

      {/* El horario se cuenta solo desde los tramos de la base: escrito a
          mano, cada cambio de Henry lo convertiría en una promesa falsa que
          nadie se acordaría de tocar. */}
      <p className="mt-auto pt-8 text-[14px] leading-[1.5] text-tinta-tenue lg:mt-8 lg:max-w-[70ch] lg:pt-0">
        {describirHorario(tramos)} Hora de Utah. Henry no es abogado y esto no
        es asesoría legal: cuando tu caso necesite uno, te lo dirá.
      </p>
      </div>
    </main>
  );
}
