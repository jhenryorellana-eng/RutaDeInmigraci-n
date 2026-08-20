import { CerrarHoras } from "@/components/cerrar-horas";
import { EditorHorario } from "@/components/panel/editor-horario";
import { clienteServidor } from "@/lib/supabase/servidor";
import { leerTramosConId } from "@/lib/tramos";

/**
 * MI HORARIO.
 *
 * Dos niveles que no se mezclan, y por eso están en columnas separadas:
 *
 *   · a la izquierda, lo que vale TODAS las semanas — los tramos de cada día;
 *   · a la derecha, los días sueltos que se caen — un viaje, el dentista.
 *
 * Juntarlos en una sola lista sería la forma más rápida de que alguien cierre
 * todos los viernes del año queriendo cerrar uno.
 */
export const dynamic = "force-dynamic";

type Cierre = { id: number; inicia_en: string; termina_en: string; nota: string | null };

export default async function PantallaHorario() {
  const supabase = await clienteServidor();

  const [tramos, { data: cierres }] = await Promise.all([
    leerTramosConId(),
    supabase
      .from("cierres")
      .select("id, inicia_en, termina_en, nota")
      .gte("termina_en", new Date().toISOString())
      .order("inicia_en", { ascending: true })
      .limit(60),
  ]);

  return (
    <main className="grid gap-10 pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-9">
      <EditorHorario tramos={tramos} />

      <div>
        {/* La regla escrita donde se toma la decisión, no en el README. */}
        <div className="rounded-[20px] border border-aviso/30 bg-aviso/[0.09] px-5 py-4">
          <p className="text-[16px] font-extrabold text-aviso">
            Las citas ya apartadas siguen en pie
          </p>
          <p className="mt-2 text-[16px] leading-[1.45] text-tinta-suave">
            Cerrar horas sólo quita lo que todavía está libre. Si alguien ya
            apartó las 4 de un jueves, esa hora se queda suya aunque cierres la
            tarde entera.
          </p>
        </div>

        <div className="mt-7">
          <CerrarHoras cierres={(cierres ?? []) as Cierre[]} />
        </div>
      </div>
    </main>
  );
}
