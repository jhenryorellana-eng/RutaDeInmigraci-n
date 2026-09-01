import { clienteServidor, hayBase } from "@/lib/supabase/servidor";
import { dentroDelHorario, proximosDias, type Dia } from "@/lib/horario";
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
 * Los próximos días con sus huecos, marcando cuáles siguen libres.
 *
 * Las horas ocupadas se piden con `horas_ocupadas()`, que devuelve instantes
 * y NADA más — ni nombres, ni correos. Aunque alguien llamara a esa función
 * a mano desde la consola, lo único que obtendría es lo que ya ve pintado.
 */
export async function diasDisponibles(
  ahora: Date = new Date(),
  cuantos = 6,
): Promise<DiaConHuecos[]> {
  /* Los tramos salen de la base, no de una constante: si Henry parte el
     martes en «de 8 a 1 y de 3 a 5», la pantalla deja de ofrecer las 13 y
     las 14 sin que nadie toque el código. */
  const tramos = await leerTramos();
  const dias: Dia[] = proximosDias(ahora, cuantos, tramos);
  if (dias.length === 0) return [];

  const ocupadas = new Set<number>();

  if (hayBase) {
    /* Antes de mirar qué está ocupado, se sueltan las retenciones que
       caducaron. Va aquí y no en un cron porque así el barrido ocurre por el
       mero hecho de que alguien mire la agenda: la hora de quien abandonó a
       mitad del pago vuelve a ofrecerse sola. */
    const limpieza = await clienteServidor();
    await limpieza.rpc("liberar_pendientes_vencidas");

    const ultimo = dias[dias.length - 1];
    const finales = ultimo.huecos[ultimo.huecos.length - 1];
    const supabase = await clienteServidor();
    const { data } = await supabase.rpc("horas_ocupadas", {
      desde: ahora.toISOString(),
      hasta: new Date(finales.getTime() + 60 * 60 * 1000).toISOString(),
    });
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
  /** Cuál de las tres preparaciones. Sin esto, Henry no sabe para qué prepara. */
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
 * Lo que se devuelve al apartar.
 *
 * La cita nace PENDIENTE: la hora queda retenida a nombre de esa persona,
 * pero para Henry todavía no es una cita. Sube a «reservada» cuando el pago
 * se confirma —el webhook de Stripe, o el conciliador leyendo el correo del
 * banco— y caduca sola a la media hora si eso no ocurre.
 *
 * Por eso hacen falta los dos datos de vuelta: el `citaId` para poder pagar
 * esa cita concreta, y el `codigoPago` para escribirlo en el memo del Zelle.
 */
export type Resultado =
  | { ok: true; citaId: number; codigoPago: string; expiraEn: string }
  | { ok: false; motivo: string };

/**
 * Aparta una hora.
 *
 * Las comprobaciones que se ven aquí NO son la defensa: la defensa está en
 * la base —el índice único parcial y el trigger— porque entre comprobar y
 * escribir cabe la reserva de otra persona. Esto sólo sirve para dar un
 * mensaje entendible antes de molestar a la base.
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
    return { ok: false, motivo: "Elige para qué audiencia es la preparación." };
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
  const { data, error } = await supabase.rpc("apartar_cita", {
    p_inicia_en: cuando.toISOString(),
    p_nombre: datos.nombre.trim(),
    p_correo: datos.correo.trim().toLowerCase(),
    p_nacionalidad: datos.nacionalidad.toUpperCase(),
    p_en_eeuu: datos.enEeuu,
    p_whatsapp: numero,
    p_zona_horaria: datos.zonaHoraria?.slice(0, 64) || null,
    p_estado_usa: datos.estadoUsa?.slice(0, 40) || null,
    p_servicio: servicio.id,
    /* El precio se guarda CON la cita. Si mañana la tercera audiencia sube a
       $180, las citas ya apartadas tienen que seguir diciendo $150: es lo
       que esa persona vio y lo que va a pagar. */
    p_precio_usd: servicio.precioUsd,
    p_metodo_pago: datos.metodoPago ?? null,
  });

  if (error) {
    /* 23505 es la violación del índice único: alguien ganó la carrera por
       esta hora. Se dice tal cual — «no está disponible» a secas deja a la
       persona sin saber si el fallo fue suyo. */
    if (error.code === "23505") {
      return {
        ok: false,
        motivo: "Alguien apartó esa hora hace un momento. Elige otra, quedan más.",
      };
    }
    if (error.code === "23514") {
      return { ok: false, motivo: "Esa hora ya no está disponible." };
    }
    return { ok: false, motivo: "No pudimos apartar la hora. Inténtalo otra vez." };
  }

  const creada = (data ?? {}) as { id?: number; codigoPago?: string; expiraEn?: string };
  if (!creada.id || !creada.codigoPago) {
    return { ok: false, motivo: "No pudimos apartar la hora. Inténtalo otra vez." };
  }

  return {
    ok: true,
    citaId: creada.id,
    codigoPago: creada.codigoPago,
    expiraEn: creada.expiraEn ?? "",
  };
}
