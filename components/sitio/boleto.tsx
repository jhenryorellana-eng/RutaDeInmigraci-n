import Link from "next/link";
import { MINUTOS_SESION, type Servicio } from "@/lib/servicios";
import { Flecha } from "./estructura";

/**
 * EL BOLETO DE CADA PREPARACIÓN.
 *
 * Las dos preparaciones se presentan como dos boletos y no como dos
 * tarjetas iguales: un boleto dice «esto es para un día concreto», que es
 * exactamente lo que es una audiencia. El talón lleva el precio, separado
 * por una línea perforada, para que el importe se lea solo y de un vistazo.
 *
 * El de mérito va en oro y el preliminar en papel: las dos cosas se
 * distinguen por la temperatura antes de leer una palabra.
 *
 * Por dentro hay dos capas a propósito. `.boleto` es el enlace y lo mueve la
 * entrada; `.boleto-cara` es lo que se inclina bajo el puntero. Si las dos
 * cosas tocaran el mismo `transform`, la una deshacería a la otra.
 */
export function Boleto({
  servicio,
  href = `/reservar?servicio=${servicio.id}`,
  tamano = "grande",
}: {
  servicio: Servicio;
  href?: string;
  tamano?: "grande" | "mini";
}) {
  const merito = servicio.etapa === "Mérito";
  const etapa = merito ? "Audiencia de mérito" : "Audiencia preliminar";
  return (
    <Link
      href={href}
      className={`boleto is-${tamano}`}
      data-tono={merito ? "oro" : "papel"}
      aria-label={`${servicio.nombre}, ${etapa.toLowerCase()}: $${servicio.precioUsd} dólares. Reservar esta preparación.`}
    >
      <span className="boleto-cara" aria-hidden="true">
        <span className="boleto-cuerpo">
          <span className="boleto-etapa">
            {tamano === "mini" ? servicio.etapa : etapa}
          </span>
          <strong className="boleto-nombre">{servicio.nombre}</strong>
          {tamano === "grande" ? (
            <>
              <span className="boleto-incluye">
                {servicio.incluye.map((punto) => (
                  <span key={punto}>{punto}</span>
                ))}
              </span>
              <span className="boleto-accion">
                Reservar esta preparación <Flecha diagonal />
              </span>
            </>
          ) : null}
        </span>
        <span className="boleto-talon">
          {tamano === "grande" ? <Sello id={servicio.id} /> : null}
          <span className="boleto-precio">
            <sup>$</sup>
            {servicio.precioUsd}
            <small>USD</small>
          </span>
          <span className="boleto-minutos">
            {MINUTOS_SESION} min con Henry
          </span>
        </span>
      </span>
    </Link>
  );
}

/** El sello circular del talón. Gira despacio cuando el boleto se señala. */
function Sello({ id }: { id: string }) {
  return (
    <svg className="boleto-sello" viewBox="0 0 100 100">
      <defs>
        <path
          id={`sello-${id}`}
          d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"
        />
      </defs>
      <circle cx="50" cy="50" r="47" />
      <circle cx="50" cy="50" r="27" />
      <text>
        <textPath href={`#sello-${id}`}>
          UNO A UNO · EN ESPAÑOL · CON HENRY ·
        </textPath>
      </text>
      <path d="M41 59 59 41M45 41h14v14" />
    </svg>
  );
}
