import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioReserva } from "@/components/formulario-reserva";
import { FotoHenry, Sitio } from "@/components/sitio/estructura";
import { diasDisponibles } from "@/lib/citas";
import { hayBase } from "@/lib/supabase/servidor";
import { sePuedeCobrarConTarjeta } from "@/lib/pago-stripe";
import { ASESORIA, servicioPorId } from "@/lib/servicios";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reserva tu sesión con Henry",
};
export default async function Reservar({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string | string[] }>;
}) {
  const { servicio: id } = await searchParams;
  const servicio =
    id === undefined
      ? ASESORIA
      : typeof id === "string"
        ? servicioPorId(id)
        : null;
  if (!servicio) notFound();
  const audiencia = servicio.id !== ASESORIA.id;
  const dias = await diasDisponibles();
  const disponibles = dias.some((d) => d.huecos.some((h) => h.libre));
  return (
    <Sitio reserva>
      <main id="contenido" className="site-container">
        <div className="booking-heading">
          <span className="eyebrow">TU PRÓXIMO PASO EMPIEZA AQUÍ</span>
          {audiencia ? (
            <h1>
              {servicio.nombre}
              <br />
              <em>{servicio.etapa}.</em>
            </h1>
          ) : (
            <h1>
              Hagamos un espacio
              <br />
              <em>para conversar.</em>
            </h1>
          )}
          <p>
            {audiencia
              ? servicio.descripcion
              : "Elige tu momento. Nosotros nos ocupamos de acompañarte."}
          </p>
          {audiencia ? (
            <Link href="/links">← Volver a los servicios</Link>
          ) : null}
        </div>
        <div className="booking-layout">
          <section className="booking-card" aria-label="Reserva tu sesión">
            <div className="booking-mobile-summary">
              <div className="booking-mobile-avatar">
                <FotoHenry
                  src="/imagenes/henry-utah.webp"
                  alt=""
                  sizes="56px"
                />
              </div>
              <div>
                <strong>{servicio.nombre}</strong>
                <span>45 min · Atención individual</span>
              </div>
              <span className="booking-mobile-price">
                <strong>${servicio.precioUsd}</strong>
                <small>USD</small>
              </span>
            </div>
            {disponibles ? (
              <FormularioReserva
                key={servicio.id}
                dias={dias}
                conectada={hayBase}
                servicio={servicio}
                hayTarjeta={sePuedeCobrarConTarjeta}
              />
            ) : (
              <>
                <h2>La agenda está completa.</h2>
                <p>
                  Ahora no hay horas disponibles. Vuelve más adelante para
                  encontrar un nuevo espacio con Henry.
                </p>
              </>
            )}
          </section>
          <aside className="booking-summary">
            <div className="booking-portrait">
              <FotoHenry alt="Henry Orellana" />
            </div>
            <h2>
              {audiencia ? "Prepara tu audiencia." : "Un espacio para ti."}
            </h2>
            <p>
              {servicio.nombre}{audiencia ? ` · ${servicio.etapa}` : ""}
              <br />
              con Henry Orellana
            </p>
            <div className="summary-price">
              <span>
                45 minutos
                <br />
                Atención individual
              </span>
              <strong>
                ${servicio.precioUsd}
                <small> USD</small>
              </strong>
            </div>
            <p className="summary-note">
              Tu hora se confirma cuando se verifica el pago. Henry te contacta
              por WhatsApp para coordinar la sesión.
            </p>
          </aside>
        </div>
      </main>
    </Sitio>
  );
}
