"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PAISES } from "@/lib/paises";
import { diaCorto, fechaLarga, horaEnZona } from "@/lib/horario";
import type { DiaConHuecos } from "@/lib/citas";
import { reservar } from "@/app/reservar/accion";
import { CLAVE_CITA } from "@/lib/pago";

/**
 * UNA COSA A LA VEZ.
 *
 * Tres pasos —día, hora, quién eres— pero nunca los tres a la vez en
 * pantalla: lo ya resuelto se encoge a una línea con su palomita y lo que
 * falta se anuncia al pie. Así nadie se pregunta cuánto queda, que es la
 * razón por la que la gente abandona un formulario a la mitad.
 *
 * ── La hora, dos veces ──
 *
 * Cada hueco dice qué hora es en Utah y qué hora es DONDE ESTÁ QUIEN MIRA.
 * La mitad de este público no está en Utah, y «11:00» sin apellido es una
 * cita perdida. La zona del visitante sale del navegador, nunca de su IP:
 * una IP puede ser la de una VPN o la de la biblioteca del pueblo de al lado.
 */

type Paso = "dia" | "hora" | "datos";

export function FormularioReserva({
  dias,
  conectada,
}: {
  dias: DiaConHuecos[];
  conectada: boolean;
}) {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();

  const [paso, setPaso] = useState<Paso>("dia");
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  const [horaElegida, setHoraElegida] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [pais, setPais] = useState("");
  const [enEeuu, setEnEeuu] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* La zona del navegador, resuelta una vez. En el primer render del
     servidor no existe, así que se cae a la de Utah y se corrige al montar
     — nunca al revés, o el servidor y el cliente pintarían horas distintas. */
  const zonaVisitante = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "America/Denver";
    }
  }, []);

  const dia = dias.find((d) => d.clave === diaElegido) ?? null;

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
      });
      if (r.ok) {
        /* La cita viaja a la pantalla de pago por `sessionStorage`, NO por la
           URL: una dirección se queda en el historial del teléfono y en el
           portapapeles de quien la copie. Y si el almacenamiento está
           bloqueado, la pantalla de pago sigue funcionando sin la hora — que
           es un adorno, mientras que los datos del banco no lo son. */
        try {
          sessionStorage.setItem(CLAVE_CITA, describirCita(horaElegida, zonaVisitante));
        } catch {
          /* modo privado */
        }
        router.push("/gracias");
      } else setError(r.motivo);
    });
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
          texto={`${horaEnZona(new Date(horaElegida))} · hora de Utah`}
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
              return (
                <button
                  key={d.clave}
                  type="button"
                  disabled={libres === 0}
                  onClick={() => elegirDia(d.clave)}
                  className={
                    libres === 0
                      ? "flex min-h-[82px] flex-col items-center justify-center gap-0.5 rounded-[20px] border border-white/10 text-apagado"
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
          <h1 className="mt-6 font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em]">
            ¿A qué hora nos vemos?
          </h1>
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:mt-[18px] lg:grid-cols-3">
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
                      ? "flex min-h-[72px] flex-col justify-center gap-0.5 rounded-[20px] border border-white/25 px-[18px] text-left transition-colors hover:border-acento"
                      : "flex min-h-[72px] flex-col justify-center gap-0.5 rounded-[20px] border border-white/10 px-[18px] text-left text-apagado"
                  }
                >
                  <span
                    className={
                      h.libre
                        ? "text-[20px] font-extrabold"
                        : "text-[20px] font-extrabold line-through"
                    }
                  >
                    {horaEnZona(cuando)}
                  </span>
                  <span className="text-[13px] text-tinta-tenue">
                    {h.libre
                      ? `${horaEnZona(cuando, zonaVisitante)} donde estás`
                      : "apartada"}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ── Paso 3 · quién eres ── */}
      {paso === "datos" && horaElegida ? (
        <>
          <h1 className="mt-6 font-titulo text-[32px] font-semibold leading-[1.14] tracking-[-0.02em]">
            ¿Con quién nos vemos?
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
              ayuda="Para que Henry pueda escribirte si hace falta."
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
            disabled={enCurso || !nombre || !correo || !pais || enEeuu === null}
            className="mt-6 flex min-h-[60px] w-full items-center justify-between rounded-full bg-acento px-7 text-[18px] font-extrabold tracking-[-0.02em] text-fondo transition-opacity disabled:opacity-40"
          >
            <span>{enCurso ? "Apartando…" : "Apartar mi hora"}</span>
            <span>$150</span>
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
            {paso === "dia" ? "3" : "2"}
          </span>
          <span className="text-[16px] text-tinta-tenue">
            {paso === "dia"
              ? "Después: la hora, y tu nombre, correo y de dónde eres."
              : "Después sólo te pido tu nombre, tu correo y de dónde eres."}
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
function describirCita(iso: string, zonaVisitante: string): string {
  const cuando = new Date(iso);
  const enUtah = horaEnZona(cuando);
  const enSuCasa = horaEnZona(cuando, zonaVisitante);
  const fecha = fechaLarga(cuando);

  /* Dos formas de la misma cita, y cada una va a un sitio: la larga se pinta
     en pantalla, la de Utah se manda por WhatsApp. Van juntas en un JSON en
     vez de en dos claves para que no puedan quedar descolgadas la una de la
     otra si alguien limpia media sesión. */
  return JSON.stringify({
    completa:
      enUtah === enSuCasa
        ? `${fecha} a las ${enUtah}`
        : `${fecha} a las ${enUtah} de Utah (${enSuCasa} donde estás)`,
    utah: `${fecha} a las ${enUtah}`,
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
