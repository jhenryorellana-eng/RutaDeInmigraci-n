import { clienteServidor, hayBase } from "@/lib/supabase/servidor";
import { dentroDelHorario, diasEnRango, type Dia } from "@/lib/horario";
import { servicioPorId } from "@/lib/servicios";
import { leerTramos } from "@/lib/tramos";

/**
 * LO QUE LA PANTALLA NECESITA SABER DE LA BASE.
 *
 * Dos cosas y nada más: qué horas quedan libres, y apartar una.
 */

export type DiaConHuecos = {
  clave: string;
  /** Instantes en ISO: cruzan la frontera servidor→cliente; un `Date` no. */
  huecos: { iso: string; libre: boolean }[];
};

/**
 * Sesenta días por delante, todos, con sus huecos y cuáles siguen libres.
 *
 * Sesenta y no seis: antes se pedían «los seis próximos días con horas», y
 * quien tenía una fecha en la cabeza —«el 10»— no podía llegar a ella. Ahora
 * la ventana son días de calendario, y es la misma que impone
 * `horas_ocupadas()` en la base. Pedir más sería pintar días sin saber si
 * están ocupados.
 *
 * Salen también los cerrados, con la lista vacía: el calendario de mes los
 * necesita para pintarlos apagados en su casilla.
 *
 * Las horas ocupadas se piden con `horas_ocupadas()`, que devuelve instantes
 * y NADA más — ni nombres, ni correos. Aunque alguien llamara a esa función
 * a mano desde la consola, lo único que obtendría es lo que ya ve pintado.
 */
export const DIAS_POR_DELANTE = 60;

export async function diasDisponibles(
  ahora: Date = new Date(),
  cuantosDias = DIAS_POR_DELANTE,
): Promise<DiaConHuecos[]> {
  /* Los tramos salen de la base, no de una constante: si Henry parte el
     martes en «de 8 a 1 y de 3 a 5», la pantalla deja de ofrecer las 13 y
     las 14 sin que nadie toque el código. */
  const tramos = await leerTramos();
  const dias: Dia[] = diasEnRango(ahora, cuantosDias, tramos);
  if (dias.length === 0) return [];

  const ocupadas = new Set<number>();

  if (hayBase) {
    /* Hasta el último hueco que se ofrece. El último día de la ventana
       puede estar cerrado, así que se busca hacia atrás el que tenga alguno. */
    const conHuecos = [...dias].reverse().find((d) => d.huecos.length > 0);
    const finales = conHuecos?.huecos[conHuecos.huecos.length - 1];
    const supabase = await clienteServidor();
    const { data } = finales
      ? await supabase.rpc("horas_ocupadas", {
          desde: ahora.toISOString(),
          hasta: new Date(finales.getTime() + 60 * 60 * 1000).toISOString(),
        })
      : { data: [] as string[] };
    for (const fila of (data as string[] | null) ?? []) {
      ocupadas.add(new Date(fila).getTime());
    }
  }

  return dias.map((d) => ({
    clave: d.clave,
    huecos: d.huecos.map((h) => ({
      iso: h.toISOString(),
      libre: !ocupadas.has(h.getTime()),
    })),
  }));
}

export type DatosCita = {
  iso: string;
  nombre: string;
  correo: string;
  nacionalidad: string;
  enEeuu: boolean;
  /** Con código de país. Se guarda en dígitos, que es lo que quiere `wa.me`. */
  whatsapp: string;
  /**
   * La zona del navegador de quien reserva, para que el panel pueda enseñar
   * su hora además de la de Utah. Sale del navegador, NUNCA de la IP: una IP
   * puede ser la de una VPN o la de la biblioteca del pueblo de al lado.
   */
  zonaHoraria?: string;
  /** Identificador compatible con el catálogo y el esquema de reservas. */
  servicio: string;
  /**
   * En qué estado de EE. UU. está, dicho por ella misma.
   *
   * La columna existe desde `0007` y hasta ahora NO se escribía: el
   * formulario preguntaba el estado, lo usaba para pintar la hora local y lo
   * tiraba. Ahora viaja, que era el encargo de aquella migración.
   */
  estadoUsa?: string;
  /** Cómo va a pagar. Se guarda al apartar aunque el pago llegue después. */
  metodoPago?: "stripe" | "zelle";
};

/** Sólo dígitos, igual que hace el trigger en la base. */
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

/**
 * Lo que se devuelve al PEDIR una hora.
 *
 * Y pedir no es apartar. Esto NO crea una cita ni ocupa nada en la agenda:
 * crea una SOLICITUD con los datos y el importe, y esa hora se le puede
 * seguir vendiendo a cualquier otro hasta que entre el dinero.
 *
 * La decisión es deliberada y es de negocio: la agenda no se bloquea por
 * gente que quizá no pague. Lo que se acepta a cambio está escrito en
 * `0011_solicitud_antes_de_cita.sql` — dos personas pueden pagar la misma
 * hora, y a la segunda hay que devolverle el dinero. Por eso ese caso queda
 * marcado y visible en vez de ocurrir en silencio.
 *
 * De vuelta hacen falta dos cosas: el `solicitudId` para poder pagar ESA
 * solicitud, y el `codigoPago` para escribirlo en el memo del Zelle.
 */
export type Resultado =
  | { ok: true; solicitudId: number; codigoPago: string }
  | { ok: false; motivo: string };

/**
 * Pide una hora: guarda los datos y devuelve con qué pagar.
 *
 * NO aparta nada. La hora sigue a la venta hasta que el dinero entra, y la
 * cita la crea el pago —el webhook de Stripe o el conciliador de Zelle— a
 * través de `cita_desde_solicitud()`, que es la única puerta a la agenda.
 *
 * Las comprobaciones que se ven aquí NO son la defensa: la defensa está en
 * la base. Esto sólo sirve para dar un mensaje entendible antes de
 * molestarla.
 */
export async function apartarCita(datos: DatosCita): Promise<Resultado> {
  const cuando = new Date(datos.iso);
  const tramos = await leerTramos();

  if (Number.isNaN(cuando.getTime()) || !dentroDelHorario(cuando, tramos)) {
    return { ok: false, motivo: "Esa hora no está dentro del horario de atención." };
  }
  if (cuando.getTime() <= Date.now()) {
    return { ok: false, motivo: "Esa hora ya pasó. Elige otra." };
  }
  if (datos.nombre.trim().length < 2) {
    return { ok: false, motivo: "Escribe tu nombre." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
    return { ok: false, motivo: "Revisa tu correo." };
  }
  if (!/^[A-Za-z]{2}$/.test(datos.nacionalidad)) {
    return { ok: false, motivo: "Elige tu nacionalidad." };
  }

  /* El número es lo que cierra la sesión: por ahí manda el comprobante y por
     ahí le llega el enlace. Sin él, esa persona no tiene cómo llegar a
     Henry ni Henry a ella. Ocho dígitos es lo más corto que existe con
     código de país; quince, el techo del estándar E.164. */
  const numero = soloDigitos(datos.whatsapp ?? "");
  if (numero.length < 8 || numero.length > 15) {
    return {
      ok: false,
      motivo: "Escribe tu WhatsApp con el código de país, por ejemplo +1 385 456 4470.",
    };
  }

  /* El servicio se resuelve contra la lista, nunca se acepta lo que llegue:
     de ahí sale el precio que se va a cobrar, y un identificador inventado
     acabaría en una cita sin precio o con el que quisiera quien la mandó. */
  const servicio = servicioPorId(datos.servicio);
  if (!servicio) {
    return { ok: false, motivo: "Ese servicio no está disponible." };
  }

  if (!hayBase) {
    return {
      ok: false,
      motivo: "Todavía no está conectada la agenda. Vuelve en un rato.",
    };
  }

  const supabase = await clienteServidor();

  /* Pasa por una función y no por un `insert` directo porque hay que RECIBIR
     de vuelta el id y el código de cuatro dígitos, y para devolver columnas
     hace falta permiso de lectura sobre ellas — que el público no tiene
     sobre `citas`, ni debe tenerlo. */
  const { data, error } = await supabase.rpc("pedir_hora", {
    p_inicia_en: cuando.toISOString(),
    p_nombre: datos.nombre.trim(),
    p_correo: datos.correo.trim().toLowerCase(),
    p_nacionalidad: datos.nacionalidad.toUpperCase(),
    p_en_eeuu: datos.enEeuu,
    p_whatsapp: numero,
    p_zona_horaria: datos.zonaHoraria?.slice(0, 64) || null,
    p_estado_usa: datos.estadoUsa?.slice(0, 40) || null,
    p_servicio: servicio.id,
    /* Se conserva el importe acordado en la solicitud. */
    p_precio_usd: servicio.precioUsd,
    p_metodo_pago: datos.metodoPago ?? null,
  });

  if (error) {
    if (error.code === "23505" || error.code === "23514") {
      return {
        ok: false,
        motivo: "Alguien compró esa hora hace un momento. Elige otra, quedan más.",
      };
    }
    return { ok: false, motivo: "No pudimos guardar tus datos. Inténtalo otra vez." };
  }

  const creada = (data ?? {}) as { id?: number; codigoPago?: string };
  if (!creada.id || !creada.codigoPago) {
    return { ok: false, motivo: "No pudimos guardar tus datos. Inténtalo otra vez." };
  }

  return { ok: true, solicitudId: creada.id, codigoPago: creada.codigoPago };
}
