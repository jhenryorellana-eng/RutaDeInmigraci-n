import type { Metadata } from "next";
import Link from "next/link";
import { CitaConfirmada } from "@/components/cita-confirmada";
import { Sitio } from "@/components/sitio/estructura";

export const metadata: Metadata = {
  title: "El siguiente paso · Tu asesoría con Henry",
  robots: { index: false, follow: false },
};

export default function Gracias() {
  return (
    <Sitio reserva>
      <main id="contenido" className="site-container receipt-page">
        <span className="eyebrow">TU ASESORÍA CON HENRY</span>
        <h1>
          El siguiente paso:
          <br />
          <em>confirmar tu encuentro.</em>
        </h1>
        <CitaConfirmada />
        <Link href="/" className="text-link">
          Volver al inicio <span aria-hidden="true">↗</span>
        </Link>
      </main>
    </Sitio>
  );
}
