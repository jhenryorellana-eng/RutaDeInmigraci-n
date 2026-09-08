import type { CeldaDia, DiaPintado } from "@/lib/agenda";
import { Calendario } from "@/components/panel/calendario";
import {
  clave,
  diaCorto,
  franjaDeHoras,
  horaDeQuienReserva,
  horaEnZona,
  horasDelDiaSemana,
  instanteEnZona,
  lunesDe,
  partesEnZona,
  semanaDesde,
  sumaDias,
  type Tramo,
} from "@/lib/horario";
import { nombrePais } from "@/lib/paises";
import { AjustesAgenda } from "@/components/panel/ajustes-agenda";
import { clienteServidor } from "@/lib/supabase/servidor";
import { leerTramos, leerTramosConId } from "@/lib/tramos";
import { AvisoMovil } from "@/components/panel/aviso-movil";
import type { EntradaAgenda } from "@/lib/agenda";
import { servicioPorId } from "@/lib/servicios";

/**
 * EL CALENDARIO · y ya no hace falta ir a ningún otro sitio.
 *
 * Antes esto convivía con una pantalla aparte, «Mi horario», y eso hacía
 * pensar dos veces dónde estaba cada cosa. Dos de las tres que vivían allí
 * el calendario ya las hace mejor arrastrando —cerrar horas y apuntar lo
 * suyo—, así que lo que queda de aquello baja aquí, plegado, con un resumen
 * de una línea. Una pantalla menos que aprender.
 *
 * Enseña quién apartó cada hora y deja cerrar las libres tocándolas. Toda la
 * cuenta —qué celda es qué— se hace aquí, en el servidor, y al navegador
 * sólo le llega el resultado. Así el componente que dibuja no necesita saber
 * de zonas horarias ni de solapes de cierres, que es donde están los fallos
 * caros.
 *
 * ── Por qué la semana viaja por la URL ──
 *
 * `?s=1` es la semana siguiente. Es NAVEGACIÓN, no un dato de nadie: no lleva
 * nombres, ni correos, ni identificadores. La regla de este proyecto —que
 * ningún dato del usuario viaje por la URL— sigue intacta, y a cambio se
 * gana que la semana se pueda enlazar, recargar y volver atrás.
 */
export const dynamic = "force-dynamic";

/** Hasta dónde se puede navegar. Sin tope, `?s=999999` pide un año en vano. */
const SEMANAS_ATRAS = 8;
const SEMANAS_ADELANTE = 26;

type Cita = {
  id: number;
  inicia_en: string;
  nombre: string;
  nacionalidad: string;
  en_eeuu: boolean;
  whatsapp: string | null;
  zona_horaria: string | null;
  /* `pendiente` es una hora RETENIDA por alguien que aún no ha pagado.
     Ocupa el hueco igual que una cita, pero no es una cita: si se pintaran
     iguales, Henry contaría como trabajo del jueves algo que puede
     evaporarse en media hora. */
  estado: string;
  actualizado_en: string;
  servicio: string | null;
  precio_usd: number | null;
};

type Cierre = {
  id: number;
  inicia_en: string;
  termina_en: string;
  nota: string | null;
};

/* Lo suyo. Vive en su propia tabla y no toca NADA de la lógica de las
   audiencias: no sale en Personas, no entra en la conciliación, no tiene
   precio. Lo único que comparte es la disponibilidad, y sólo cuando `ocupa`. */
type Evento = {
  id: number;
  titulo: string;
  inicia_en: string;
  termina_en: string;
  ocupa: boolean;
  nota: string | null;
  actualizado_en: string;
};

const HORA_MS = 60 * 60 * 1000;

export default async function PantallaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const salto = acotar(Number.parseInt(s ?? "0", 10));

  const [tramos, tramosConId] = await Promise.all([
    leerTramos(),
    leerTramosConId(),
  ]);
  const ahora = new Date();

  const lunesActual = lunesDe(ahora);
  const lunes = sumaDias(lunesActual, salto * 7);
  // El panel muestra los siete días, aunque el público no pueda reservarlos.
  const dias = semanaDesde(lunes, [
    ...tramos,
    { diaSemana: 7, desdeHora: 0, hastaHora: 1 },
  ]);

  const desde = instanteEnZona(lunes.anio, lunes.mes, lunes.dia, 0);
  const finLunes = sumaDias(lunes, 7);
  const hasta = instanteEnZona(finLunes.anio, finLunes.mes, finLunes.dia, 0);

  const supabase = await clienteServidor();
  const [
    { data: citas, error: errorCitas },
    { data: cierres, error: errorCierres },
    { data: eventos, error: errorEventos },
    { data: cierresVivos, error: errorAusencias },
    { data: versionEditor },
  ] = await Promise.all([
    supabase
      .from("citas")
      .select("*")
      .gte("inicia_en", desde.toISOString())
      .lt("inicia_en", hasta.toISOString())
      .neq("estado", "cancelada")
      .order("inicia_en", { ascending: true }),
    supabase
      .from("cierres")
      .select("id, inicia_en, termina_en")
      .lt("inicia_en", hasta.toISOString())
      .gt("termina_en", desde.toISOString()),
    supabase
      .from("eventos")
      .select("*")
      .lt("inicia_en", hasta.toISOString())
      .gt("termina_en", desde.toISOString()),
    /* Los cierres largos pueden caer en semanas que no se están viendo, así
       que su lista no puede depender de la semana pintada. */
    supabase
      .from("cierres")
      .select("id, inicia_en, termina_en, nota")
      .gte("termina_en", new Date().toISOString())
      .order("inicia_en", { ascending: true })
      .limit(60),
    supabase.rpc("version_editor_agenda"),
  ]);

  // Una consulta fallida nunca debe presentarse como una agenda vacía.
  if (errorCitas || errorEventos || errorCierres || errorAusencias) {
    return (
      <main className="py-10">
        <h1 className="font-titulo text-2xl">No se pudo cargar tu agenda</h1>
        <p role="alert" className="mt-3 text-tinta-suave">
          Tus registros siguen guardados. Recarga la página para volver a
          consultar la agenda.
        </p>
        <a
          href="/panel"
          className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-acento px-5 font-bold text-fondo"
        >
          Volver a cargar
        </a>
      </main>
    );
  }

  const porHora = new Map<number, Cita>();
  for (const c of (citas ?? []) as Cita[]) {
    porHora.set(new Date(c.inicia_en).getTime(), c);
  }

  const rangos = ((cierres ?? []) as Cierre[]).map((c) => ({
    desde: new Date(c.inicia_en).getTime(),
    hasta: new Date(c.termina_en).getTime(),
    /* Un cierre de una hora o menos lo puso el propio calendario, y por eso
       se puede reabrir tocándolo. Los largos se quitan desde Mi horario,
       donde se ve entero lo que se está reabriendo. */
    suelto:
      new Date(c.termina_en).getTime() - new Date(c.inicia_en).getTime() <=
      HORA_MS,
  }));

  /* Un evento puede durar varias horas, así que se despliega hora a hora
     para poder preguntar por celda. `primera` marca dónde va el título: en
     una tira de tres horas sólo se escribe arriba. */
  const porHoraEvento = new Map<
    number,
    { id: number; titulo: string; ocupa: boolean; primera: boolean }
  >();
  for (const e of (eventos ?? []) as Evento[]) {
    const ini = new Date(e.inicia_en).getTime();
    const fin = new Date(e.termina_en).getTime();
    for (let t = ini; t < fin; t += HORA_MS) {
      porHoraEvento.set(t, {
        id: e.id,
        titulo: e.titulo,
        ocupa: e.ocupa,
        primera: t === ini,
      });
    }
  }

  const entradas: EntradaAgenda[] = [
    ...((citas ?? []) as Cita[]).map(
      (c): EntradaAgenda => ({
        id: c.id,
        tipo: "cita",
        titulo: c.nombre,
        inicio: c.inicia_en,
        fin: new Date(Date.parse(c.inicia_en) + HORA_MS).toISOString(),
        version: c.actualizado_en,
        ocupa: true,
        nota: "",
        whatsapp: c.whatsapp ?? "",
        estado: c.estado,
        servicio: servicioPorId(c.servicio)?.nombre ?? c.servicio,
        precio: c.precio_usd,
        detalle: [
          nombrePais(c.nacionalidad),
          c.en_eeuu ? "En EE. UU." : "Fuera de EE. UU.",
          horaDeQuienReserva(new Date(c.inicia_en), c.zona_horaria)
            ? `Su hora: ${horaDeQuienReserva(new Date(c.inicia_en), c.zona_horaria)}`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      }),
    ),
    ...((eventos ?? []) as Evento[]).map(
      (e): EntradaAgenda => ({
        id: e.id,
        tipo: "evento",
        titulo: e.titulo,
        inicio: e.inicia_en,
        fin: e.termina_en,
        version: e.actualizado_en,
        ocupa: e.ocupa,
        nota: e.nota ?? "",
        whatsapp: "",
      }),
    ),
  ].sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
  const horasPresentes = new Set(franjaDeHoras(tramos));
  for (const e of entradas) {
    for (
      let ms = Math.max(Date.parse(e.inicio), desde.getTime());
      ms < Math.min(Date.parse(e.fin), hasta.getTime());
      ms += HORA_MS
    ) {
      horasPresentes.add(partesEnZona(new Date(ms)).hora);
    }
  }
  const horas = [...horasPresentes].sort((a, b) => a - b);
  const claveDeHoy = claveHoy(ahora);

  const pintados: DiaPintado[] = dias.map((d) => {
    const ofrece = new Set(horasDelDiaSemana(d.diaSemana, tramos));
    const primero = d.huecos[0];

    const celdas: CeldaDia[] = horas.map((h) => {
      const t = instanteEnZona(d.anio, d.mes, d.dia, h);
      const ms = t.getTime();
      const iso = t.toISOString();

      /* El orden importa: una cita PAGADA manda sobre lo que él apuntó. Si
         hay las dos, lo que tiene que ver es a quién atiende. */
      const cita = porHora.get(ms);
      if (cita) {
        return {
          estado: "cita",
          iso,
          nombre: cita.nombre,
          pendiente: cita.estado === "pendiente",
          pais: nombrePais(cita.nacionalidad),
          enEeuu: cita.en_eeuu,
          hora: horaEnZona(t),
          /* La hora que ve ESA persona. `null` cuando coincide con la de
             Utah: repetir la misma hora dos veces hace dudar de si el sitio
             se equivocó. */
          horaSuya: horaDeQuienReserva(t, cita.zona_horaria),
          whatsapp: cita.whatsapp,
        };
      }

      const suyo = porHoraEvento.get(ms);
      if (suyo?.ocupa) {
        return {
          estado: "evento",
          iso,
          eventoId: suyo.id,
          titulo: suyo.titulo,
          ocupa: suyo.ocupa,
          primera: suyo.primera,
        };
      }

      if (!ofrece.has(h)) return { estado: "fuera" };
      const cerrada = rangos.find((r) => ms >= r.desde && ms < r.hasta);
      if (cerrada) return { estado: "cerrada", iso, suelta: cerrada.suelto };

      if (ms < ahora.getTime()) return { estado: "pasada", iso };

      return { estado: "libre", iso };
    });

    return {
      clave: d.clave,
      abreviatura: primero ? diaCorto(primero) : etiquetaSinHuecos(d.diaSemana),
      numero: d.dia,
      esHoy: d.clave === claveDeHoy,
      celdas,
    };
  });

  /* Una hora que NINGÚN día ofrece, pero que cae dentro de la franja, es el
     descanso: el agujero que Henry dejó en medio del día. Se pinta como una
     banda que cruza la semana en vez de como seis celdas apagadas, porque no
     es que ese día esté cerrado — es que a esa hora no está ninguno. */
  const descanso = horas.filter((h, i) =>
    pintados.every((d) => d.celdas[i]?.estado === "fuera"),
  );

  /* Las retenidas sin pagar NO cuentan como apartadas: el número de arriba
     es lo que Henry tiene que atender, y una retención todavía no lo es. */
  const apartadas = pintados.reduce(
    (n, d) =>
      n + d.celdas.filter((c) => c.estado === "cita" && !c.pendiente).length,
    0,
  );
  const libres = pintados.reduce(
    (n, d) => n + d.celdas.filter((c) => c.estado === "libre").length,
    0,
  );

  return (
    <>
      <Calendario
        /* Cambiar de semana remonta el componente: así lo marcado y el día que
         se ve en el teléfono se reinician sin un efecto que también saltara
         cada vez que se recargan los datos. */
        key={salto}
        dias={pintados}
        entradas={entradas}
        edicionDisponible={versionEditor === 1}
        horas={horas}
        horasDeDescanso={descanso}
        titulo={tituloDeSemana(dias[0], dias[dias.length - 1])}
        apartadas={apartadas}
        libres={libres}
        salto={salto}
        esSemanaActual={salto === 0}
        puedeRetroceder={salto > -SEMANAS_ATRAS}
        puedeAvanzar={salto < SEMANAS_ADELANTE}
        tramosVacios={tramos.length === 0}
      />
      <div className="mt-6">
        <AvisoMovil
          clavePublica={process.env.NEXT_PUBLIC_VAPID_PUBLICA ?? ""}
          recordatoriosDisponibles={versionEditor === 1}
        />
      </div>
      <AjustesAgenda
        tramos={tramosConId}
        cierres={(cierresVivos ?? []) as Cierre[]}
      />
    </>
  );
}

function acotar(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(SEMANAS_ADELANTE, Math.max(-SEMANAS_ATRAS, Math.trunc(n)));
}

function claveHoy(ahora: Date): string {
  const p = partesEnZona(ahora);
  return clave(p.anio, p.mes, p.dia);
}

const ABREVIATURAS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

/** Un día sin huecos no tiene ningún instante del que sacar su nombre. */
function etiquetaSinHuecos(diaSemana: number): string {
  return ABREVIATURAS[diaSemana - 1] ?? "";
}

function tituloDeSemana(
  primero: { anio: number; mes: number; dia: number },
  ultimo: { anio: number; mes: number; dia: number },
): string {
  const a = instanteEnZona(primero.anio, primero.mes, primero.dia, 12);
  const b = instanteEnZona(ultimo.anio, ultimo.mes, ultimo.dia, 12);
  const mesA = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Denver",
    month: "long",
  }).format(a);
  const mesB = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Denver",
    month: "long",
  }).format(b);

  return mesA === mesB
    ? `Del ${primero.dia} al ${ultimo.dia} de ${mesB}`
    : `Del ${primero.dia} de ${mesA} al ${ultimo.dia} de ${mesB}`;
}
