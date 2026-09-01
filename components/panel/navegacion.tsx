"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * LAS TRES PANTALLAS DEL PANEL.
 *
 * Eran cuatro. «Mi horario» se plegó dentro del calendario porque mezclaba
 * tres cosas sin relación entre sí, y dos de ellas la rejilla ya las hacía
 * mejor arrastrando. Una pestaña menos es una decisión menos cada vez que se
 * abre la agenda.
 *
 * El mismo componente sirve arriba en escritorio y abajo en el teléfono; lo
 * único que cambia son las clases que le pasa el layout. Mantenerlo en un
 * solo sitio evita el fallo clásico de que una barra tenga un enlace que la
 * otra no.
 */

const PANTALLAS = [
  { href: "/panel", texto: "Calendario", icono: IconoCalendario },
  { href: "/panel/pagos", texto: "Pagos", icono: IconoPagos },
  { href: "/panel/personas", texto: "Personas", icono: IconoPersonas },
] as const;

export function Navegacion({ className = "" }: { className?: string }) {
  const ruta = usePathname();

  return (
    <nav className={`items-center gap-1.5 ${className}`}>
      {PANTALLAS.map(({ href, texto, icono: Icono }) => {
        /* Coincidencia exacta: con `startsWith`, «Calendario» se quedaría
           encendido también en las otras dos, porque todas cuelgan de
           `/panel`. */
        const aqui = ruta === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={aqui ? "page" : undefined}
            className={
              aqui
                ? "flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-[13px] font-extrabold text-acento md:flex-row md:gap-2 md:rounded-full md:bg-white/10 md:text-[15px] md:text-tinta"
                : "flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-[13px] font-bold text-tinta-tenue md:flex-row md:gap-2 md:rounded-full md:text-[15px] md:font-medium"
            }
          >
            <Icono className="md:hidden" />
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}

function IconoCalendario({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

function IconoPagos({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="13" x="3" y="6" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function IconoPersonas({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M16 20v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 20v-2a4 4 0 0 0-3-3.9" />
    </svg>
  );
}
