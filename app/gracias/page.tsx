import type { Metadata } from "next";
import Link from "next/link";
import { CitaConfirmada, type MetodoDeVuelta } from "@/components/cita-confirmada";
import { Sitio } from "@/components/sitio/estructura";

export const metadata: Metadata = {
  title: "El siguiente paso · Tu sesión con Henry",
  robots: { index: false, follow: false },
};

export default async function Gracias({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string | string[] }>;
}) {
  const { pago } = await searchParams;
  const metodo: MetodoDeVuelta =
    pago === "tarjeta" || pago === "zelle" ? pago : null;
  return (
    <Sitio reserva>
      <main id="contenido" className="site-container receipt-page">
        <span className="eyebrow">TU SESIÓN CON HENRY</span>
        <h1>
          El siguiente paso:
          <br />
          <em>confirmar tu encuentro.</em>
        </h1>
        <CitaConfirmada metodo={metodo} />
        <Link href="/" className="text-link">
          Volver al inicio <span aria-hidden="true">↗</span>
        </Link>
      </main>
    </Sitio>
  );
}
