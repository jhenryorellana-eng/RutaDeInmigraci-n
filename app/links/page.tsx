import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ENLACES, type Enlace } from "@/lib/enlaces";
import { WHATSAPP_HENRY } from "@/lib/pago";

/**
 * LA PARED DE ENLACES.
 *
 * Una puerta a los cuatro sitios de Henry. Nada más: quien llega aquí viene
 * de una biografía de Instagram o de un mensaje, con el pulgar en el borde
 * de la pantalla y ganas de tocar UNA cosa.
 *
 * ── Serio sin ser soso ──
 *
 * La primera versión era neón de rótulo: cuatro focos de color, un charco de
 * luz bajo cada tarjeta y el nombre encendido. Llamaba la atención sin decir
 * nada, y al lado de eso los proyectos parecían lo de menos.
 *
 * Lo que sostiene ahora la pantalla no es el brillo, son tres cosas que no
 * gritan:
 *
 *   · el NOMBRE en la serif del sitio, que es lo que le da edad y oficio a
 *     una pantalla — una sans en negrita es lo que hace todo el mundo;
 *   · UNA luz arriba, blanca, que da profundidad sin teñir nada;
 *   · el color reducido a tres detalles por tarjeta —un filo, un icono y un
 *     punto— sobre fondos que siguen siendo grises.
 *
 * Y los acentos dejan de ser colores para ser TEMPERATURAS: la arena es
 * cálida, el acero frío, el teal es el de la marca. A media distancia
 * parecen tres grises; de cerca, cada tarjeta tiene carácter propio.
 *
 * ── Por qué es negra y no azul como el resto del sitio ──
 *
 * Porque no es una pantalla de este sitio: es la puerta a varios proyectos
 * distintos, y uno de ellos es éste. Con el azul de aquí, la sesión con
 * Henry parecería la casa y los demás, invitados.
 *
 * ── Lo que NO tiene, aunque la referencia sí ──
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
    "Sesión personalizada, servicios migratorios, comunidad y bootcamp de emprendimiento con Henry Orellana.",
};

export default function Links() {
  return (
    <>
      {/* El fondo, fijo: el `body` es azul para el resto del sitio y aquí se
          tapa entero, también al hacer scroll. */}
      <div aria-hidden="true" className="pared-luz fixed inset-0 -z-10" />

      <main className="mx-auto flex min-h-dvh w-full max-w-[32rem] flex-col items-center px-6 pb-12 pt-16 text-center">
        {/* ── El retrato ──

            Un aro de un pelo, monocromo. El arcoíris de antes competía con
            la cara que rodeaba.

            Tres capas y no un `ring`: el anillo de Tailwind se dibuja HACIA
            FUERA del borde, así que tapaba el aro que venía detrás. Medido:
            el aro salía pintado de 138 px y el anillo negro lo cubría. */}
        <div className="rounded-full bg-[linear-gradient(160deg,color-mix(in_srgb,white_28%,transparent),color-mix(in_srgb,white_6%,transparent))] p-px">
          <div className="rounded-full bg-noche p-[5px]">
            <div className="relative size-[112px] overflow-hidden rounded-full sm:size-[124px]">
              <Image
                src="/henry-retrato.jpg"
                alt="Henry Orellana Domínguez"
                width={264}
                height={264}
                priority
                className="absolute inset-0 size-full object-cover object-[50%_12%]"
              />
            </div>
          </div>
        </div>

        <span className="mt-7 text-[12px] font-bold uppercase tracking-[0.22em] text-tinta-tenue">
          Orellana Group
        </span>

        {/* La serif del sitio. Es lo único que hace que esta pantalla no
            parezca la plantilla que usa todo el mundo. */}
        <h1 className="mt-3 font-titulo text-[40px] font-semibold leading-[1.04] tracking-[-0.022em] sm:text-[48px]">
          Henry Orellana D.
        </h1>

        <p className="mt-4 text-[16px] text-tinta-suave">
          Fundador y CEO · Orellana Group
        </p>
        <p className="mt-1 text-[16px] leading-[1.5] text-tinta-tenue">
          Transformando familias, empoderando líderes
        </p>

        {/* ── Los cuatro sitios ── */}
        <div className="mt-11 flex w-full flex-col gap-3">
          {ENLACES.map((e) => (
            <Tarjeta key={e.href} enlace={e} />
          ))}
        </div>

        {/* ── El único contacto que consta de verdad ── */}
        <a
          href={`https://wa.me/${WHATSAPP_HENRY}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-9 flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-white/12 px-7 text-[16px] font-bold text-tinta-suave transition-colors hover:border-white/28"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Escribirle por WhatsApp
        </a>

        <p className="mt-auto pt-14 text-[14px] text-tinta-tenue/60">
          © {new Date().getFullYear()} Orellana Group
        </p>
      </main>
    </>
  );
}

/* Cada temperatura trae su filo, su icono y su punto. Escrito así, y no
   componiendo la clase con una plantilla, porque Tailwind sólo genera las
   clases que encuentra ESCRITAS ENTERAS en el código: una clase armada con
   `text-${tono}` no existiría en la hoja de estilos y el color no saldría.

   `texto` pone el `currentColor` del que bebe el filo de arriba — por eso el
   título y la descripción llevan su color escrito, o heredarían el del filo. */
const TONOS = {
  arena: { texto: "text-arena", icono: "text-arena", punto: "bg-arena" },
  malva: { texto: "text-malva", icono: "text-malva", punto: "bg-malva" },
  acero: { texto: "text-acero", icono: "text-acero", punto: "bg-acero" },
  teal: { texto: "text-acento", icono: "text-acento", punto: "bg-acento" },
} as const;

function Tarjeta({ enlace }: { enlace: Enlace }) {
  const t = TONOS[enlace.tono];

  const dentro = (
    <>
      {/* El filo de luz: un pelo de color que se apaga hacia los lados y se
          enciende del todo al pasar por encima. Es todo el acento que lleva
          la tarjeta — el fondo se queda gris. */}
      <span aria-hidden="true" className="filo-luz absolute inset-x-8 top-0 h-px" />

      <div className="flex items-center gap-4">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] ${t.icono}`}
        >
          <Icono cual={enlace.icono} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[18px] font-bold leading-[1.25] tracking-[-0.015em] text-tinta">
            {enlace.titulo}
          </span>
          <span className="mt-1.5 flex items-center gap-2">
            <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${t.punto}`} />
            <span className="text-[14px] font-medium text-tinta-tenue">{enlace.etiqueta}</span>
          </span>
        </span>

        <span
          aria-hidden="true"
          className="shrink-0 text-tinta-tenue transition-transform group-hover:translate-x-0.5"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </div>

      <p className="mt-3 text-[15px] leading-[1.5] text-tinta-tenue">
        {enlace.descripcion}
      </p>
    </>
  );

  /* El de este mismo sitio va por `Link`, que no recarga la página entera.
     Los de fuera, por `<a>` con `noopener`: sin él, la pestaña que se abre
     puede tocar `window.opener` y llevarse esta a otra dirección. */
  const clases = `group relative block overflow-hidden rounded-2xl border border-white/[0.08] bg-noche-panel/70 px-5 py-4 text-left transition-colors hover:border-white/20 ${t.texto}`;

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

function Icono({ cual }: { cual: Enlace["icono"] }) {
  const comun = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (cual === "estrella") {
    return (
      <svg {...comun}>
        <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" />
      </svg>
    );
  }

  if (cual === "sello") {
    return (
      <svg {...comun}>
        <path d="M5 21h14M6 17.5h12a1 1 0 0 1 1 1V21H5v-2.5a1 1 0 0 1 1-1Z" />
        <path d="M9 17.5v-2.2c0-.7-.3-1.3-.8-1.8A4.2 4.2 0 0 1 7 10.4a5 5 0 0 1 10 0c0 1.2-.5 2.3-1.2 3.1-.5.5-.8 1.1-.8 1.8v2.2" />
      </svg>
    );
  }

  if (cual === "cohete") {
    return (
      <svg {...comun}>
        <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2 2 0 0 0-2.9-.1Z" />
        <path d="M12 15 9 12a11 11 0 0 1 2-6.5C13 2.7 16.5 2 19.5 2c0 3-.7 6.5-3.5 8.5A11 11 0 0 1 12 15Z" />
        <path d="M9 12H5s.5-2.8 2-4c1.6-1.3 4 0 4 0M12 15v4s2.8-.5 4-2c1.3-1.6 0-4 0-4" />
      </svg>
    );
  }

  return (
    <svg {...comun}>
      <path d="M6 20V10a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3" />
      <circle cx="6" cy="20" r="2" />
      <circle cx="18" cy="4" r="2" />
      <path d="M13 11h5M13 15h3" />
    </svg>
  );
}
