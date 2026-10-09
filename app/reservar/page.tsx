import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioReserva } from "@/components/formulario-reserva";
import { Boleto } from "@/components/sitio/boleto";
import { FotoHenry, Sitio } from "@/components/sitio/estructura";
import { diasDisponibles } from "@/lib/citas";
import { enlacePregunta } from "@/lib/pago";
import { hayBase } from "@/lib/supabase/servidor";
import { sePuedeCobrarConTarjeta } from "@/lib/pago-stripe";
import {
  AUDIENCIAS,
  MINUTOS_SESION,
  PRECIO_DESDE,
  servicioPorId,
} from "@/lib/servicios";
import { temaPorId, type Tema } from "@/lib/temas";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reserva tu sesión con Henry",
};
export default async function Reservar({
  searchParams,
}: {
  searchParams: Promise<{
    servicio?: string | string[];
    tema?: string | string[];
    pago?: string | string[];
  }>;
}) {
  const { servicio: id, tema: idTema, pago } = await searchParams;
  const tema = typeof idTema === "string" ? temaPorId(idTema) : null;
  const cancelado = pago === "cancelado";
  /* Sin servicio no se enseña una hora: primero se elige qué audiencia se
     prepara, porque de eso depende el precio. */
  if (id === undefined)
    return <ElegirAudiencia tema={tema} cancelado={cancelado} />;
  const servicio = typeof id === "string" ? servicioPorId(id) : null;
  if (!servicio) notFound();
  const dias = await diasDisponibles();
  const disponibles = dias.some((d) => d.huecos.some((h) => h.libre));
  return (
    <Sitio reserva>
      <main id="contenido" className="site-container">
        <div className="booking-heading">
          <span className="eyebrow">TU PRÓXIMO PASO EMPIEZA AQUÍ</span>
          <h1>
            {servicio.nombre}
            <br />
            <em>{servicio.etapa}.</em>
          </h1>
          <p>{servicio.descripcion}</p>
          <Link href={tema ? `/reservar?tema=${tema.id}` : "/reservar"}>
            ← Elegir otra audiencia
          </Link>
        </div>
        {cancelado ? <AvisoCancelado /> : null}
        <div className="booking-layout">
          <section className="booking-card" aria-label="Reserva tu sesión">
            <div className="booking-mobile-summary">
              <div className="booking-mobile-avatar">
                <FotoHenry
                  src="/imagenes/henry-primer-plano.jpg"
                  alt=""
                  sizes="56px"
                />
              </div>
              <div>
                <strong>{servicio.nombre}</strong>
                <span>{MINUTOS_SESION} min · Atención individual</span>
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
                temaInicial={tema?.id ?? null}
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
          <Resumen
            detalle={`${servicio.nombre} · ${servicio.etapa}`}
            precio={`$${servicio.precioUsd}`}
          />
        </div>
      </main>
    </Sitio>
  );
}

function ElegirAudiencia({
  tema,
  cancelado,
}: {
  tema: Tema | null;
  cancelado: boolean;
}) {
  return (
    <Sitio reserva>
      <main id="contenido" className="site-container">
        <div className="booking-heading">
          <span className="eyebrow">TU PRÓXIMO PASO EMPIEZA AQUÍ</span>
          <h1>
            ¿Qué audiencia
            <br />
            <em>vas a preparar?</em>
          </h1>
          <p>Elige la preparación y después verás las horas libres.</p>
        </div>
        {cancelado ? <AvisoCancelado /> : null}
        <div className="booking-layout">
          <section
            className="booking-card booking-picker"
            aria-label="Elige tu audiencia"
          >
            <h2>Primero, tu audiencia.</h2>
            <p className="booking-explainer">
              Cada preparación es una sesión de {MINUTOS_SESION} minutos, solo
              tú y Henry.
            </p>
            <div className="audiencias-boletos">
              {AUDIENCIAS.map((s) => (
                <Boleto
                  key={s.id}
                  servicio={s}
                  href={`/reservar?servicio=${s.id}${tema ? `&tema=${tema.id}` : ""}`}
                />
              ))}
            </div>
            <p className="booking-picker-ayuda">
              ¿No sabes cuál es la tuya?{" "}
              <a href={enlacePregunta()} target="_blank" rel="noopener noreferrer">
                Pregúntale a Henry por WhatsApp
              </a>
              .
            </p>
          </section>
          <Resumen
            detalle="Segunda audiencia o audiencia de mérito"
            precio={`$${PRECIO_DESDE}`}
            desde
          />
        </div>
      </main>
    </Sitio>
  );
}

function Resumen({
  detalle,
  precio,
  desde = false,
}: {
  detalle: string;
  precio: string;
  desde?: boolean;
}) {
  return (
    <aside className="booking-summary">
      <div className="booking-portrait">
        <FotoHenry alt="Henry Orellana" />
      </div>
      <h2>Prepara tu audiencia.</h2>
      <p>
        {detalle}
        <br />
        con Henry Orellana
      </p>
      <div className="summary-price">
        <span>
          {MINUTOS_SESION} minutos
          <br />
          Atención individual
        </span>
        <strong>
          {desde ? <small className="summary-desde">desde</small> : null}
          {precio}
          <small> USD</small>
        </strong>
      </div>
      <p className="summary-note">
        Tu hora se confirma cuando se verifica el pago. Henry te contacta por
        WhatsApp para coordinar la sesión.
      </p>
    </aside>
  );
}

function AvisoCancelado() {
  return (
    <p className="booking-notice" role="status">
      <strong>El pago con tarjeta no se completó.</strong> No se hizo ningún
      cobro y tu hora no quedó reservada. Puedes elegirla de nuevo y pagar con
      tarjeta o por Zelle.
    </p>
  );
}
