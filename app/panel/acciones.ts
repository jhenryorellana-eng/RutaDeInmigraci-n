"use server";

import { revalidatePath } from "next/cache";

import { instanteEnZona, partesEnZona, sumaDias } from "@/lib/horario";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * LO QUE HENRY PUEDE HACER CON SU HORARIO.
 *
 * Ninguna de estas acciones comprueba si quien llama es Henry — y no es un
 * olvido. Lo comprueba la BASE: las políticas de `cierres` y de `horario`
 * sólo dejan pasar a quien está en `administradores`. Repetir la
 * comprobación aquí daría una segunda cerradura que puede quedar
 * desalineada con la primera; que falle la base es lo correcto, porque es la
 * que no se puede saltar.
 *
 * Lo que sí se comprueba aquí son los LÍMITES de lo que se manda: cuántas
 * horas caben en una tacada, y hasta cuándo. Eso no lo defiende ninguna
 * política, y sin ello un cliente manipulado podría insertar miles de filas
 * de una sentada.
 *
 * ── Dos formas de cerrar, y son distintas a propósito ──
 *
 * · `cerrarHoras()` mete UNA FILA POR HORA. Es lo que usa el calendario, y
 *   por eso una hora cerrada tocándola se reabre tocándola otra vez.
 * · `cerrar()` mete UNA SOLA FILA para todo el rato. Es lo que usa «días que
 *   se caen», donde lo que se cierra es un día o una semana entera y
 *   reabrirlo es una decisión de bloque, no hora por hora.
 */

export type Respuesta = { ok: true } | { ok: false; motivo: string };

/** Ni cerrar más allá de tres meses, ni cerrar más de dos días de golpe. */
const DIAS_MAXIMOS = 92;
const HORAS_MAXIMAS_POR_TACADA = 48;

const HORA_MS = 60 * 60 * 1000;

function refrescar() {
  revalidatePath("/panel");
  revalidatePath("/panel/horario");
  revalidatePath("/reservar");
  revalidatePath("/");
}

/** El instante en que acaba un día de Utah: la medianoche del día siguiente. */
function finDelDia(anio: number, mes: number, dia: number): Date {
  /* Calculado sobre la fecha del día siguiente y no sumando 24 horas: en los
     dos días del año que cambian la hora, un día dura 23 o 25 horas, y
     sumar 24 dejaría el cierre corrido una hora. */
  const manana = sumaDias({ anio, mes, dia }, 1);
  return instanteEnZona(manana.anio, manana.mes, manana.dia, 0);
}

// ═══════════════════════════════════════════════════════════════
// CERRAR Y ABRIR HORAS SUELTAS — lo que hace el calendario
// ═══════════════════════════════════════════════════════════════

/**
 * Cierra las horas que se hayan marcado en el calendario, una fila por hora.
 *
 * Llega una lista de instantes en ISO en vez de un rango porque el gesto que
 * la produce es «arrastra por encima de estas celdas», y esas celdas pueden
 * no ser contiguas si en medio hay una cita apartada.
 */
export async function cerrarHoras(isos: string[]): Promise<Respuesta> {
  if (isos.length === 0) return { ok: false, motivo: "No hay ninguna hora marcada." };
  if (isos.length > HORAS_MAXIMAS_POR_TACADA) {
    return { ok: false, motivo: "Son demasiadas horas de una vez. Ciérralas por días." };
  }

  const ahora = Date.now();
  const tope = ahora + DIAS_MAXIMOS * 24 * HORA_MS;
  const filas: { inicia_en: string; termina_en: string }[] = [];

  for (const iso of isos) {
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return { ok: false, motivo: "Hay una hora que no entiendo." };
    if (t.getTime() % HORA_MS !== 0) {
      return { ok: false, motivo: "Sólo se pueden cerrar horas en punto." };
    }
    if (t.getTime() < ahora - HORA_MS) {
      return { ok: false, motivo: "Esa hora ya pasó." };
    }
    if (t.getTime() > tope) {
      return { ok: false, motivo: "Todavía no se puede cerrar tan lejos." };
    }
    filas.push({
      inicia_en: t.toISOString(),
      termina_en: new Date(t.getTime() + HORA_MS).toISOString(),
    });
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").insert(filas);
  if (error) return { ok: false, motivo: "No se pudo cerrar. Vuelve a intentarlo." };

  refrescar();
  return { ok: true };
}

/**
 * Reabre una hora cerrada desde el calendario.
 *
 * Sólo borra los cierres que duran una hora o menos, o sea los que puso el
 * propio calendario. Un cierre largo —«toda la semana que viene»— NO se
 * deshace tocando una de sus horas: eso reabriría de golpe algo que se cerró
 * de golpe, y sin avisar. Los largos se quitan desde su lista en «Mi
 * horario», donde se ve entero lo que se está reabriendo.
 */
export async function reabrirHora(iso: string): Promise<Respuesta> {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return { ok: false, motivo: "No entiendo esa hora." };

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from("cierres")
    .select("id, inicia_en, termina_en")
    .eq("inicia_en", t.toISOString());

  if (error) return { ok: false, motivo: "No se pudo reabrir." };

  const cortos = ((data ?? []) as { id: number; inicia_en: string; termina_en: string }[])
    .filter(
      (c) => new Date(c.termina_en).getTime() - new Date(c.inicia_en).getTime() <= HORA_MS,
    )
    .map((c) => c.id);

  if (cortos.length === 0) {
    return {
      ok: false,
      motivo: "Esa hora es parte de un cierre más largo. Quítalo desde Mi horario.",
    };
  }

  const { error: fallo } = await supabase.from("cierres").delete().in("id", cortos);
  if (fallo) return { ok: false, motivo: "No se pudo reabrir." };

  refrescar();
  return { ok: true };
}

/**
 * Cierra lo que queda del día de hoy.
 *
 * Desde la hora en curso —no desde la siguiente— hasta la medianoche de
 * Utah. Si son las 10:20 y se pulsa, las 10:00 también se cierran: quien
 * pulsa esto se está yendo, y una sesión que empezó hace veinte minutos no
 * la va a atender.
 */
export async function cerrarRestoDeHoy(): Promise<Respuesta> {
  const ahora = new Date();
  const p = partesEnZona(ahora);
  const inicia = instanteEnZona(p.anio, p.mes, p.dia, p.hora);
  const termina = finDelDia(p.anio, p.mes, p.dia);

  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").insert({
    inicia_en: inicia.toISOString(),
    termina_en: termina.toISOString(),
    nota: "resto del día",
  });

  if (error) return { ok: false, motivo: "No se pudo cerrar. Vuelve a intentarlo." };
  refrescar();
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// DÍAS QUE SE CAEN — un bloque, una fila
// ═══════════════════════════════════════════════════════════════

/**
 * Cierra un día entero o un tramo de horas, en hora de Utah.
 *
 * `dia` llega como «2026-08-22». Se convierte a instantes con la zona de
 * Utah y no con la del servidor: Vercel corre en UTC, y cerrar «el sábado»
 * calculado en UTC dejaría abiertas las últimas horas del viernes.
 */
export async function cerrar(
  dia: string,
  desdeHora: number | null,
  hastaHora: number | null,
  nota: string,
): Promise<Respuesta> {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  if (!m) return { ok: false, motivo: "Elige un día." };

  const [, a, me, d] = m;
  const anio = Number(a);
  const mes = Number(me);
  const num = Number(d);

  const desde = desdeHora ?? 0;
  const hasta = hastaHora ?? 24;
  if (hasta <= desde) return { ok: false, motivo: "La hora de fin va después de la de inicio." };

  const inicia = instanteEnZona(anio, mes, num, desde);
  const termina = hasta === 24 ? finDelDia(anio, mes, num) : instanteEnZona(anio, mes, num, hasta);

  if (termina.getTime() < Date.now()) {
    return { ok: false, motivo: "Ese día ya pasó." };
  }
  if (inicia.getTime() > Date.now() + DIAS_MAXIMOS * 24 * HORA_MS) {
    return { ok: false, motivo: "Todavía no se puede cerrar tan lejos." };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").insert({
    inicia_en: inicia.toISOString(),
    termina_en: termina.toISOString(),
    nota: nota.trim() || null,
  });

  if (error) return { ok: false, motivo: "No se pudo cerrar. Vuelve a intentarlo." };
  refrescar();
  return { ok: true };
}

/** Vuelve a abrir un tramo cerrado, entero. */
export async function reabrir(id: number): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { error } = await supabase.from("cierres").delete().eq("id", id);
  if (error) return { ok: false, motivo: "No se pudo reabrir." };
  refrescar();
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// EL HORARIO DE TODAS LAS SEMANAS
// ═══════════════════════════════════════════════════════════════

/**
 * Añade un tramo a un día de la semana.
 *
 * El tramo es `[desde, hasta)`: «de 8 a 13» ofrece las 8, 9, 10, 11 y 12,
 * porque una sesión que empezara a las 13:00 acabaría a las 13:45, después
 * de cerrar.
 *
 * Que no se pise con otro tramo del mismo día lo comprueba un trigger en la
 * base. Aquí sólo se traduce su error a algo que se pueda leer.
 */
export async function anadirTramo(
  diaSemana: number,
  desdeHora: number,
  hastaHora: number,
): Promise<Respuesta> {
  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
    return { ok: false, motivo: "Ese día no existe." };
  }
  if (!Number.isInteger(desdeHora) || !Number.isInteger(hastaHora)) {
    return { ok: false, motivo: "Elige las dos horas." };
  }
  if (desdeHora < 0 || hastaHora > 24 || hastaHora <= desdeHora) {
    return { ok: false, motivo: "La hora de cierre va después de la de apertura." };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.from("horario").insert({
    dia_semana: diaSemana,
    desde_hora: desdeHora,
    hasta_hora: hastaHora,
  });

  if (error) {
    if (error.code === "23514") {
      return { ok: false, motivo: "Ese tramo se pisa con otro del mismo día." };
    }
    return { ok: false, motivo: "No se pudo guardar el tramo." };
  }

  refrescar();
  return { ok: true };
}

/**
 * Quita un tramo.
 *
 * Quitar el último tramo de un día deja ese día cerrado, y quitarlos todos
 * deja la agenda cerrada entera. Es un estado válido y la pantalla lo dice
 * en voz alta antes de que ocurra; lo que no se hace es impedirlo, porque
 * cerrar una temporada es una decisión legítima de quien atiende.
 */
export async function quitarTramo(id: number): Promise<Respuesta> {
  const supabase = await clienteServidor();
  const { error } = await supabase.from("horario").delete().eq("id", id);
  if (error) return { ok: false, motivo: "No se pudo quitar el tramo." };
  refrescar();
  return { ok: true };
}
