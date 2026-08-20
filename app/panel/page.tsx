import { redirect } from "next/navigation";

import { CerrarHoras } from "@/components/cerrar-horas";
import { fechaLarga, horaEnZona } from "@/lib/horario";
import { nombrePais } from "@/lib/paises";
import { clienteServidor, hayBase } from "@/lib/supabase/servidor";

/**
 * EL PANEL DE HENRY.
 *
 * Dos cosas, y ninguna más: a quién ve, y qué horas cierra. Métricas,
 * gráficas y embudos serían ruido en una agenda que cabe en una pantalla.
 *
 * ── Quién puede entrar ──
 *
 * Esta página comprueba la sesión, pero NO es ahí donde está la seguridad.
 * Aunque alguien se saltara esta comprobación, la base no le devolvería ni
 * una fila: las políticas de `citas` sólo dejan leer a quien está en
 * `administradores`. Esto de aquí sólo decide qué pantalla se pinta.
 */
export const dynamic = "force-dynamic";

type Cita = {
  id: number;
  inicia_en: string;
  nombre: string;
  correo: string;
  nacionalidad: string;
  en_eeuu: boolean;
  estado: string;
};

type Cierre = { id: number; inicia_en: string; termina_en: string; nota: string | null };

export default async function Panel() {
  if (!hayBase) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-16">
        <h1 className="font-titulo text-[32px] font-semibold">Falta conectar la base</h1>
        <p className="mt-4 text-tinta-suave">
          Pon <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en <code>.env.local</code> y
          vuelve a cargar. Están en el panel de Supabase, en Project settings →
          API.
        </p>
      </main>
    );
  }

  const supabase = await clienteServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect("/panel/entrar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-16">
        <h1 className="font-titulo text-[32px] font-semibold">Esta cuenta no es de Henry</h1>
        <p className="mt-4 text-tinta-suave">
          Entraste con {sesion.user.email}, que no está en la tabla de
          administradores. Si eres Henry y ves esto, falta añadir tu id de
          usuario a <code>administradores</code> — está explicado en el README.
        </p>
      </main>
    );
  }

  const ahora = new Date();
  const desde = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);

  const [{ data: citas }, { data: cierres }] = await Promise.all([
    supabase
      .from("citas")
      .select("id, inicia_en, nombre, correo, nacionalidad, en_eeuu, estado")
      .gte("inicia_en", desde.toISOString())
      .neq("estado", "cancelada")
      .order("inicia_en", { ascending: true })
      .limit(60),
    supabase
      .from("cierres")
      .select("id, inicia_en, termina_en, nota")
      .gte("termina_en", ahora.toISOString())
      .order("inicia_en", { ascending: true })
      .limit(30),
  ]);

  const lista = (citas ?? []) as Cita[];
  const porDia = new Map<string, Cita[]>();
  for (const c of lista) {
    const clave = fechaLarga(new Date(c.inicia_en));
    porDia.set(clave, [...(porDia.get(clave) ?? []), c]);
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-6 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/15 pb-5">
        <div className="flex items-baseline gap-3">
          <span className="text-[20px] font-extrabold tracking-tight">ANDEX</span>
          <span className="text-[13px] font-bold tracking-[0.12em] text-tinta-tenue">AGENDA</span>
        </div>
        <form action="/panel/salir" method="post">
          <span className="mr-3 text-[15px] text-tinta-tenue">{sesion.user.email}</span>
          <button className="min-h-11 rounded-xl border border-white/25 px-4 text-[15px]">
            Salir
          </button>
        </form>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* ── A quién ve ── */}
        <section>
          <h1 className="font-titulo text-[32px] font-semibold leading-[1.1]">
            {lista.length === 0
              ? "No hay citas apartadas"
              : `${lista.length} ${lista.length === 1 ? "cita apartada" : "citas apartadas"}`}
          </h1>

          {lista.length === 0 ? (
            <p className="mt-4 text-tinta-suave">
              Cuando alguien aparte una hora, aparece aquí con su nombre, de
              dónde es y si ya está en Estados Unidos.
            </p>
          ) : null}

          {[...porDia.entries()].map(([dia, delDia]) => (
            <div key={dia} className="mt-8">
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
                {dia}
              </p>
              <div className="mt-3 flex flex-col gap-2.5">
                {delDia.map((c) => (
                  <article
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[20px] border border-white/12 bg-panel/60 px-5 py-4"
                  >
                    <span className="w-[76px] shrink-0 text-[22px] font-bold tabular-nums">
                      {horaEnZona(new Date(c.inicia_en))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-bold">{c.nombre}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[14px] text-tinta-suave">
                          {nombrePais(c.nacionalidad)}
                        </span>
                        <span
                          className={
                            c.en_eeuu
                              ? "rounded-full bg-acento/20 px-2.5 py-0.5 text-[14px] font-bold text-acento"
                              : "rounded-full bg-aviso/15 px-2.5 py-0.5 text-[14px] font-bold text-aviso"
                          }
                        >
                          {c.en_eeuu ? "En EE. UU." : "Todavía no está en EE. UU."}
                        </span>
                        <a
                          href={`mailto:${c.correo}`}
                          className="text-[14px] text-tinta-tenue underline underline-offset-4"
                        >
                          {c.correo}
                        </a>
                      </span>
                    </span>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Qué horas cierra ── */}
        <CerrarHoras cierres={(cierres ?? []) as Cierre[]} />
      </div>
    </main>
  );
}
