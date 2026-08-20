import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
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
        {/* Google Fonts: el único host externo que carga esta página. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
