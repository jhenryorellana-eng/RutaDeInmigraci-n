import type { Metadata } from "next";
import Image from "next/image";

import { ParedGuiada } from "@/components/pared-guiada";
import { PRECIO_DESDE } from "@/lib/servicios";

/**
 * LA PARED DE ENLACES · vitral.
 *
 * Una puerta a los tres sitios de Henry. Quien llega aquí viene de una
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
 * ── Los colores ──
 *
 * Cada servicio se queda encendido con su tono. Antes el color era un
 * detalle —un filo y un punto— y los paneles parecían el mismo botón
 * repetido; ahora la temperatura de cada uno es lo que dice, sin leer, que
 * son cosas distintas. El recorrido del guía (`ParedGuiada`) no pinta
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
 * ── Qué dice la descripción ──
 *
 * Lo que hay detrás de las dos tarjetas, en el mismo orden que la pared:
 * preparar la audiencia con Henry, con lo que cuesta, y los trámites.
 * Quien lo lee tiene que reconocer LO SUYO antes de tocar.
 *
 * ── La imagen ──
 *
 * `og-audiencia.jpg`, 1200 × 630: Henry de brazos cruzados en su oficina,
 * con el nombre del servicio, la frase y el «desde» del precio. Si cambia
 * el precio más bajo, hay que volver a generarla, porque el texto va dentro
 * de la foto.
 *
 * ── Lo que WhatsApp exige, y no perdona ──
 *
 * · La imagen en dirección ABSOLUTA. La construye Next desde `metadataBase`,
 *   que está en el layout y sale de `lib/sitio.ts`.
 * · Que no pese mucho. Ésta son 84 KB, muy por debajo del límite al que deja
 *   de traerse la vista previa.
 * · `width` y `height` declarados: sin ellos algunos clientes reservan mal
 *   el hueco y la tarjeta sale con la foto recortada.
 *
 * Y una advertencia para cuando se pruebe: WhatsApp CACHEA la vista previa
 * por dirección. Si ya se compartió el enlace antes de que existieran estas
 * etiquetas, va a seguir enseñando lo viejo — hay que probar con algo detrás
 * (`/links?v=2`) para que la vuelva a pedir.
 */
const TITULO = "Henry Orellana · Preparación de audiencia";
const DESCRIPCION = `Prepara tu audiencia con Henry Orellana: 45 minutos uno a uno, en español, desde $${PRECIO_DESDE}. Y tus trámites migratorios con Contygo.`;
const IMAGEN = {
  url: "/og-audiencia.jpg",
  width: 1200,
  height: 630,
  alt: "Henry Orellana, de brazos cruzados en su oficina. Preparación de audiencia: 45 minutos uno a uno con Henry.",
};

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  alternates: { canonical: "/links" },
  openGraph: {
    type: "website",
    locale: "es_US",
    url: "/links",
    siteName: "Orellana Group",
    title: TITULO,
    description: DESCRIPCION,
    images: [IMAGEN],
  },
  /* Para X y para todo lo que lee las de Twitter antes que las de Open
     Graph. `summary_large_image` es la que enseña la foto ancha; con
     `summary` a secas sale una miniatura cuadrada del tamaño de un sello. */
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
    images: [IMAGEN.url],
  },
};

export default function Links() {
  return (
    <>
      <div aria-hidden="true" className="pared-luz fixed inset-0 -z-10" />

      <main className="pared-main relative mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-hidden">
        {/* ── El retrato, a sangre ──

            Ocupa el 58% del alto y se funde hacia el fondo por su borde
            inferior. El velo tiene cuatro paradas y no dos: con una sola
            transición, la cara se oscurece antes de tiempo o el corte se
            nota como una banda. Así la cara queda limpia y sólo se apaga
            del pecho hacia abajo. */}
        <div className="retrato-pared pointer-events-none absolute inset-x-0 top-0 h-[58%] select-none">
          {/* En la computadora el retrato ocupa la columna izquierda entera,
              así que pide la foto a ese tamaño y no a los 480 px del
              teléfono, que estirados se veían blandos. */}
          <Image
            src="/imagenes/henry-oficina.jpg"
            alt="Henry Orellana Domínguez"
            width={1600}
            height={2143}
            priority
            sizes="(min-width: 1024px) 55vw, (min-width: 480px) 480px, 100vw"
            className="retrato-imagen absolute inset-0 size-full object-cover object-[50%_12%]"
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

        <div className="pared-contenido relative flex min-h-dvh flex-col px-5 pb-7 pt-9">
          <p className="cabecera-pared pared-marca text-[10px] font-bold uppercase tracking-[0.3em] text-tinta/90">
            Orellana Group
          </p>

          {/* `mt-auto` empuja el nombre hasta justo encima de los paneles:
              así queda apoyado en el pecho del retrato y no flotando en
              mitad de la cara, sea cual sea el alto del teléfono. */}
          <div className="cabecera-pared pared-nombre mt-auto">
            <h1 className="font-titulo text-[46px] font-normal leading-[1] tracking-[-0.01em]">
              Henry
              <br />
              <span className="italic">Orellana D.</span>
            </h1>
            {/* Lo primero que se pregunta quien llega: con quién voy a hablar.
                La credencial va pegada al nombre, antes de la historia. */}
            <p className="pared-credencial">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.8 14.4 5l3.2-.4.6 3.2 2.8 1.6-1.4 2.9 1.4 2.9-2.8 1.6-.6 3.2-3.2-.4L12 21.8 9.6 19.6l-3.2.4-.6-3.2L3 15.2l1.4-2.9L3 9.4l2.8-1.6.6-3.2 3.2.4Z" />
                <path d="m8.8 12.2 2.2 2.2 4.4-4.6" />
              </svg>
              Consultor migratorio certificado en el estado de Utah
            </p>
            {/* Quién es y qué construyó, no cómo le gustaría sonar.

                La primera frase ya la firma él en ANDEX —«Sé lo que se siente
                llegar sin saber a quién acudir ni en quién confiar»— y aquí
                vuelve en primera persona. Que la misma frase abra los dos
                sitios es deliberado: quien salta de uno a otro reconoce a la
                misma persona. */}
            {/* Tres palabras en oro, y son las tres que la pared cumple a
                dos dedos de aquí: dicen lo que Henry construye, más allá de
                los servicios que la pared enseña hoy. El oro las ata a los
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

          <p className="cabecera-pared pared-pie mt-6 text-center text-[13px] text-tinta/55">
            © {new Date().getFullYear()} Orellana Group
          </p>
        </div>
      </main>
    </>
  );
}
