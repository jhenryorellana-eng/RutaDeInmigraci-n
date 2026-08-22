import { TablaPersonas, type Persona } from "@/components/panel/tabla-personas";
import { diaCorto, horaDeQuienReserva, horaEnZona, partesEnZona, ZONA } from "@/lib/horario";
import { nombrePais } from "@/lib/paises";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * PERSONAS.
 *
 * El archivo: todo lo que el sitio guarda de quien aparta una hora. Se busca,
 * se filtra y se descarga. Ni un botón de acción — es una lista para
 * consultar, no un centro de operaciones.
 *
 * Lo que NO tiene, y no es un olvido: ninguna columna de estatus migratorio.
 * Ni escondida ni en la descarga. No se pregunta en el formulario, así que no
 * existe. «Ya está aquí» es UBICACIÓN, y sirve para una sola cosa: saber con
 * qué huso horario se va a conectar.
 *
 * Las fechas se formatean AQUÍ, en el servidor, y no en el navegador: el
 * panel enseña siempre la hora de Utah, que es la que Henry tiene en la
 * cabeza. En la pantalla pública pasa lo contrario y también es a propósito
 * —allí manda la hora de quien mira—, pero eso es otra pantalla.
 */
export const dynamic = "force-dynamic";

/** Un tope alto pero real: sin él, un año de citas se trae entero cada vez. */
const MAXIMO = 500;

type Fila = {
  id: number;
  inicia_en: string;
  nombre: string;
  correo: string;
  nacionalidad: string;
  en_eeuu: boolean;
  estado: string;
  creado_en: string;
  whatsapp: string | null;
  zona_horaria: string | null;
};

export default async function PantallaPersonas() {
  const supabase = await clienteServidor();

  const { data, count } = await supabase
    .from("citas")
    .select(
      "id, inicia_en, nombre, correo, nacionalidad, en_eeuu, estado, creado_en, whatsapp, zona_horaria",
      {
        count: "exact",
      },
    )
    .order("inicia_en", { ascending: false })
    .limit(MAXIMO);

  const ahora = Date.now();

  const personas: Persona[] = ((data ?? []) as Fila[]).map((f) => {
    const cuando = new Date(f.inicia_en);
    return {
      id: f.id,
      nombre: f.nombre,
      correo: f.correo,
      pais: nombrePais(f.nacionalidad),
      enEeuu: f.en_eeuu,
      cuando: `${diaCorto(cuando)} ${partesEnZona(cuando).dia} · ${horaEnZona(cuando)}`,
      /* La hora que ve ESA persona en su teléfono. Sale `null` cuando está a
         la misma hora que Utah: repetir «14:00 · 14:00» hace dudar de si el
         sitio se equivocó. */
      horaSuya: horaDeQuienReserva(cuando, f.zona_horaria),
      whatsapp: f.whatsapp,
      apartoEl: diaYMes(new Date(f.creado_en)),
      cancelada: f.estado === "cancelada",
      pasada: cuando.getTime() < ahora,
    };
  });

  return <TablaPersonas personas={personas} total={count ?? personas.length} tope={MAXIMO} />;
}

/** «17 ago», en hora de Utah. */
function diaYMes(instante: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
  })
    .format(instante)
    .replace(".", "");
}
