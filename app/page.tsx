import Image from "next/image";
import Link from "next/link";

import { SERVICIOS, type Servicio } from "@/lib/servicios";

/**
 * HOJA 1 — LA PORTADA, AHORA UNA LANDING.
 *
 * Antes esta pantalla era una sola pregunta y un botón: diecinueve palabras.
 * Servía cuando quien llegaba ya sabía a qué venía —porque Henry se lo había
 * dicho por teléfono— pero ahora llega gente de TikTok que no sabe ni qué es
 * una audiencia preliminar, y a esa persona diecinueve palabras no le bastan
 * para soltar $70.
 *
 * ── Por qué paneles y no secciones ──
 *
 * Porque la mitad de esta gente llega deslizando: acaba de pasar quince
 * vídeos a pantalla completa con el pulgar. La página no le cambia el gesto
 * — un panel del alto de la pantalla, una idea por panel, y se sigue
 * bajando. Los paneles miden `88svh` y no `100svh` a propósito: dejar
 * asomar el borde del siguiente es lo que dice que hay más abajo. Con la
 * pantalla justa, quien no ve nada asomando cree que la página se acabó.
 *
 * ── Lo que se dice de cada audiencia, y de dónde sale ──
 *
 * Es PROCEDIMIENTO GENERAL de la corte de inmigración, no el caso de nadie:
 * contrastado con el manual del EOIR —el master calendar es el «pre-trial
 * docket» y el individual el «trial docket»; en la preliminar el juez «will
 * not hear witnesses or make rulings on the merits»— y con materiales del
 * ILRC sobre qué se declara en esa primera cita y qué se pierde declarando
 * mal.
 *
 * Está escrito así por una razón que este repositorio ya tenía puesta por
 * escrito en `lib/guia-respuestas.ts`: esto se lo lee gente que está a
 * semanas de su audiencia, y una frase inventada aquí no es un fallo de
 * producto, es una persona tomando una decisión mala con información falsa.
 *
 * Por eso el último panel dice DOS cosas y no una: que Henry no es abogado,
 * y que esto es cómo funciona la corte en general y no lo que va a pasar en
 * tu caso. La segunda es la que permite publicar la primera sin engañar a
 * nadie, y no se quita.
 *
 * ── Los precios no están escritos aquí ──
 *
 * Salen de `lib/servicios.ts`, que es donde vive el catálogo. Con tres
 * precios en juego, un «$70» a mano en esta pantalla es el que se queda
 * viejo el día que alguno cambie — ya pasó una vez con el «desde $50» de la
 * pared de enlaces.
 */

/**
 * Lo que se cuenta de cada preparación, atado al id del servicio.
 *
 * Vive aquí y no en `lib/servicios.ts` porque es COPIA DE ESTA PANTALLA: el
 * catálogo dice qué se vende y cuánto cuesta, y eso lo consumen el panel,
 * los avisos y la hoja de precios. Meterle tres párrafos de landing lo
 * convertiría en un archivo de marketing.
 */
type Relato = {
  /** El color con el que se pinta ese panel. Sale de los tonos de la marca. */
  tono: "agua" | "oro" | "coral";
  /** Dos o tres frases sobre qué ocurre ese día. */
  dice: string[];
  /** Lo que hay que entender aunque no se lea el resto. Va en recuadro. */
  clave: React.ReactNode;
  /** La línea que ata el procedimiento con el servicio. */
  cierre: string;
};

const RELATOS: Record<Servicio["id"], Relato> = {
  primera: {
    tono: "agua",
    dice: [
      "Es corta. El juez confirma quién eres y te pregunta por el papel con el que te llamaron a corte: qué admites y qué niegas, y si aceptas o discutes que puedan deportarte.",
      "Dices qué defensa vas a pedir. El juez pone las fechas de entrega de tus documentos y la fecha de tu juicio.",
    ],
    clave: (
      <>
        No declaran testigos y no se decide nada de tu caso. Pero{" "}
        <strong className="font-bold text-tinta">lo que respondas ese día queda</strong>, y
        una respuesta mal dada puede cerrarte defensas que ya no recuperas.
      </>
    ),
    cierre: "Eso es lo que preparamos en los 45 minutos.",
  },
  segunda: {
    tono: "oro",
    dice: [
      "No todo el mundo tiene una. Se convoca cuando algo quedó pendiente: buscabas abogado, faltaba entregar tu solicitud, o el juez pidió más documentos.",
      "Es donde se cierra el expediente antes del juicio: se repasa lo entregado, se confirman los plazos y suele salir la fecha de la audiencia de mérito.",
    ],
    clave: (
      <>
        Llegar con todo entregado y en orden es lo que evita{" "}
        <strong className="font-bold text-tinta">otro aplazamiento</strong>. Y aquí ya no
        hablas de trámites: hablas de la defensa que vas a sostener en el juicio.
      </>
    ),
    cierre: "Por eso esta preparación lleva más trabajo que la primera.",
  },
  tercera: {
    tono: "coral",
    dice: [
      "Es el juicio, y dura horas, no minutos. Ese día la corte se ocupa de tu caso y de ninguno más.",
      "Declaras tú, y después el abogado del gobierno te repregunta. Pueden declarar tus testigos y se presentan tus pruebas.",
    ],
    clave: (
      <>
        Al final <strong className="font-bold text-tinta">el juez decide si te quedas</strong>,
        muchas veces ahí mismo en la sala. Es la audiencia que resuelve.
      </>
    ),
    cierre:
      "Contar tu historia bien contada, y aguantar las repreguntas, es lo que preparamos.",
  },
};

/**
 * Las clases de cada tono, escritas enteras y no compuestas.
 *
 * Tailwind borra en compilación las clases que no encuentra literalmente en
 * el código, así que `text-${tono}` llegaría al navegador sin ninguna regla
 * detrás y los tres paneles saldrían del mismo color. Es el fallo clásico, y
 * es silencioso: compila, se despliega, y sólo se ve mirando la pantalla.
 */
const TONOS = {
  agua: {
    texto: "text-agua",
    numero: "text-agua/25",
    recuadro: "border-l-agua bg-agua/10",
    boton: "bg-agua text-noche",
  },
  oro: {
    texto: "text-oro",
    numero: "text-oro/25",
    recuadro: "border-l-oro bg-oro/10",
    boton: "bg-oro text-noche",
  },
  coral: {
    texto: "text-coral",
    numero: "text-coral/25",
    recuadro: "border-l-coral bg-coral/15",
    boton: "bg-[#D8201F] text-white",
  },
} as const;

export default function Portada() {
  return (
    <main className="mx-auto w-full max-w-[560px] bg-noche">
      <PanelRetrato />
      <PanelHistoria />
      <PanelDosTipos />

      {SERVICIOS.map((s, i) => (
        <PanelAudiencia key={s.id} servicio={s} numero={i + 1} />
      ))}

      <PanelCierre />
    </main>
  );
}

/* ── 1 · La cara y la frase ─────────────────────────────────── */

function PanelRetrato() {
  return (
    <section className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden px-6 pb-11">
      <Image
        src="/henry-retrato.jpg"
        alt="Henry Orellana Domínguez, fundador de ANDEX"
        width={940}
        height={1672}
        priority
        sizes="(min-width: 560px) 560px, 100vw"
        className="absolute inset-0 size-full object-cover object-[50%_14%]"
      />
      {/* El velo. Cuatro paradas y no dos: con una sola transición la cara se
          apaga antes de tiempo, y el corte se ve como una banda. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,27,61,0.55)_0%,rgba(6,27,61,0.05)_32%,rgba(6,27,61,0.88)_74%,var(--color-noche)_100%)]"
      />

      <div className="relative">
        <span className="inline-block bg-[#D8201F] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white">
          Tienes audiencia
        </span>
        <h1 className="mt-[18px] font-titulo text-[54px] font-semibold leading-[0.94] tracking-[-0.035em]">
          Yo me
          <br />
          equivoqué
          <br />
          <em className="text-oro">de orden.</em>
        </h1>
        <p className="mt-[18px] max-w-[30ch] text-[19px] leading-[1.45] text-tinta-suave">
          Que no te pase a ti. 45 minutos con Henry y llegas sabiendo qué te van
          a preguntar.
        </p>
        <p className="mt-5 text-[14px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
          Henry Orellana · Fundador de ANDEX
        </p>
      </div>
    </section>
  );
}

/* ── 2 · Lo que vivió ───────────────────────────────────────── */

function PanelHistoria() {
  return (
    <section className="flex min-h-[88svh] flex-col justify-center bg-noche-panel px-6 py-14">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-oro">
        Lo que viví
      </p>
      <p className="mt-[22px] font-titulo text-[32px] font-semibold leading-[1.22] tracking-[-0.02em]">
        Llegué sin saber a quién acudir ni en quién confiar.
      </p>
      <p className="mt-[22px] text-[19px] leading-[1.5] text-tinta-suave">
        Hice trámites que no me tocaban todavía. Dejé para después los que
        corrían prisa. Nadie me dijo en qué orden iban.
      </p>
      <p className="mt-[22px] border-l-[3px] border-oro pl-4 text-[19px] leading-[1.5]">
        Hoy construyo lo que me faltó.
      </p>
    </section>
  );
}

/* ── 3 · El mapa, antes del detalle ─────────────────────────── */

/**
 * Sin este panel, los tres de abajo son tres precios sin contexto.
 *
 * La distinción entre una cita preliminar y la de mérito es justo lo que
 * esta gente no tiene clara, y es lo que hace que «$250» se entienda en vez
 * de asustar: no es una preparación más cara, es otra cosa.
 */
function PanelDosTipos() {
  return (
    <section className="flex min-h-[88svh] flex-col justify-center border-t border-white/10 px-6 py-14">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-tinta-tenue">
        Antes de nada
      </p>
      <h2 className="mt-4 text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em]">
        Tu caso tiene
        <br />
        dos tipos de cita.
      </h2>

      <div className="mt-[26px] flex flex-col gap-[18px]">
        <div className="border-l-[3px] border-agua pl-4">
          <p className="text-[15px] font-extrabold uppercase tracking-[0.1em] text-agua">
            Las preliminares
          </p>
          <p className="mt-2 text-[17px] leading-[1.5] text-tinta-suave">
            Cortas, con mucha gente citada el mismo día. Ahí{" "}
            <strong className="font-bold text-tinta">no se juzga tu caso</strong>: se
            ordena. El juez fija plazos y la fecha del juicio.
          </p>
        </div>
        <div className="border-l-[3px] border-coral pl-4">
          <p className="text-[15px] font-extrabold uppercase tracking-[0.1em] text-coral">
            La de mérito
          </p>
          <p className="mt-2 text-[17px] leading-[1.5] text-tinta-suave">
            El juicio. Declaras tú, hay pruebas y{" "}
            <strong className="font-bold text-tinta">el juez decide</strong>.
          </p>
        </div>
      </div>

      <p className="mt-6 text-[15px] leading-[1.45] text-tinta-tenue">
        Cada preparación es para una de ellas. Mira cuál es la tuya.
      </p>
    </section>
  );
}

/* ── 4, 5 y 6 · Una por audiencia ───────────────────────────── */

function PanelAudiencia({ servicio, numero }: { servicio: Servicio; numero: number }) {
  const relato = RELATOS[servicio.id];
  const t = TONOS[relato.tono];
  const esMerito = relato.tono === "coral";

  return (
    <section
      className={
        esMerito
          ? "flex min-h-[92svh] flex-col justify-center bg-merito px-6 py-14"
          : "flex min-h-[92svh] flex-col justify-center border-t border-white/10 px-6 py-14"
      }
    >
      <div className="flex items-baseline gap-3.5">
        <span
          className={`font-titulo text-[90px] font-semibold leading-[0.8] ${t.numero}`}
          aria-hidden="true"
        >
          {numero}
        </span>
        <div>
          <p
            className={`text-[12px] font-extrabold uppercase tracking-[0.16em] ${t.texto}`}
          >
            {esMerito ? `${servicio.etapa} · decide tu caso` : servicio.etapa}
          </p>
          <h2 className="mt-1.5 text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em]">
            {servicio.nombre}
          </h2>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3.5">
        {relato.dice.map((frase) => (
          <p key={frase} className="text-[17px] leading-[1.5] text-tinta-suave">
            {frase}
          </p>
        ))}
        <p
          className={`border-l-[3px] px-4 py-3.5 text-[17px] leading-[1.5] text-tinta-suave ${t.recuadro}`}
        >
          {relato.clave}
        </p>
        <p className="text-[16px] leading-[1.45] text-tinta-tenue">{relato.cierre}</p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span
          className={`text-[44px] font-extrabold tabular-nums tracking-[-0.04em] ${t.texto}`}
        >
          ${servicio.precioUsd}
        </span>
        <Link
          href={`/reservar?servicio=${servicio.id}`}
          className={`flex min-h-[54px] flex-1 items-center justify-center rounded-full text-[17px] font-extrabold transition-transform active:scale-[0.99] ${t.boton}`}
        >
          Apartar mi hora
        </Link>
      </div>
    </section>
  );
}

/* ── 7 · Lo que hay que saber antes de tocar ────────────────── */

function PanelCierre() {
  return (
    <section className="flex min-h-[80svh] flex-col justify-center border-t border-white/10 px-6 py-14">
      <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-tinta-tenue">
        Antes de que apartes
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <p className="text-[18px] leading-[1.45] text-tinta-suave">
          La hora queda apartada al momento. El pago va después, por Zelle.
        </p>
        <p className="text-[18px] leading-[1.45] text-tinta-suave">
          Son horas de Utah. La pantalla te dice qué hora es donde tú estás.
        </p>

        {/* Los dos avisos van juntos y en grande. El de arriba es lo que
            permite publicar el de abajo sin engañar a nadie. */}
        <p className="border-l-[3px] border-tinta-tenue bg-white/[0.06] px-4 py-3.5 text-[17px] leading-[1.45] text-tinta-suave">
          Lo que cuenta esta página es{" "}
          <strong className="font-bold text-tinta">cómo funciona la corte en general</strong>,
          no lo que va a pasar en tu caso. Cada expediente es distinto y los
          plazos cambian.
        </p>
        <p className="border-l-[3px] border-[#D8201F] bg-[#D8201F]/15 px-4 py-3.5 text-[18px] leading-[1.45]">
          Henry <strong className="font-bold">no es abogado</strong> y esto no es
          asesoría legal. Te prepara. Cuando tu caso necesite un abogado, te lo
          va a decir.
        </p>
      </div>

      <p className="mt-[26px] text-[13px] text-tinta-tenue">
        © {new Date().getFullYear()} Orellana Group · Utah
      </p>
    </section>
  );
}
