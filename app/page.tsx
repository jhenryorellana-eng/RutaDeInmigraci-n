import Image from "next/image";
import Link from "next/link";

/**
 * HOJA 1 — LA PREGUNTA Y SU RESPUESTA.
 *
 * Aquí nadie viene a leer. La pantalla entera es una pregunta, la respuesta
 * de Henry en primera persona y un botón. Diecinueve palabras.
 *
 * ── Las dos maquetaciones ──
 *
 * En el teléfono la foto va arriba a sangre y él habla debajo. En escritorio
 * la misma idea girada 90°: el retrato ocupa la mitad derecha y el texto la
 * izquierda. No es la versión estrecha estirada — es la misma composición
 * puesta de lado, que es como estaba diseñada.
 *
 * Es UNA sola imagen en los dos casos, recolocada con `object-position`. Dos
 * archivos distintos —uno vertical y otro apaisado— se descargarían los dos,
 * porque `hidden` esconde pero no impide la descarga, y este público abre
 * esto con datos contados.
 *
 * ── Por qué el panel es `--color-panel` ──
 *
 * Ese tono es el color medio del borde inferior del retrato —su camisa—
 * medido sobre el archivo. Por eso la fotografía y el panel se unen sin
 * canto, sin línea y sin un degradado que delate el corte: la foto termina
 * justo donde él empieza a hablar. En escritorio la costura es vertical y la
 * hace el velo horizontal sobre el borde izquierdo de la foto.
 *
 * ── Lo que NO se promete ──
 *
 * No se dice «los ocho trámites». No todo el mundo hace ocho, y prometerlo
 * sería falso. Lo que se promete es lo contrario, y vale más: decir CUÁLES
 * NO NECESITAS. Nadie más le dice eso a este público.
 */

export default function Portada() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-panel lg:max-w-none lg:bg-fondo">
      {/* El retrato: a sangre por arriba en el teléfono, mitad derecha en
          escritorio. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 select-none lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[46%]">
        <Image
          src="/henry.jpg"
          alt="Henry Orellana, fundador de ANDEX"
          width={700}
          height={853}
          priority
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="w-full lg:h-full lg:object-cover lg:object-[50%_18%]"
        />

        {/* El velo que funde la foto con el panel por su borde izquierdo.
            Sólo en escritorio: en el teléfono esa costura la hace el
            degradado vertical del bloque de texto. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-r from-fondo from-0% via-fondo/70 via-[16%] to-transparent to-[46%] lg:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-b from-fondo/40 from-0% via-transparent via-[22%] to-fondo to-100% lg:block"
        />
      </div>

      <header className="relative flex items-baseline justify-between px-6 pt-7 lg:absolute lg:inset-x-0 lg:z-10 lg:px-14 lg:pt-8">
        <span className="text-[17px] font-extrabold tracking-tight text-white [text-shadow:0_1px_12px_rgba(16,26,40,.55)] lg:text-[20px]">
          ANDEX
        </span>
        <span className="text-[12px] font-bold tracking-[0.14em] text-white/90 [text-shadow:0_1px_12px_rgba(16,26,40,.55)] lg:text-[13px]">
          UTAH
        </span>
      </header>

      {/* El panel donde habla. `mt-auto` lo pega abajo sin fijar una altura:
          en pantallas cortas sube y la foto se recorta por arriba, que es lo
          que se puede perder sin que se pierda el mensaje. En escritorio
          deja de pegarse abajo y se centra en la mitad izquierda. */}
      <div className="relative mt-auto bg-gradient-to-b from-transparent via-panel to-fondo px-6 pb-7 pt-12 [--tw-gradient-via-position:46px] lg:mt-0 lg:flex lg:max-w-[45rem] lg:flex-1 lg:flex-col lg:justify-center lg:bg-none lg:px-14 lg:pb-0 lg:pt-0">
        <p className="font-titulo text-[27px] leading-[1.18] text-pregunta lg:text-[34px] lg:leading-[1.2]">
          ¿Sabes cuál es tu siguiente trámite?
        </p>

        <p className="mt-3.5 font-titulo text-[46px] font-semibold leading-none tracking-[-0.022em] text-tinta lg:mt-[18px] lg:text-[96px] lg:leading-[0.94] lg:tracking-[-0.03em]">
          Yo sí.
        </p>

        <p className="mt-4 text-[17px] leading-[1.5] text-tinta-suave lg:mt-6 lg:max-w-[46ch] lg:text-[21px]">
          Yo pasé por esto y me equivoqué de orden. Contigo vemos cuál te toca
          ahora, cuál viene después y cuáles no necesitas: esa es{" "}
          <strong className="font-bold text-tinta">tu ruta del inmigrante</strong>.
        </p>

        <p className="mt-3.5 text-[15px] font-bold text-tinta-tenue lg:mt-[18px] lg:text-[16px]">
          Henry Orellana · Fundador de ANDEX
        </p>

        <div className="mt-5 flex items-center gap-4 border-t border-white/15 pt-4 lg:mt-8 lg:gap-[26px] lg:pt-6">
          <Dato cifra="45 min" pie="uno a uno" />
          <span aria-hidden="true" className="h-8 w-px bg-white/15 lg:h-10" />
          <Dato cifra="$150" pie="pago único" />
          <span aria-hidden="true" className="h-8 w-px bg-white/15 lg:h-10" />
          <Dato cifra="1 plan" pie="estructurado" />
        </div>

        <Link
          href="/reservar"
          className="mt-5 flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-full bg-tinta text-[18px] font-extrabold tracking-[-0.02em] text-fondo transition-transform active:scale-[0.99] lg:mt-[30px] lg:min-h-[62px] lg:w-auto lg:self-start lg:px-9"
        >
          Armar mi ruta con Henry
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </main>
  );
}

function Dato({ cifra, pie }: { cifra: string; pie: string }) {
  return (
    <div>
      <p className="text-[21px] font-extrabold tracking-[-0.022em] text-tinta lg:text-[28px] lg:tracking-[-0.026em]">
        {cifra}
      </p>
      <p className="mt-0.5 text-[13px] text-tinta-tenue lg:text-[14px]">{pie}</p>
    </div>
  );
}
