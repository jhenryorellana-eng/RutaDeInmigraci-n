import type { Metadata, Viewport } from "next";
import "./globals.css";

import { URL_SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  /* La base con la que Next convierte `/og-links.jpg` en una dirección
     absoluta. Sin esto, WhatsApp recibe una ruta relativa, no sabe de qué
     servidor pedir la foto y enseña el enlace pelado. */
  metadataBase: new URL(URL_SITIO),
  title: "La ruta del inmigrante · con Henry Orellana",
  description:
    "45 minutos uno a uno para saber qué trámite te toca ahora, cuál viene después y cuáles no necesitas.",
};

export const viewport: Viewport = {
  themeColor: "#16223A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Google Fonts: el único host externo que carga esta página.

            Las dos de USALatino Prime, para que el producto y la marca no
            hablen con dos voces. La cursiva de Source Serif 4 se pide
            explícitamente: el nombre de la pared —«Orellana D.»— va en
            itálica, y sin ese eje el navegador la falsea inclinando la
            redonda, que en una serif se nota a la primera. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
