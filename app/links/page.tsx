import type { Metadata } from "next";
import Image from "next/image";

import { ParedGuiada } from "@/components/pared-guiada";

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
 * ── Los cuatro colores ──
 *
 * Cada servicio se queda encendido con su tono. Antes el color era un
 * detalle —un filo y un punto— y los cuatro paneles parecían el mismo botón
 * repetido; ahora la temperatura de cada uno es lo que dice, sin leer, que
 * son cuatro cosas distintas. El recorrido del guía (`ParedGuiada`) no pinta
 * nada: sólo levanta una tarjeta cada vez y las devuelve como estaban.
 *
 * ── Lo que NO tiene, aunque un linktree suela tenerlo ──
 *
 * Los iconos de Instagram, YouTube, TikTok y Facebook. No tengo esas
 * direcciones, y un icono de red que no lleva a ninguna parte es peor que no
 * ponerlo: quien lo toca se queda en la misma pantalla creyendo que el sitio
 * está roto.
 *
 * Y ya no lleva la banda de «Escribirle por WhatsApp» a lo ancho. Preguntar
 * es ahora la burbuja del guía: un guion cerrado que responde lo que ya se
 * sabe —precios, pago, qué es cada servicio, que Henry no es abogado— y que
 * termina pudiendo pasar con él por WhatsApp para lo que no cubre.
 */

export const metadata: Metadata = {
  title: "Henry Orellana D. · Todos sus proyectos",
  description:
    "Asesoría personalizada, servicios migratorios, comunidad y bootcamp de emprendimiento con Henry Orellana.",
};

export default function Links() {
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
            {/* Quién es y qué construyó, no cómo le gustaría sonar.

                La primera frase ya la firma él en ANDEX —«Sé lo que se siente
                llegar sin saber a quién acudir ni en quién confiar»— y aquí
                vuelve en primera persona. Que la misma frase abra los dos
                sitios es deliberado: quien salta de uno a otro reconoce a la
                misma persona. */}
            <p className="mt-3.5 text-[15px] font-light leading-[1.5] text-tinta/85">
              Llegué sin saber a quién acudir ni en quién confiar. Hoy
              construyo lo que me faltó: trámites, comunidad y formación para
              familias latinas.
            </p>
          </div>

          <ParedGuiada />

          <p className="mt-6 text-center text-[13px] text-tinta/55">
            © {new Date().getFullYear()} Orellana Group
          </p>
        </div>
      </main>
    </>
  );
}
