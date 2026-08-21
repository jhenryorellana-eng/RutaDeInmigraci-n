import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ENLACES, type Enlace } from "@/lib/enlaces";
import { WHATSAPP_HENRY } from "@/lib/pago";

/**
 * LA PARED DE ENLACES.
 *
 * Una puerta a los tres proyectos de Henry. Nada más: quien llega aquí viene
 * de una biografía de Instagram o de un mensaje, con el pulgar en el borde
 * de la pantalla y ganas de tocar UNA cosa.
 *
 * ── Por qué es negra y no azul como el resto del sitio ──
 *
 * Porque no es una pantalla de este sitio: es la puerta a tres proyectos
 * distintos, y uno de ellos es éste. Con el azul de aquí, «Tu ruta del
 * inmigrante» parecería la casa y los otros dos, invitados. El negro no tira
 * de ninguno de los tres y deja que cada tarjeta traiga su propio color.
 *
 * ── Lo que NO tiene, aunque la referencia sí ──
 *
 * Los iconos de Instagram, YouTube, TikTok y Facebook. No tengo esas
 * direcciones, y un icono de red que no lleva a ninguna parte es peor que no
 * ponerlo: quien lo toca se queda en la misma pantalla creyendo que el sitio
 * está roto. En su lugar va el WhatsApp, que es el único contacto de Henry
 * que aquí consta de verdad. Cuando lleguen las redes, se añaden.
 *
 * Tampoco lleva el punto verde de «en línea» de la referencia. Sugiere que
 * está disponible ahora mismo, y nadie lo está comprobando.
 */

export const metadata: Metadata = {
  title: "Henry Orellana D. · Todos sus proyectos",
  description:
    "Comunidad, bootcamp de emprendimiento y sesión uno a uno para armar tu ruta del inmigrante.",
};

export default function Links() {
  return (
    <>
      {/* El fondo, fijo: el `body` es azul para el resto del sitio y aquí se
          tapa entero, también al hacer scroll. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-noche" />

      <main className="mx-auto flex min-h-dvh w-full max-w-[34rem] flex-col items-center px-6 pb-12 pt-14 text-center">
        {/* ── El retrato, con su aro ── */}
        {/* Tres capas y no un `ring`: el anillo de Tailwind se dibuja HACIA
            FUERA del borde, así que tapaba justo el aro de color que venía
            detrás. Medido: el aro salía pintado de 138 px y el anillo negro
            de 5 px lo cubría entero. Así el color es el marco de verdad. */}
        <div className="rounded-full bg-[conic-gradient(from_180deg,var(--color-acento),var(--color-cian),var(--color-violeta),var(--color-aviso),var(--color-acento))] p-[3px]">
          <div className="rounded-full bg-noche p-[4px]">
            <div className="relative size-[118px] overflow-hidden rounded-full sm:size-[130px]">
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

        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-noche-panel px-4 py-2 text-[13px] font-bold uppercase tracking-[0.14em] text-tinta-suave">
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-acento"
          >
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
          </svg>
          Orellana Group
        </span>

        <h1 className="mt-5 text-[38px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
          Henry Orellana D.
        </h1>

        <p className="mt-3 text-[17px] font-bold text-tinta-suave sm:text-[18px]">
          Fundador y CEO · Orellana Group
        </p>
        <p className="mt-1.5 text-[16px] leading-[1.5] text-tinta-tenue sm:text-[17px]">
          Transformando familias, empoderando líderes
        </p>

        {/* ── Los tres sitios ── */}
        <div className="mt-10 flex w-full flex-col gap-4">
          {ENLACES.map((e) => (
            <Tarjeta key={e.href} enlace={e} />
          ))}
        </div>

        {/* ── El único contacto que consta de verdad ── */}
        <a
          href={`https://wa.me/${WHATSAPP_HENRY}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-white/15 px-6 text-[16px] font-bold text-tinta-suave transition-colors hover:border-white/30"
        >
          <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Escribirle por WhatsApp
        </a>

        <p className="mt-auto pt-10 text-[15px] text-tinta-tenue/70">
          © {new Date().getFullYear()} Orellana Group
        </p>
      </main>
    </>
  );
}

/* Cada tono trae su borde, su fondo y su icono. Escrito así, y no
   componiendo la clase con una plantilla, porque Tailwind sólo genera las
   clases que encuentra ESCRITAS ENTERAS en el código: una clase armada con
   `bg-${tono}` no existiría en la hoja de estilos y el color no saldría. */
const TONOS = {
  ambar: {
    tarjeta: "border-aviso/25 hover:border-aviso/50",
    halo: "bg-gradient-to-br from-aviso/[0.14] via-aviso/[0.04] to-transparent",
    icono: "bg-aviso/15 text-aviso",
    etiqueta: "bg-aviso/15 text-aviso",
    flecha: "border-aviso/30 text-aviso",
  },
  cian: {
    tarjeta: "border-cian/25 hover:border-cian/50",
    halo: "bg-gradient-to-br from-cian/[0.14] via-cian/[0.04] to-transparent",
    icono: "bg-cian/15 text-cian",
    etiqueta: "bg-cian/15 text-cian",
    flecha: "border-cian/30 text-cian",
  },
  teal: {
    tarjeta: "border-acento/25 hover:border-acento/50",
    halo: "bg-gradient-to-br from-acento/[0.14] via-acento/[0.04] to-transparent",
    icono: "bg-acento/15 text-acento",
    etiqueta: "bg-acento/15 text-acento",
    flecha: "border-acento/30 text-acento",
  },
} as const;

function Tarjeta({ enlace }: { enlace: Enlace }) {
  const t = TONOS[enlace.tono];

  const dentro = (
    <>
      <div aria-hidden="true" className={`absolute inset-0 ${t.halo}`} />

      <div className="relative flex items-start gap-4">
        <span
          className={`flex size-[60px] shrink-0 items-center justify-center rounded-[18px] ${t.icono}`}
        >
          <Icono cual={enlace.icono} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[20px] font-extrabold leading-[1.2] tracking-[-0.02em] sm:text-[22px]">
            {enlace.titulo}
          </span>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-[13px] font-bold ${t.etiqueta}`}
          >
            {enlace.etiqueta}
          </span>
        </span>

        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-full border ${t.flecha}`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </div>

      <p className="relative mt-3.5 text-[16px] leading-[1.5] text-tinta-suave">
        {enlace.descripcion}
      </p>
    </>
  );

  /* El de este mismo sitio va por `Link`, que no recarga la página entera.
     Los de fuera, por `<a>` con `noopener`: sin él, la pestaña que se abre
     puede tocar `window.opener` y llevarse esta a otra dirección. */
  const clases = `relative block overflow-hidden rounded-[24px] border bg-noche-panel p-5 text-left transition-colors ${t.tarjeta}`;

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
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
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
