"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PAISES } from "@/lib/paises";
import { ESTADOS } from "@/lib/estados";
import { ZONA, fechaLarga, horaEnZona } from "@/lib/horario";
import { CalendarioMes } from "@/components/calendario-mes";
import type { DiaConHuecos } from "@/lib/citas";
import { reservar } from "@/app/reservar/accion";
import { CLAVE_CITA } from "@/lib/pago";
import type { Servicio } from "@/lib/servicios";
import { PasoPago } from "@/components/paso-pago";
import { Flecha } from "@/components/sitio/estructura";
const ZONAS = [
  ["America/Lima", "Perú · Lima"],
  ["America/Bogota", "Colombia · Bogotá"],
  ["America/Mexico_City", "México · Ciudad de México"],
  ["America/Caracas", "Venezuela · Caracas"],
  ["America/Guayaquil", "Ecuador · Guayaquil"],
  ["America/Guatemala", "Guatemala"],
  ["America/El_Salvador", "El Salvador"],
  ["America/Tegucigalpa", "Honduras"],
  ["America/Santo_Domingo", "República Dominicana"],
  ["America/Argentina/Buenos_Aires", "Argentina · Buenos Aires"],
  ["America/Santiago", "Chile · Santiago"],
  ["America/New_York", "EE. UU. · Nueva York / Miami"],
  ["America/Chicago", "EE. UU. · Chicago / Houston"],
  ["America/Denver", "EE. UU. · Utah / Denver"],
  ["America/Phoenix", "EE. UU. · Arizona"],
  ["America/Los_Angeles", "EE. UU. · Los Ángeles"],
  ["America/Anchorage", "EE. UU. · Alaska"],
  ["Pacific/Honolulu", "EE. UU. · Hawái"],
  ["Europe/Madrid", "España · Madrid"],
];
type Paso = "fecha" | "datos" | "pago";
export function FormularioReserva({
  dias,
  conectada,
  servicio,
  hayTarjeta,
}: {
  dias: DiaConHuecos[];
  conectada: boolean;
  servicio: Servicio;
  hayTarjeta: boolean;
}) {
  const router = useRouter();
  const contenedor = useRef<HTMLDivElement>(null);
  const horas = useRef<HTMLDivElement>(null);
  const siguiente = useRef<HTMLDivElement>(null);
  const diaConPuntero = useRef(false);
  const horaConPuntero = useRef(false);
  const pasoPrevio = useRef<Paso>("fecha");
  const [contacto, setContacto] = useState({
    nombre: "",
    correo: "",
    whatsapp: "",
    pais: "",
    estado: "",
  });
  const [enCurso, empezar] = useTransition();
  const [paso, setPaso] = useState<Paso>("fecha");
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);
  const [zona, setZona] = useState(ZONA);
  const [zonaDetectada, setZonaDetectada] = useState(ZONA);
  const [error, setError] = useState<string | null>(null);
  const [solicitud, setSolicitud] = useState<{
    solicitudId: number;
    codigoPago: string;
  } | null>(null);
  const [correoPago, setCorreoPago] = useState("");
  const [enEeuu, setEnEeuu] = useState("");
  useEffect(() => {
    try {
      const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setZona(local);
      setZonaDetectada(local);
    } catch {
      /* Utah remains a visible, editable fallback. */
    }
  }, []);
  useEffect(() => {
    if (pasoPrevio.current !== paso) {
      contenedor.current?.focus({ preventScroll: true });
      contenedor.current?.scrollIntoView({ block: "start" });
      pasoPrevio.current = paso;
    }
  }, [paso]);
  useEffect(() => {
    const porPuntero = diaConPuntero.current;
    diaConPuntero.current = false;
    if (
      !porPuntero ||
      !diaElegido ||
      !window.matchMedia("(max-width: 760px)").matches
    )
      return;
    const destino = horas.current;
    if (
      destino &&
      destino.getBoundingClientRect().top > window.innerHeight * 0.65
    ) {
      destino.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [diaElegido]);
  useEffect(() => {
    const porPuntero = horaConPuntero.current;
    horaConPuntero.current = false;
    if (
      !porPuntero ||
      !horaElegida ||
      !window.matchMedia("(max-width: 760px)").matches
    )
      return;
    const destino = siguiente.current;
    if (
      destino &&
      destino.getBoundingClientRect().bottom > window.innerHeight - 12
    ) {
      destino.scrollIntoView({
        block: "end",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [horaElegida]);
  const dia = dias.find((d) => d.clave === diaElegido);
  const zonas = ZONAS.some(([z]) => z === zonaDetectada)
    ? ZONAS
    : [
        [zonaDetectada, `Tu zona · ${zonaDetectada.replaceAll("_", " ")}`],
        ...ZONAS,
      ];
  const indice = ["fecha", "datos", "pago"].indexOf(paso);
  function elegirDia(clave: string, porPuntero = false) {
    diaConPuntero.current = porPuntero;
    setDiaElegido(clave);
    setHoraElegida(null);
    setError(null);
  }
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!horaElegida || !conectada) return;
    const datos = new FormData(e.currentTarget);
    const correo = String(datos.get("correo") ?? "")
      .trim()
      .toLowerCase();
    setError(null);
    empezar(async () => {
      try {
        const r = await reservar({
          iso: horaElegida,
          nombre: String(datos.get("nombre") ?? ""),
          correo,
          whatsapp: String(datos.get("whatsapp") ?? ""),
          nacionalidad: String(datos.get("pais") ?? ""),
          enEeuu: enEeuu === "si",
          estadoUsa:
            enEeuu === "si" ? String(datos.get("estado") ?? "") : undefined,
          zonaHoraria: zona,
          servicio: servicio.id,
        });
        if (!r.ok) {
          setError(r.motivo);
          return;
        }
        const cuando = new Date(horaElegida);
        try {
          sessionStorage.setItem(
            CLAVE_CITA,
            JSON.stringify({
              completa: `${fechaLarga(cuando, zona)} a las ${horaEnZona(cuando, zona)} (tu hora)`,
              utah: `${fechaLarga(cuando)} a las ${horaEnZona(cuando)}`,
              servicio: servicio.nombre,
              precio: servicio.precioUsd,
            }),
          );
        } catch {
          /* Storage is optional. */
        }
        setCorreoPago(correo);
        setSolicitud(r);
        setPaso("pago");
      } catch {
        setError(
          "No pudimos conectar con la agenda. Tus datos siguen aquí; vuelve a intentarlo.",
        );
      }
    });
  }
  return (
    <div ref={contenedor} tabIndex={-1} className="booking-flow">
      <ol className="booking-progress" aria-label="Pasos de la reserva">
        {["Tu momento", "Tus datos", "El pago"].map((t, i) => (
          <li key={t} aria-current={i === indice ? "step" : undefined}>
            <span>{i < indice ? "✓" : i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      {paso === "fecha" ? (
        <>
          <h2>Primero, el día.</h2>
          <p className="booking-explainer">
            Elige un espacio para conversar con calma.
          </p>
          <CalendarioMes
            dias={dias}
            elegido={diaElegido}
            onElegir={elegirDia}
          />
          {dia ? (
            <div ref={horas} className="booking-hours">
              <p className="booking-selected-date">
                <span aria-hidden="true">✓</span>
                {fechaLarga(new Date(dia.huecos[0].iso))}
              </p>
              <h3>Ahora, tu hora.</h3>
              <label className="zone-control">
                <span>Mostramos primero la hora donde tú estás</span>
                <select
                  aria-label="Tu zona horaria"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                >
                  {zonas.map(([z, n]) => (
                    <option key={z} value={z}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="time-grid">
                {dia.huecos.map((h) => (
                  <button
                    type="button"
                    key={h.iso}
                    disabled={!h.libre}
                    aria-pressed={horaElegida === h.iso}
                    onClick={(event) => {
                      horaConPuntero.current = event.detail > 0;
                      setHoraElegida(h.iso);
                    }}
                  >
                    <strong>{horaEnZona(new Date(h.iso), zona)}</strong>
                    <small>
                      {h.libre
                        ? `${horaEnZona(new Date(h.iso))} en Utah`
                        : "No disponible"}
                    </small>
                  </button>
                ))}
              </div>
              <div ref={siguiente} className="booking-next booking-moment-next">
                <p
                  className="booking-moment-status"
                  role="status"
                  aria-live="polite"
                >
                  {horaElegida ? (
                    <>
                      <span>Tu hora seleccionada</span>
                      <strong>{horaEnZona(new Date(horaElegida), zona)}</strong>
                    </>
                  ) : (
                    <>
                      <span>Tu siguiente paso</span>
                      <strong>Elige una hora</strong>
                    </>
                  )}
                </p>
                <button
                  type="button"
                  className="route-button"
                  disabled={!horaElegida}
                  onClick={() => setPaso("datos")}
                >
                  Continuar con mis datos <Flecha />
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {paso === "datos" && horaElegida ? (
        <>
          <div className="reservation-detail">
            <div>
              {fechaLarga(new Date(horaElegida), zona)}
              <span>
                {horaEnZona(new Date(horaElegida), zona)} tu hora ·{" "}
                {horaEnZona(new Date(horaElegida))} en Utah
              </span>
            </div>
            <button
              type="button"
              className="link-button"
              disabled={enCurso}
              onClick={() => setPaso("fecha")}
            >
              Cambiar
            </button>
          </div>
          <h2>¿Cómo te contactamos?</h2>
          <p className="booking-explainer">
            Solo lo necesario para preparar nuestro encuentro.
          </p>
          <form onSubmit={enviar}>
            <div className="booking-fields">
              <label>
                Tu nombre
                <input
                  name="nombre"
                  value={contacto.nombre}
                  onChange={(e) =>
                    setContacto({ ...contacto, nombre: e.target.value })
                  }
                  disabled={enCurso}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Cómo te llamas"
                />
              </label>
              <label>
                Tu correo
                <input
                  name="correo"
                  value={contacto.correo}
                  onChange={(e) =>
                    setContacto({ ...contacto, correo: e.target.value })
                  }
                  disabled={enCurso}
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="tu@correo.com"
                />
              </label>
              <label>
                Tu WhatsApp
                <input
                  name="whatsapp"
                  value={contacto.whatsapp}
                  onChange={(e) =>
                    setContacto({ ...contacto, whatsapp: e.target.value })
                  }
                  disabled={enCurso}
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={8}
                  maxLength={24}
                  placeholder="+1 385 000 0000"
                />
                <small>
                  Incluye el código de país. Henry te escribirá por aquí.
                </small>
              </label>
              <label>
                Tu nacionalidad
                <select
                  name="pais"
                  value={contacto.pais}
                  onChange={(e) =>
                    setContacto({ ...contacto, pais: e.target.value })
                  }
                  disabled={enCurso}
                  required
                >
                  <option value="" disabled>
                    Selecciona tu país
                  </option>
                  {PAISES.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                ¿Estás en Estados Unidos?
                <select
                  required
                  disabled={enCurso}
                  value={enEeuu}
                  onChange={(e) => setEnEeuu(e.target.value)}
                >
                  <option value="" disabled>
                    Selecciona una opción
                  </option>
                  <option value="si">Sí, estoy en EE. UU.</option>
                  <option value="no">Estoy en otro país</option>
                </select>
              </label>
              {enEeuu === "si" ? (
                <label>
                  Tu estado
                  <select
                    name="estado"
                    value={contacto.estado}
                    onChange={(e) =>
                      setContacto({ ...contacto, estado: e.target.value })
                    }
                    disabled={enCurso}
                    required
                  >
                    <option value="" disabled>
                      Selecciona tu estado
                    </option>
                    {ESTADOS.map((e) => (
                      <option key={e.nombre} value={e.nombre}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
            <p className="booking-privacy">
              No necesitas contar tu caso ni enviar documentos aquí. Lo
              conversarás directamente con Henry.
            </p>
            {error ? (
              <p className="booking-error" role="alert">
                {error}
              </p>
            ) : null}
            {!conectada ? (
              <p className="booking-error" role="status">
                La agenda no está disponible por el momento. Vuelve a intentarlo
                más tarde.
              </p>
            ) : null}
            <div className="booking-next">
              <button
                className="route-button"
                type="submit"
                disabled={enCurso || !conectada}
              >
                {enCurso
                  ? "Preparando tu sesión…"
                  : `Continuar al pago · $${servicio.precioUsd}`}
                <Flecha />
              </button>
            </div>
          </form>
        </>
      ) : null}
      {paso === "pago" && solicitud ? (
        <div className="payment-panel">
          <PasoPago
            servicio={servicio}
            solicitudId={solicitud.solicitudId}
            codigoPago={solicitud.codigoPago}
            correo={correoPago}
            hayTarjeta={hayTarjeta}
            onListo={() => router.push("/gracias")}
          />
        </div>
      ) : null}
    </div>
  );
}
