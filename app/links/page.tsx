import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HojaServicios } from "@/components/hoja-servicios";
import { ENLACES, type Enlace } from "@/lib/enlaces";
import { WHATSAPP_HENRY } from "@/lib/pago";

/**
 * LA PARED DE ENLACES · vitral.
 *
 * Una puerta a los cuatro sitios de Henry. Quien llega aquí viene de una
 * biografía de Instagram o de un mensaje, con el pulgar en el borde de la
 * pantalla y ganas de tocar UNA cosa.
 *
 * ── La apuesta ──
 *
 * Que la cara vende. Aquí Henry no es un avatar redondo de cien píxeles: el
 * retrato ocupa media pantalla y los enlaces flotan encima en cristal.
 *
 * Lo que hace que el cristal no parezca el efecto de siempre son dos cosas:
 * la fotografía se ve DE VERDAD detrás —no es una textura, es él— y cada
 * panel lleva su propio filo de luz en el borde de arriba, apagándose hacia
 * los extremos. Un borde encendido de punta a punta parece un subrayado; un
 * canto iluminado por el centro parece vidrio.
 *
 * ── Por qué la primera es distinta ──
 *
 * Porque es la única que se paga y la única que sólo existe aquí. Lleva el
 * cristal más vivo y el filo en agua; las otras tres, el filo en blanco. En
 * una pared de enlaces el orden ya es una recomendación — esto lo dice otra
 * vez, sin escribirlo.
 *
 * ── Lo que NO tiene, aunque un linktree suela tenerlo ──
 *
 * Los iconos de Instagram, YouTube, TikTok y Facebook. No tengo esas
 * direcciones, y un icono de red que no lleva a ninguna parte es peor que no
 * ponerlo: quien lo toca se queda en la misma pantalla creyendo que el sitio
 * está roto. En su lugar va el WhatsApp, que es el único contacto de Henry
 * que aquí consta de verdad.
 */

export const metadata: Metadata = {
  title: "Henry Orellana D. · Todos sus proyectos",
  description:
    "Asesoría personalizada, servicios migratorios, comunidad y bootcamp de emprendimiento con Henry Orellana.",
};

export default function Links() {
  const [principal, ...resto] = ENLACES;

  return (
    <>
      <div aria-hidden="true" className="pared-luz fixed inset-0 -z-10" />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-hidden">
        {/* ── El retrato, a sangre ──

            Ocupa el 58% del alto y se funde hacia el fondo por su borde
            inferior. El velo tiene cuatro paradas y no dos: con una sola
            transición, la cara se oscurece antes de tiempo o el corte se
            nota como una banda. Así la cara queda limpia y sólo se apaga
            del pecho hacia abajo. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[58%] select-none">
          <Image
            src="/henry-retrato.jpg"
            alt="Henry Orellana Domínguez"
            width={1100}
            height={1653}
            priority
            sizes="(min-width: 480px) 480px, 100vw"
            className="absolute inset-0 size-full object-cover object-[50%_12%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-noche)_42%,transparent)_0%,color-mix(in_srgb,var(--color-noche)_10%,transparent)_26%,color-mix(in_srgb,var(--color-noche)_86%,transparent)_76%,var(--color-noche)_100%)]"
          />
        </div>

        <div className="relative flex min-h-dvh flex-col px-5 pb-7 pt-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tinta/90">
            Orellana Group
          </p>

          {/* `mt-auto` empuja el nombre hasta justo encima de los paneles:
              así queda apoyado en el pecho del retrato y no flotando en
              mitad de la cara, sea cual sea el alto del teléfono. */}
          <div className="mt-auto">
            <h1 className="font-titulo text-[46px] font-normal leading-[1] tracking-[-0.01em]">
              Henry
              <br />
              <span className="italic">Orellana D.</span>
            </h1>
            {/* En primera persona y con un oficio dentro.
                «Transformando familias, empoderando líderes» es lo que pone
                cualquiera: no dice qué hace, ni para quién, ni por qué él.
                Esto dice las tres en once palabras: «me costó» es el
                camino recorrido, «automatizo» es el oficio, «familias
                latinas» es para quién. Se probó una versión de dos frases
                que abría con «recorrí este proceso y lo convertí en
                sistemas»: decía lo mismo dos veces y ocupaba cuatro líneas
                en lugar de dos.

                Sin repetir «Orellana Group»: ya está arriba, en versalitas,
                a cuatro líneas de distancia. Un cargo que sólo devuelve el
                nombre de la marca que acaba de leerse ocupa la línea más
                valiosa de la pantalla sin añadir nada. */}
            <p className="mt-3.5 text-[15px] font-light leading-[1.5] text-tinta/85">
              Automatizo lo que a mí me costó años, para que a las familias
              latinas les cueste una tarde.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-2.5">
            <Panel enlace={principal} principal />
            {resto.map((e) => (
              <Panel key={e.href} enlace={e} />
            ))}
          </div>

          <a
            href={`https://wa.me/${WHATSAPP_HENRY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-[46px] items-center justify-center gap-2.5 rounded-full bg-agua/15 text-[15px] font-medium text-agua transition-colors hover:bg-agua/25"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
            </svg>
            Escribirle por WhatsApp
          </a>

          <p className="mt-6 text-center text-[13px] text-tinta/55">
            © {new Date().getFullYear()} Orellana Group
          </p>
        </div>
      </main>
    </>
  );
}

function Panel({ enlace, principal = false }: { enlace: Enlace; principal?: boolean }) {
  const dentro = (
    <>
      {/* El canto iluminado. En el principal va en agua; en los demás, en
          blanco: el color es lo que dice cuál de los cuatro se paga, sin
          tener que escribirlo. */}
      <span
        aria-hidden="true"
        className={
          principal
            ? "filo-luz absolute inset-x-[18%] top-0 h-px text-agua"
            : "filo-luz absolute inset-x-[26%] top-0 h-px text-tinta"
        }
      />

      <div className="relative flex items-center gap-3">
        {enlace.logo ? (
          <span
            className={
              enlace.logoSobreBlanco
                ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-tinta"
                : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-tinta/[0.06]"
            }
          >
            <Image
              src={enlace.logo}
              alt=""
              width={72}
              height={72}
              loading="eager"
              className="size-7 object-contain"
            />
          </span>
        ) : null}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold tracking-[-0.01em]">
            {enlace.titulo}
          </span>
          <span className="mt-0.5 block truncate text-[12px] font-light text-tinta/75">
            {enlace.descripcion}
          </span>
        </span>

        <span
          aria-hidden="true"
          className={principal ? "shrink-0 text-agua" : "shrink-0 text-tinta/85"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </div>
    </>
  );

  /* El de este mismo sitio va por `Link`, que no recarga la página entera.
     Los de fuera, por `<a>` con `noopener`: sin él, la pestaña que se abre
     puede tocar `window.opener` y llevarse esta a otra dirección. */
  const clases = `cristal relative block overflow-hidden rounded-2xl px-4 py-3.5 text-left backdrop-blur-[14px] transition-colors ${
    principal ? "cristal-vivo" : ""
  }`;

  /* El de las preparaciones no lleva a ningún sitio: abre la hoja con las
     tres. Se decide aquí y no en el componente de la hoja para que el panel
     se pinte exactamente igual en los cuatro casos. */
  if (enlace.abreServicios) {
    return (
      <HojaServicios>
        <span className={clases}>{dentro}</span>
      </HojaServicios>
    );
  }

  return enlace.interno ? (
    <Link href={enlace.href} className={clases}>
      {dentro}
    </Link>
  ) : (
    <a href={enlace.href} target="_blank" rel="noopener noreferrer" className={clases}>
      {dentro}
    </a>
  );
}
