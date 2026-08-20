import { HORARIO_POR_DEFECTO, type Tramo } from "@/lib/horario";
import { clienteServidor, hayBase } from "@/lib/supabase/servidor";

/**
 * DE DÓNDE SALE EL HORARIO.
 *
 * De la tabla `horario`, que Henry edita desde su panel. Este archivo es el
 * único sitio del proyecto que la lee; todo lo demás recibe los tramos ya
 * resueltos, así que las funciones de `lib/horario.ts` siguen siendo puras y
 * se pueden probar sin base.
 */

type Fila = { dia_semana: number; desde_hora: number; hasta_hora: number };

/**
 * Los tramos abiertos, tal y como están en la base.
 *
 * ── El caso que hay que mirar dos veces ──
 *
 * Una tabla VACÍA y un error de lectura son cosas distintas, y aquí se
 * tratan distinto a propósito:
 *
 *   · error (no hay base, la migración no está aplicada, la red falló)
 *     → el horario por defecto, para que el sitio siga en pie enseñando algo
 *       creíble en vez de una pantalla muerta;
 *
 *   · cero filas → cero tramos, o sea CERRADO.
 *
 * Confundirlos sería grave en la dirección peligrosa: si Henry borra todos
 * sus tramos para cerrar el negocio una temporada y esto devolviera el
 * horario por defecto, el sitio volvería a ofrecer citas que él no piensa
 * atender.
 */
export async function leerTramos(): Promise<readonly Tramo[]> {
  if (!hayBase) return HORARIO_POR_DEFECTO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from("horario")
    .select("dia_semana, desde_hora, hasta_hora")
    .order("dia_semana", { ascending: true })
    .order("desde_hora", { ascending: true });

  if (error || !data) return HORARIO_POR_DEFECTO;

  return (data as Fila[]).map((f) => ({
    diaSemana: f.dia_semana,
    desdeHora: f.desde_hora,
    hastaHora: f.hasta_hora,
  }));
}

/** Lo mismo, con el id de cada tramo. Sólo lo necesita el panel, para borrar. */
export type TramoConId = Tramo & { id: number };

export async function leerTramosConId(): Promise<TramoConId[]> {
  if (!hayBase) return [];

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("horario")
    .select("id, dia_semana, desde_hora, hasta_hora")
    .order("dia_semana", { ascending: true })
    .order("desde_hora", { ascending: true });

  return ((data as (Fila & { id: number })[] | null) ?? []).map((f) => ({
    id: f.id,
    diaSemana: f.dia_semana,
    desdeHora: f.desde_hora,
    hastaHora: f.hasta_hora,
  }));
}
