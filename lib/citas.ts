import { clienteServidor, hayBase } from "@/lib/supabase/servidor";
import { dentroDelHorario, proximosDias, type Dia } from "@/lib/horario";
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
};

/** Sólo dígitos, igual que hace el trigger en la base. */
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

export type Resultado = { ok: true } | { ok: false; motivo: string };

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
      motivo: "Escribe tu WhatsApp con el código de país, por ejemplo +1 801 941 3479.",
    };
  }

  if (!hayBase) {
    return {
      ok: false,
      motivo: "Todavía no está conectada la agenda. Vuelve en un rato.",
    };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.from("citas").insert({
    inicia_en: cuando.toISOString(),
    nombre: datos.nombre.trim(),
    correo: datos.correo.trim().toLowerCase(),
    nacionalidad: datos.nacionalidad.toUpperCase(),
    en_eeuu: datos.enEeuu,
    whatsapp: numero,
    zona_horaria: datos.zonaHoraria?.slice(0, 64) || null,
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

  return { ok: true };
}
