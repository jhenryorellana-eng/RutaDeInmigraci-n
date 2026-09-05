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

/**
 * LA TARJETA QUE SALE AL PEGAR ESTE ENLACE.
 *
 * Este enlace se comparte a mano, por WhatsApp, uno a uno. Lo que se ve en
 * el chat antes de tocarlo —una foto, un título y una línea— es lo único que
 * tiene alguien para decidir si entra. Sin estas etiquetas, WhatsApp enseña
 * la dirección pelada, que no dice nada y parece un enlace sospechoso.
 *
 * ── Qué dice la descripción, y por qué esos cuatro ──
 *
 * Los cuatro servicios por su nombre, en el mismo orden que la pared. Quien
 * lo lee tiene que reconocer LO SUYO antes de tocar: alguien que busca sus
 * trámites no entra a algo que sólo promete «asesoría personalizada».
 *
 * ── Lo que WhatsApp exige, y no perdona ──
 *
 * · La imagen en dirección ABSOLUTA. La construye Next desde `metadataBase`,
 *   que está en el layout y sale de `lib/sitio.ts`.
 * · Que no pese mucho. Ésta son 316 KB, por debajo del límite al que deja de
 *   traerse la vista previa.
 * · `width` y `height` declarados: sin ellos algunos clientes reservan mal
 *   el hueco y la tarjeta sale con la foto recortada.
 *
 * Y una advertencia para cuando se pruebe: WhatsApp CACHEA la vista previa
 * por dirección. Si ya se compartió el enlace antes de que existieran estas
 * etiquetas, va a seguir enseñando lo viejo — hay que probar con algo detrás
 * (`/links?v=2`) para que la vuelva a pedir.
 */
const DESCRIPCION =
  "Preparación de primera, segunda y tercera audiencia, asesoría personalizada, servicios migratorios, la comunidad Andex y el bootcamp para jóvenes. Todo en un sitio.";

export const metadata: Metadata = {
  title: "Henry Orellana D. · Todos sus proyectos",
  description: DESCRIPCION,
  alternates: { canonical: "/links" },
  openGraph: {
    type: "website",
    locale: "es_US",
    url: "/links",
    siteName: "Orellana Group",
    title: "Henry Orellana D. · Todos sus proyectos",
    description: DESCRIPCION,
    images: [
      {
        url: "/og-links.jpg",
        width: 1600,
        height: 902,
        alt: "Henry Orellana Domínguez en la oficina de USALatino Prime.",
      },
    ],
  },
  /* Para X y para todo lo que lee las de Twitter antes que las de Open
     Graph. `summary_large_image` es la que enseña la foto ancha; con
     `summary` a secas sale una miniatura cuadrada del tamaño de un sello. */
  twitter: {
    card: "summary_large_image",
    title: "Henry Orellana D. · Todos sus proyectos",
    description: DESCRIPCION,
    images: ["/og-links.jpg"],
  },
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
        <div className="retrato-pared pointer-events-none absolute inset-x-0 top-0 h-[58%] select-none">
          <Image
            src="/henry-retrato.jpg"
            alt="Henry Orellana Domínguez"
            width={940}
            height={1672}
            priority
            sizes="(min-width: 480px) 480px, 100vw"
            className="absolute inset-0 size-full object-cover object-[50%_12%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-noche)_42%,transparent)_0%,color-mix(in_srgb,var(--color-noche)_10%,transparent)_26%,color-mix(in_srgb,var(--color-noche)_86%,transparent)_76%,var(--color-noche)_100%)]"
          />
        </div>

        {/* El velo. Va FUERA del retrato y no dentro: dentro se desenfocaría
            con él, y un velo desenfocado no oscurece — se deshilacha por los
            bordes. Aquí, entre el retrato y el contenido, cae sobre la
            fotografía y deja las tarjetas a plena luz. */}
        <div aria-hidden="true" className="velo-guia fixed inset-0" />

        <div className="relative flex min-h-dvh flex-col px-5 pb-7 pt-9">
          <p className="cabecera-pared text-[10px] font-bold uppercase tracking-[0.3em] text-tinta/90">
            Orellana Group
          </p>

          {/* `mt-auto` empuja el nombre hasta justo encima de los paneles:
              así queda apoyado en el pecho del retrato y no flotando en
              mitad de la cara, sea cual sea el alto del teléfono. */}
          <div className="cabecera-pared mt-auto">
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
            {/* Tres palabras en oro, y son las tres que la pared cumple a
                dos dedos de aquí: trámites, comunidad y formación son los
                servicios de abajo dichos por su nombre. El oro las ata a los
                cuadros sin una sola palabra de más. El texto no cambia. */}
            <p className="bajada-pared mt-3.5 text-[15px] font-light leading-[1.5] text-tinta/85">
              Llegué sin saber a quién acudir ni en quién confiar. Hoy
              construyo lo que me faltó:{" "}
              <span className="destacado-oro">
                trámites, comunidad y formación
              </span>{" "}
              para familias latinas.
            </p>
          </div>

          <ParedGuiada />

          <p className="cabecera-pared mt-6 text-center text-[13px] text-tinta/55">
            © {new Date().getFullYear()} Orellana Group
          </p>
        </div>
      </main>
    </>
  );
}
