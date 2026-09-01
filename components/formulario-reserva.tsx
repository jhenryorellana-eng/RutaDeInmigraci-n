"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PAISES } from "@/lib/paises";
import {
  ESTADOS,
  ESTADO_DE_HENRY,
  estadoPorNombre,
  estadoProbable,
} from "@/lib/estados";
import { ZONA, desfaseConUtah, diaCorto, fechaLarga, horaEnZona } from "@/lib/horario";
import type { DiaConHuecos } from "@/lib/citas";
import { reservar } from "@/app/reservar/accion";
import { CLAVE_CITA } from "@/lib/pago";
import { nombreLargo, type Servicio } from "@/lib/servicios";
import { PasoVideo } from "@/components/paso-video";
import { PasoPago } from "@/components/paso-pago";

/**
 * UNA COSA A LA VEZ.
 *
 * Cinco pasos —el video, el pago, el día, la hora y quién eres— pero nunca
 * dos a la vez en pantalla: lo ya resuelto se encoge a una línea con su
 * palomita y lo que falta se anuncia al pie. Así nadie se pregunta cuánto
 * queda, que es la razón por la que la gente abandona un formulario a la
 * mitad.
 *
 * ── El pago va ANTES de la agenda, y eso cambió ──
 *
 * Antes era al revés: se apartaba la hora y se pagaba después, porque pagar
 * a mano tarda y nadie debía quedarse sin su hora mientras abría el banco.
 * Ahora se cobra primero, a propósito: la agenda se llenaba de horas
 * apartadas que nunca se pagaban, y cada una era un hueco muerto que Henry
 * no podía dar a nadie más.
 *
 * Lo que se acepta a cambio está dicho en `components/paso-pago.tsx`: quien
 * paga y tarda diez minutos puede volver y no encontrar la hora que quería,
 * y eso es una devolución a mano de un pago que Zelle no revierte. Por eso
 * esa pantalla dice cuántas horas quedan ANTES de mandar a nadie a su banco.
 *
 * Y el botón «ya hice el pago» no comprueba nada — no puede: Zelle sólo
 * avisa al banco de Henry. Es una declaración, no una puerta.
 *
 * ── La agenda es la de Henry, siempre ──
 *
 * Toda la lógica de horas de este sitio corre en la hora de Utah, y quien
 * reserva se adapta. No es una simplificación técnica: Henry organiza su día
 * en su reloj, y una agenda que se mueve según quién la mire es una agenda
 * en la que no se puede confiar.
 *
 * Así que el número grande de cada hueco es SU hora. Lo que cambió —y lo que
 * costó una cita— es que ahora lo dice.
 *
 * Antes iba desnudo: «4:00» en letra grande, sin apellido, y debajo en
 * pequeño la hora de quien miraba. Alguien de Carolina del Sur, dos horas por
 * delante de Utah, leyó ese número como suyo y apartó una hora que en la
 * agenda de Henry caía dos horas antes.
 *
 * Ahora ninguna hora aparece sin decir de quién es: arriba «hora de Henry ·
 * Utah», debajo «para ti, las 6:00 en Carolina del Sur». Misma agenda, mismo
 * cálculo; lo que se arregla es que se entienda.
 *
 * ── Y el sitio se dice con palabras ──
 *
 * Para decir esa segunda hora hay que saber dónde está esa persona, y ahora
 * se le pregunta por su ESTADO en vez de deducirlo y callar. Todo el mundo
 * sabe en qué estado vive; nadie sabe que vive en `America/New_York`.
 *
 * La zona sigue saliendo del navegador para prerrellenar, nunca de la IP —una
 * IP puede ser la de una VPN o la de la biblioteca del pueblo de al lado—,
 * pero ahora se ESCRIBE:
 * «Texas», no `America/Chicago`. Y se puede corregir, porque un teléfono mal
 * configurado antes no lo notaba nadie.
 */

type Paso = "video" | "pago" | "dia" | "hora" | "datos";

export function FormularioReserva({
  dias,
  conectada,
  servicio,
}: {
  dias: DiaConHuecos[];
  conectada: boolean;
  servicio: Servicio;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();

  const [paso, setPaso] = useState<Paso>("video");
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [pais, setPais] = useState("");
  /** Se pregunta sólo en los doce estados que están partidos en dos zonas. */
  const [mitad, setMitad] = useState(0);
  const [eligiendoEstado, setEligiendoEstado] = useState(false);
  const [enEeuu, setEnEeuu] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* La zona del navegador, resuelta una vez. En el primer render del
     servidor no existe, así que se cae a la de Utah y se corrige al montar
     — nunca al revés, o el servidor y el cliente pintarían horas distintas. */
  const zonaDelNavegador = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/Denver";
    }
  }, []);

  /* El estado: se prerrellena con lo que dijo el navegador y lo que se elija
     a mano SIEMPRE gana. Una zona cubre muchos estados —`America/Chicago` va
     de Texas a Minnesota—, así que adivinar acierta el reloj, no el sitio. */
  const [estadoElegido, setEstadoElegido] = useState<string | null>(null);
  const estado = useMemo(() => {
    if (estadoElegido) return estadoPorNombre(estadoElegido);
    return estadoProbable(zonaDelNavegador) ?? estadoPorNombre(ESTADO_DE_HENRY);
  }, [estadoElegido, zonaDelNavegador]);

  /* La zona con la que se pintan las horas.
     El estado manda sobre el navegador porque el estado lo dijo una persona.
     Y si el estado está partido, la mitad elegida manda sobre la primera. */
  const zonaVisitante = estado?.zonas[mitad]?.zona ?? estado?.zonas[0]?.zona ?? zonaDelNavegador;

  const dia = dias.find((d) => d.clave === diaElegido) ?? null;

  /* Cuándo hay algo que aclarar: sólo si de verdad es otra hora. Repetir el
     mismo número con dos etiquetas hace dudar de si el sitio se equivocó.

     Se compara el DESFASE y no el nombre de la zona: `America/Denver` y
     `America/Boise` se escriben distinto y marcan la misma hora, así que por
     nombre se anunciaría una diferencia que no existe.

     Y se mide sobre el día elegido, no sobre hoy: Arizona está a la hora de
     Utah en invierno y una hora por detrás en verano. */
  const desfase = dia ? desfaseConUtah(new Date(dia.huecos[0].iso), zonaVisitante) : 0;
  const otraHora = desfase !== 0;

  function elegirEstado(nombre: string) {
    setEstadoElegido(nombre);
    setMitad(0);
    setEligiendoEstado(false);
  }

  function elegirDia(clave: string) {
    setDiaElegido(clave);
    setHoraElegida(null);
    setPaso("hora");
  }

  function enviar() {
    setError(null);
    if (!horaElegida || enEeuu === null) return;

    empezar(async () => {
      const r = await reservar({
        iso: horaElegida,
        nombre,
        correo,
        nacionalidad: pais,
        enEeuu,
        whatsapp,
        servicio: servicio.id,
        /* La zona del navegador viaja con la reserva para que el panel pueda
           enseñar la hora de esa persona además de la de Utah. Nunca se
           deduce de la IP: una IP puede ser la de una VPN. */
        zonaHoraria: zonaVisitante,
      });
      if (r.ok) {
        /* La cita viaja a la pantalla de pago por `sessionStorage`, NO por la
           URL: una dirección se queda en el historial del teléfono y en el
           portapapeles de quien la copie. Y si el almacenamiento está
           bloqueado, la pantalla de pago sigue funcionando sin la hora — que
           es un adorno, mientras que los datos del banco no lo son. */
        try {
          sessionStorage.setItem(
            CLAVE_CITA,
            describirCita(horaElegida, zonaVisitante, servicio, estado?.nombre ?? null),
          );
        } catch {
          /* modo privado */
        }
        router.push("/gracias");
      } else setError(r.motivo);
    });
  }

  /* Cuántos huecos quedan en todo lo que se ofrece. Se dice en la pantalla
     del pago, antes de mandar a nadie a abrir su banco: cobrar primero sólo
     es defendible si quien paga sabe que hay dónde meterse. */
  const horasLibres = dias.reduce(
    (n, d) => n + d.huecos.filter((h) => h.libre).length,
    0,
  );

  /* Los dos primeros pasos ocupan la pantalla entera y no comparten nada con
     la agenda, así que salen por su cuenta en vez de sumar dos ramas más al
     árbol de abajo. */
  if (paso === "video") {
    return <PasoVideo servicio={servicio} onContinuar={() => setPaso("pago")} />;
  }

  if (paso === "pago") {
    return (
      <PasoPago
        servicio={servicio}
        horasLibres={horasLibres}
        onPagado={() => setPaso("dia")}
      />
    );
  }

  return (
    <div className="mt-6 flex flex-1 flex-col lg:mt-8 lg:flex-none">
      {/* ── Lo ya resuelto, encogido ── */}
      {diaElegido && dia ? (
        <Resuelto
          texto={fechaLarga(new Date(dia.huecos[0].iso))}
          onCambiar={() => {
            setPaso("dia");
            setHoraElegida(null);
          }}
        />
      ) : null}

      {horaElegida && paso === "datos" ? (
        <Resuelto
          texto={
            otraHora
              ? `${horaEnZona(new Date(horaElegida))} de Henry · para ti las ${horaEnZona(new Date(horaElegida), zonaVisitante)}`
              : `${horaEnZona(new Date(horaElegida))} · hora de Henry`
          }
          onCambiar={() => setPaso("hora")}
        />
      ) : null}

      {/* ── Paso 1 · el día ── */}
      {paso === "dia" ? (
        <>
          <h1 className="mt-6 font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:mt-7 lg:text-[40px] lg:leading-[1.12]">
            ¿Qué día nos vemos?
          </h1>
          <div className="mt-5 grid grid-cols-3 gap-2.5 lg:mt-[18px] lg:grid-cols-4">
            {dias.map((d) => {
              const primero = new Date(d.huecos[0].iso);
              const libres = d.huecos.filter((h) => h.libre).length;
              /* El número del día sale de la CLAVE («2026-08-20»), que ya es
                 la fecha local de Utah. Sacarlo del instante con
                 `getUTCDate()` daba el día equivocado para las horas de la
                 tarde, cuando en UTC ya es el día siguiente. */
              const numeroDia = Number(d.clave.slice(8, 10));
              /* UN DÍA LLENO TAMBIÉN SE ABRE.
                 Antes llevaba `disabled` cuando no quedaba ninguna hora
                 libre, y eso escondía la agenda entera: quien caía en un día
                 completo no veía que hubiera horario, veía un botón muerto.
                 Ahora entra igual y encuentra las horas tachadas, que dicen
                 dos cosas que el botón muerto callaba — que Henry atiende a
                 esas horas, y que están tomadas. */
              return (
                <button
                  key={d.clave}
                  type="button"
                  onClick={() => elegirDia(d.clave)}
                  className={
                    libres === 0
                      ? "flex min-h-[82px] flex-col items-center justify-center gap-0.5 rounded-[20px] border border-white/10 text-apagado transition-colors hover:border-white/30"
                      : "flex min-h-[82px] flex-col items-center justify-center gap-0.5 rounded-[20px] border border-white/25 transition-colors hover:border-acento"
                  }
                >
                  <span className="text-[12px] font-bold">{diaCorto(primero)}</span>
                  <span className="text-[26px] font-extrabold leading-none tracking-[-0.03em]">
                    {numeroDia}
                  </span>
                  <span className="text-[13px]">
                    {libres === 0 ? "lleno" : `${libres} ${libres === 1 ? "hora" : "horas"}`}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ── Paso 2 · la hora ── */}
      {paso === "hora" && dia ? (
        <>
          <h1 className="mt-6 font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:mt-7 lg:text-[40px] lg:leading-[1.12]">
            ¿A qué hora nos vemos?
          </h1>

          {/* Dónde está quien reserva, ESCRITO y corregible.
              Antes se adivinaba del navegador y no se decía nunca: si el
              teléfono venía mal configurado o había una VPN, la segunda hora
              salía mal y no había forma de que nadie lo notara. */}
          {eligiendoEstado ? (
            <div className="mt-5 rounded-[20px] border border-white/20 p-4">
              <p className="text-[15px] font-semibold">¿En qué estado estás?</p>
              <div className="mt-3 max-h-[280px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS.map((e) => (
                    <button
                      key={e.nombre}
                      type="button"
                      onClick={() => elegirEstado(e.nombre)}
                      className={
                        e.nombre === estado?.nombre
                          ? "min-h-[44px] rounded-full border border-acento bg-acento/15 px-3 text-[14px] text-tinta"
                          : "min-h-[44px] rounded-full border border-white/20 px-3 text-[14px] text-tinta-suave"
                      }
                    >
                      {e.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Pregunta mientras es una SUPOSICIÓN; afirma en cuanto lo ha
               elegido una persona. La diferencia importa: «Estás en Carolina
               del Norte» se lee como un hecho comprobado y nadie lo corrige,
               y el navegador acierta la zona pero no el estado. */
            <button
              type="button"
              onClick={() => setEligiendoEstado(true)}
              className="caja-estado mt-4 flex min-h-[56px] w-full items-center gap-3 rounded-[18px] border px-4 py-2.5 text-left"
            >
              <span aria-hidden="true" className="shrink-0 text-acento">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-semibold uppercase tracking-[0.1em] text-acento">
                  {estadoElegido ? "Tu estado" : "¿Es aquí donde estás?"}
                </span>
                <span className="mt-0.5 block truncate text-[17px] font-bold text-tinta">
                  {estado?.nombre}
                </span>
              </span>

              <span className="boton-cambiar shrink-0 rounded-full px-3.5 py-2 text-[14px] font-semibold">
                Cambiar
              </span>
            </button>
          )}

          {/* Y lo que de verdad hace que nadie se vuelva a equivocar: no el
              número, sino la RELACIÓN. Quien entiende que va dos horas por
              delante ya lee bien toda la rejilla; quien sólo ve «para ti,
              las 15:00» tiene que fiarse hueco por hueco. */}
          {!eligiendoEstado && estado && dia ? (
            /* En neutro, no en acento. Va justo debajo de la caja del estado
               y con el mismo color las dos se anulaban: si todo destaca, no
               destaca nada. El acento se queda donde hay algo que TOCAR; esto
               sólo se lee. */
            <p className="mt-2.5 rounded-[18px] border border-white/12 bg-white/[0.04] px-4 py-3 text-[15px] leading-[1.45] text-tinta-suave">
              {desfase === 0 ? (
                <>
                  En {estado.nombre} tienes{" "}
                  <strong className="font-semibold text-tinta">la misma hora</strong> que
                  Henry, así que lo que veas es lo que hay.
                </>
              ) : (
                <>
                  En {estado.nombre} vas{" "}
                  <strong className="font-semibold text-tinta">
                    {Math.abs(desfase)} {Math.abs(desfase) === 1 ? "hora" : "horas"}{" "}
                    {desfase > 0 ? "por delante" : "por detrás"}
                  </strong>{" "}
                  de Henry. Sus {horaEnZona(new Date(dia.huecos[0].iso))} son tus{" "}
                  {horaEnZona(new Date(dia.huecos[0].iso), zonaVisitante)}.
                </>
              )}
            </p>
          ) : null}

          {/* La segunda pregunta, SÓLO en los doce estados partidos. Con
              ciudades y no con nombres de zona: «¿más cerca de El Paso o de
              Houston?» lo contesta cualquiera; «¿Mountain o Central?» no. */}
          {!eligiendoEstado && estado && estado.zonas.length > 1 ? (
            <div className="mt-2.5 rounded-[20px] border border-white/15 px-4 py-3">
              <p className="text-[14px] text-tinta-suave">
                En {estado.nombre} hay dos horas distintas. ¿Cuál te queda más cerca?
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {estado.zonas.map((z, i) => (
                  <button
                    key={z.zona}
                    type="button"
                    onClick={() => setMitad(i)}
                    className={
                      i === mitad
                        ? "min-h-[44px] rounded-full border border-acento bg-acento/15 px-4 text-[14px] text-tinta"
                        : "min-h-[44px] rounded-full border border-white/20 px-4 text-[14px] text-tinta-suave"
                    }
                  >
                    {z.donde}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
            {dia.huecos.map((h) => {
              const cuando = new Date(h.iso);
              return (
                <button
                  key={h.iso}
                  type="button"
                  disabled={!h.libre}
                  onClick={() => {
                    setHoraElegida(h.iso);
                    setPaso("datos");
                  }}
                  className={
                    h.libre
                      ? "flex min-h-[84px] flex-col justify-center gap-0.5 rounded-[20px] border border-white/25 px-[18px] py-3 text-left transition-colors hover:border-acento"
                      : "flex min-h-[84px] flex-col justify-center gap-0.5 rounded-[20px] border border-white/10 px-[18px] py-3 text-left text-apagado"
                  }
                >
                  {/* La hora de Henry, y DICIENDO que es la suya. Ir sin
                      apellido es lo que costó la cita de Carolina del Sur. */}
                  <span
                    className={
                      h.libre
                        ? "text-[20px] font-extrabold"
                        : "text-[20px] font-extrabold line-through"
                    }
                  >
                    {horaEnZona(cuando)}
                  </span>
                  <span className="text-[12px] text-tinta-tenue">hora de Henry · Utah</span>

                  {/* Y la de quien reserva, sólo cuando de verdad es otra:
                      repetir el mismo número con dos etiquetas hace dudar de
                      si el sitio se equivocó. */}
                  {h.libre && otraHora ? (
                    <span className="mt-1.5 text-[13px] text-tinta-suave">
                      Para ti: {horaEnZona(cuando, zonaVisitante)}
                    </span>
                  ) : null}
                  {!h.libre ? (
                    <span className="mt-1.5 text-[13px] text-tinta-tenue">apartada</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {paso === "datos" && horaElegida ? (
        <>
          <h1 className="mt-6 font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em] lg:mt-7 lg:text-[40px] lg:leading-[1.12]">
            Llena tus datos
          </h1>

          <div className="mt-5 flex flex-col gap-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5">
            <Campo
              etiqueta="Tu nombre"
              valor={nombre}
              onCambio={setNombre}
              autoComplete="name"
            />
            <Campo
              etiqueta="Tu correo"
              valor={correo}
              onCambio={setCorreo}
              tipo="email"
              autoComplete="email"
            />
            <Campo
              etiqueta="Tu WhatsApp"
              valor={whatsapp}
              onCambio={setWhatsapp}
              tipo="tel"
              autoComplete="tel"
              ayuda="Con el código de país, así: +1 385 456 4470. Por ahí le mandas el comprobante y él te manda el enlace."
            />

            <label className="flex min-h-[56px] items-center rounded-2xl bg-white/[0.07] px-4">
              <span className="sr-only">Tu nacionalidad</span>
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="w-full bg-transparent text-[17px] text-tinta outline-none"
              >
                <option value="" className="bg-fondo">
                  Tu nacionalidad
                </option>
                {PAISES.map((p) => (
                  <option key={p.codigo} value={p.codigo} className="bg-fondo">
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="mt-1">
              <legend className="text-[15px] text-tinta-tenue">
                ¿Ya estás en Estados Unidos?
              </legend>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <Opcion
                  texto="Sí, ya estoy"
                  activa={enEeuu === true}
                  onElegir={() => setEnEeuu(true)}
                />
                <Opcion
                  texto="Todavía no"
                  activa={enEeuu === false}
                  onElegir={() => setEnEeuu(false)}
                />
              </div>
            </fieldset>
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-[15px] leading-[1.45] text-aviso">
              {error}
            </p>
          ) : null}

          {!conectada ? (
            <p className="mt-4 text-[15px] leading-[1.45] text-aviso">
              La agenda todavía no está conectada, así que este botón no puede
              apartar nada. Está dicho aquí para que no lo descubras después de
              pulsarlo.
            </p>
          ) : null}

          <button
            type="button"
            onClick={enviar}
            disabled={enCurso || !nombre || !correo || !whatsapp || !pais || enEeuu === null}
            className="mt-6 flex min-h-[60px] w-full items-center justify-between rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo transition-opacity disabled:opacity-40"
          >
            <span>{enCurso ? "Apartando…" : "Apartar mi hora"}</span>
            <span>{`$${servicio.precioUsd}`}</span>
          </button>
        </>
      ) : null}

      {/* Lo que falta, para que nadie se pregunte cuánto queda */}
      {paso !== "datos" ? (
        <div className="mt-6 flex items-center gap-2.5 border-t border-white/15 pt-4">
          <span
            aria-hidden="true"
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-white/25 text-[12px] text-tinta-tenue"
          >
            {paso === "dia" ? "2" : "1"}
          </span>
          <span className="text-[16px] text-tinta-tenue">
            {paso === "dia"
              ? "Después: la hora, y tus datos para que Henry te escriba."
              : "Después sólo te pido tu nombre, tu WhatsApp, tu correo y de dónde eres."}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * «viernes 21 de agosto a las 10:00 de Utah (11:00 donde estás)».
 *
 * La hora de Utah es la que Henry tiene en la cabeza y la que va a leer en su
 * panel; la local es la que hay que poner en el despertador. Sólo se dicen
 * las dos cuando de verdad son distintas: repetir la misma hora dos veces
 * hace dudar de si el sitio se ha equivocado.
 */
function describirCita(
  iso: string,
  zonaVisitante: string,
  servicio: Servicio,
  estado: string | null,
): string {
  const cuando = new Date(iso);
  const enUtah = horaEnZona(cuando);
  const enSuCasa = horaEnZona(cuando, zonaVisitante);
  const fecha = fechaLarga(cuando);
  /* Con el nombre del estado, no con «donde estás». Quien lo lee en la
     pantalla de pago acaba de decirnos dónde vive: devolvérselo con su
     nombre es lo que confirma que le entendimos. */
  const suSitio = estado ? `en ${estado}` : "donde estás";

  /* Dos formas de la misma cita, y cada una va a un sitio: la larga se pinta
     en pantalla, la de Utah se manda por WhatsApp. Van juntas en un JSON en
     vez de en dos claves para que no puedan quedar descolgadas la una de la
     otra si alguien limpia media sesión. */
  return JSON.stringify({
    completa:
      enUtah === enSuCasa
        ? `${fecha} a las ${enUtah}`
        : `${fecha} a las ${enUtah} de Henry, en Utah — para ti las ${enSuCasa} ${suSitio}`,
    utah: `${fecha} a las ${enUtah}`,
    /* Qué se apartó y cuánto cuesta viajan con la cita: la pantalla de pago
       tiene que decir la cifra exacta de ESTA preparación, y con tres
       precios distintos ya no puede sacarla de una constante. */
    servicio: nombreLargo(servicio),
    precio: servicio.precioUsd,
  });
}

function Resuelto({ texto, onCambiar }: { texto: string; onCambiar: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3.5 pt-3">
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-acento text-fondo"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="text-[16px] font-bold first-letter:uppercase">{texto}</span>
      </span>
      <button
        type="button"
        onClick={onCambiar}
        className="text-[15px] text-tinta-tenue underline underline-offset-4"
      >
        cambiar
      </button>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambio,
  tipo = "text",
  autoComplete,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  tipo?: string;
  autoComplete?: string;
  ayuda?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{etiqueta}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={etiqueta}
        autoComplete={autoComplete}
        autoCapitalize={tipo === "email" ? "none" : "words"}
        autoCorrect="off"
        spellCheck={false}
        className="min-h-[56px] w-full rounded-2xl bg-white/[0.07] px-4 text-[17px] text-tinta outline-none placeholder:text-tinta-tenue"
      />
      {ayuda ? <span className="mt-1.5 block text-[14px] text-tinta-tenue">{ayuda}</span> : null}
    </label>
  );
}

function Opcion({
  texto,
  activa,
  onElegir,
}: {
  texto: string;
  activa: boolean;
  onElegir: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      onClick={onElegir}
      className={
        activa
          ? "flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-acento bg-acento/15 px-3 text-[17px] font-bold"
          : "flex min-h-[56px] items-center justify-center rounded-2xl border border-white/25 px-3 text-[17px]"
      }
    >
      {texto}
    </button>
  );
}
