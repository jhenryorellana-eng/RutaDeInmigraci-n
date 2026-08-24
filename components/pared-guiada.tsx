"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AgenteChat } from "@/components/agente-chat";
import { HojaServicios } from "@/components/hoja-servicios";
import { ENLACES, type Enlace } from "@/lib/enlaces";

/**
 * LA PARED, CON GUÍA.
 *
 * Al entrar, alguien señala los cuatro servicios de uno en uno, dice para
 * qué es cada uno, invita a preguntar y se retira a la esquina.
 *
 * ── Por qué hace falta ──
 *
 * Porque los cuatro se parecen. «Preparación de audiencia», «Comunidad»,
 * «Servicio Migratorio» y «Bootcamp» son cuatro cosas distintas para cuatro
 * momentos distintos, y quien llega de una biografía de Instagram no tiene
 * forma de saber cuál es el suyo. Antes se resolvía con un párrafo que nadie
 * leía; ahora se resuelve señalando.
 *
 * ── Lo que NO hace ──
 *
 * No tapa la pared, no atrapa el foco y no bloquea nada. El globo lleva
 * `pointer-events: none` y CUALQUIER toque en la pantalla lo termina: quien
 * ya sabe a qué viene entra sin esperar a que acabe de hablar. Ésa es toda
 * la diferencia entre un guía y un anuncio.
 *
 * ── Una vez, y sólo una ──
 *
 * Se recuerda en `sessionStorage`, así que volver atrás desde un servicio no
 * lo vuelve a lanzar. Al segundo paso por aquí ya estorbaría.
 */

/** -1 nada dicho aún · 0-3 los cuatro servicios · 4 la invitación · 5 retirado. */
type Paso = -1 | 0 | 1 | 2 | 3 | 4 | 5;

const VISTO = "ruta:guia-vista";

/**
 * Cuánto se queda cada frase en pantalla.
 *
 * Por caracteres y no un tiempo fijo: la frase del bootcamp es la mitad de
 * larga que la de la comunidad, y darles lo mismo deja una a medio leer y la
 * otra esperando. A ~30 ms por carácter se lee sin prisa y sin sobra.
 */
function duracion(texto: string) {
  return 1400 + texto.length * 26;
}

/** Deja constancia de que ya se enseñó. Falla en silencio a propósito. */
function anotarVisto() {
  try {
    sessionStorage.setItem(VISTO, "1");
  } catch {
    /* Navegación privada con el almacenamiento capado: no poder recordarlo
       no es motivo para romper la pantalla. */
  }
}

export function ParedGuiada() {
  const [paso, setPaso] = useState<Paso>(-1);
  const [chat, setChat] = useState(false);
  const relojes = useRef<ReturnType<typeof setTimeout>[]>([]);

  function parar() {
    relojes.current.forEach(clearTimeout);
    relojes.current = [];
  }

  /* Terminar es ir directo al final: las cuatro encendidas y la burbuja en su
     sitio. Nunca se «cancela» dejando la pared a medias.
     Y es AQUÍ donde se anota que ya se vio —no al empezar—: anotarlo al
     arrancar lo daba por enseñado sin haberlo enseñado. En desarrollo, donde
     React monta cada efecto dos veces, la segunda pasada se encontraba la
     marca puesta por la primera y no llegaba a correr nunca. */
  function terminar() {
    parar();
    anotarVisto();
    setPaso(5);
  }

  useEffect(() => {
    /* Quien pide menos movimiento no ve el recorrido. No se pierde nada: la
       pared encendida y la burbuja son el mismo estado al que lleva. */
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let yaVisto = false;
    try {
      yaVisto = sessionStorage.getItem(VISTO) === "1";
    } catch {
      /* Navegación privada con el almacenamiento capado: que se vea, es
         preferible a romper la pantalla por un guía. */
    }

    if (quieto || yaVisto) {
      setPaso(5);
      return;
    }

    let t = 600;
    const pasos: Paso[] = [0, 1, 2, 3, 4];
    pasos.forEach((p) => {
      relojes.current.push(setTimeout(() => setPaso(p), t));
      t += duracion(p === 4 ? INVITACION : ENLACES[p].guia);
    });
    relojes.current.push(
      setTimeout(() => {
        anotarVisto();
        setPaso(5);
      }, t),
    );

    return parar;
  }, []);

  /* Un toque en cualquier sitio lo da por terminado. En `capture` y sobre el
     documento para que llegue ANTES que el propio enlace: quien toca una
     tarjeta mientras el guía habla, entra — y la pared que deja atrás ya está
     en su estado final. */
  useEffect(() => {
    if (paso === 5) return;
    const salir = () => terminar();
    /* Se registra sólo mientras el guía habla, así que no hay riesgo de que
       un toque dentro del chat —que aún no existe en ese momento— lo cierre
       por sorpresa. */
    document.addEventListener("pointerdown", salir, { capture: true });
    return () => document.removeEventListener("pointerdown", salir, { capture: true });
  }, [paso]);

  const guiando = paso >= 0 && paso <= 3;

  /* Mientras el guía señala, el retrato se desenfoca y el nombre se apaga.
     Se avisa con un atributo en la raíz porque lo que hay que atenuar —la
     fotografía, el título— vive en un componente de servidor, arriba del
     árbol: subir estado hasta allí obligaría a volver cliente media pantalla
     por un cambio que es puramente de pintura. El CSS hace el resto. */
  useEffect(() => {
    const raiz = document.documentElement;
    if (guiando) raiz.dataset.guia = "hablando";
    else delete raiz.dataset.guia;
    return () => {
      delete raiz.dataset.guia;
    };
  }, [guiando]);

  return (
    <>
      <div className="relative mt-7 flex flex-col gap-2.5">
        {ENLACES.map((enlace, i) => {
          const activo = guiando && i === paso;
          /* El globo sale debajo de su tarjeta, salvo en la última: allí se
             saldría de la columna, así que sale por encima y le da la vuelta
             al pico. */
          const debajo = i < ENLACES.length - 1;

          return (
            /* El z-index va en el ENVOLTORIO, no en el globo.
               Cada tarjeta es hermana de las demás, así que un globo con
               `z-20` dentro de un envoltorio sin z-index sigue perdiendo
               contra los hermanos que vienen después: medido, quien se
               pintaba encima del globo era la descripción de la tarjeta
               siguiente. Con el envoltorio elevado, el globo tapa lo que
               tiene debajo, que es justo lo que se espera de un globo. */
            <div
              key={enlace.href}
              className={`relative tono-${enlace.tono} ${activo ? "z-30" : "z-10"}`}
            >
              <Panel
                enlace={enlace}
                luz={activo ? "activo" : guiando ? "atenuado" : "encendido"}
              />

              {activo ? (
                <div
                  role="status"
                  data-pico={debajo ? "arriba" : "abajo"}
                  className={`globo-guia absolute inset-x-1 z-20 rounded-2xl border bg-noche-panel px-3.5 py-3 ${
                    debajo ? "top-full mt-2" : "bottom-full mb-2"
                  }`}
                  style={{
                    borderColor: "rgb(var(--tono) / 0.3)",
                    boxShadow:
                      "0 0 0 1px rgb(var(--tono) / 0.12), 0 0 24px rgb(var(--tono) / 0.18), 0 14px 36px rgba(0,0,0,.5)",
                  }}
                >
                  <p className="text-[15px] leading-[1.5]">{enlace.guia}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* La invitación baja a la esquina antes de encogerse, para que el ojo
          siga el movimiento y sepa dónde se quedó. */}
      {paso === 4 ? (
        <div
          role="status"
          className="globo-guia tono-agua fixed bottom-4 right-4 z-30 w-[268px] rounded-[18px] rounded-br-md border border-agua/30 bg-noche-panel px-3.5 py-3.5 shadow-[0_0_26px_rgba(159,232,216,.2),0_18px_44px_rgba(0,0,0,.55)]"
        >
          <p className="text-[15px] leading-[1.5]">
            ¿No sabes cuál te toca? Pregúntame — me quedo aquí abajo.
          </p>
        </div>
      ) : null}

      {/* Y la burbuja, que abre el guion de preguntas. No lleva a WhatsApp:
          quien toca aquí quiere resolver una duda, no abrir otra aplicación
          y esperar respuesta. Hablar con Henry es la última pregunta del
          guion, para quien la necesite. */}
      {paso === 5 && !chat ? (
        <button
          type="button"
          onClick={() => setChat(true)}
          aria-label="Abrir la guía"
          aria-expanded={chat}
          className="burbuja-guia fixed bottom-4 right-4 z-30 flex size-[52px] items-center justify-center rounded-full border border-agua/30 bg-noche-panel text-agua shadow-[0_0_30px_rgba(159,232,216,.22),0_0_70px_rgba(159,232,216,.1)]"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.6-.7L3 21l1.9-4.6A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
          </svg>
        </button>
      ) : null}

      <AgenteChat abierto={chat} alCerrar={() => setChat(false)} />
    </>
  );
}

const INVITACION = "¿No sabes cuál te toca? Pregúntame — me quedo aquí abajo.";

function Panel({ enlace, luz }: { enlace: Enlace; luz: string }) {
  /* Cuatro luces girando en fase parecen un mecanismo; desfasadas, cuatro
     cosas vivas. El desfase sale de la posición del servicio en la lista. */
  const desfase = (ENLACES.findIndex((e) => e.href === enlace.href) * 7) / 4;

  const dentro = (
    <>
      {/* El canto quieto de arriba, que es lo que da el volumen del cristal,
          y la luz que da la vuelta al cuadro. El desfase se calcula del
          propio identificador para que sea estable entre recargas: aleatorio,
          cada visita las colocaría en otro sitio. */}
      <span
        aria-hidden="true"
        className="filo-luz absolute inset-x-[22%] top-0 h-px"
        style={{ color: "rgb(var(--tono))" }}
      />
      <span aria-hidden="true" className="filo-vivo">
        <span style={{ animationDelay: `-${desfase}s` }} />
      </span>

      <div className="relative flex items-center gap-3">
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full"
          style={{ background: "rgb(var(--tono))" }}
        />

        <span className="min-w-0 flex-1">
          <span
            className={
              enlace.destacado
                ? /* 17px por debajo de 360px de ancho: a 18 px, «Preparación de
                     audiencia» se salía por 13 px en un iPhone SE y se cortaba
                     con puntos suspensivos. La jerarquía se mantiene igual —lo
                     que la hace es el contraste con los 16 px de al lado, no el
                     número. */
                  "block truncate text-[17px] font-bold tracking-[-0.02em] min-[360px]:text-[18px]"
                : "block truncate text-[16px] font-semibold tracking-[-0.01em]"
            }
          >
            {enlace.titulo}
          </span>
          <span
            className={
              enlace.destacado
                ? "mt-0.5 block truncate text-[13px] font-normal text-tinta/80"
                : "mt-0.5 block truncate text-[12px] font-light text-tinta/75"
            }
          >
            {enlace.descripcion}
          </span>
        </span>

        <span aria-hidden="true" className="shrink-0" style={{ color: "rgb(var(--tono))" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </div>
    </>
  );

  const clases =
    "panel-servicio relative block overflow-hidden rounded-2xl border px-4 py-3.5 text-left backdrop-blur-[14px]";

  if (enlace.abreServicios) {
    return (
      <HojaServicios>
        <span className={clases} data-luz={luz}>
          {dentro}
        </span>
      </HojaServicios>
    );
  }

  return enlace.interno ? (
    <Link href={enlace.href} className={clases} data-luz={luz}>
      {dentro}
    </Link>
  ) : (
    <a
      href={enlace.href}
      target="_blank"
      rel="noopener noreferrer"
      className={clases}
      data-luz={luz}
    >
      {dentro}
    </a>
  );
}
