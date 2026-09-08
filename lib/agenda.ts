import { instanteEnZona, partesEnZona } from "@/lib/horario";

export type EntradaAgenda = {
  id: number;
  tipo: "cita" | "evento";
  titulo: string;
  inicio: string;
  fin: string;
  version: string;
  ocupa: boolean;
  nota: string;
  whatsapp: string;
  estado?: string;
  servicio?: string | null;
  precio?: number | null;
  detalle?: string;
};

export type CambioAgenda = {
  tipo: "cita" | "evento";
  id?: number;
  version?: string;
  titulo: string;
  fecha: string;
  hora: string;
  duracion: number;
  ocupa: boolean;
  nota: string;
  whatsapp: string;
};

export function fechaYHora(iso: string) {
  const p = partesEnZona(new Date(iso));
  return {
    fecha: `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(p.dia).padStart(2, "0")}`,
    hora: `${String(p.hora).padStart(2, "0")}:00`,
  };
}

/** La fecha del formulario siempre pertenece a Utah, nunca al teléfono. */
export function instanteAgenda(fecha: string, hora: string): Date | null {
  if (typeof fecha !== "string" || typeof hora !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^([01]\d|2[0-3]):00$/.test(hora))
    return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const h = Number(hora.slice(0, 2));
  if (anio < 2020 || anio > 2100) return null;
  const t = instanteEnZona(anio, mes, dia, h);
  const p = partesEnZona(t);
  // Rechaza fechas imposibles y la hora que no existe al adelantar el reloj.
  return p.anio === anio && p.mes === mes && p.dia === dia && p.hora === h
    ? t
    : null;
}

export function validarCambioAgenda(c: CambioAgenda) {
  if (!c || !["cita", "evento"].includes(c.tipo))
    return { error: "Elige un registro válido." } as const;
  if (
    c.id !== undefined &&
    (!Number.isSafeInteger(c.id) ||
      c.id < 1 ||
      !c.version ||
      !Number.isFinite(Date.parse(c.version)))
  )
    return { error: "Recarga la agenda y abre el registro otra vez." } as const;
  if (c.tipo === "cita" && !c.id)
    return { error: "Esta reserva ya no está disponible." } as const;
  if (
    typeof c.titulo !== "string" ||
    c.titulo.trim().length < (c.tipo === "cita" ? 2 : 1) ||
    c.titulo.trim().length > (c.tipo === "cita" ? 120 : 80)
  )
    return { error: "Escribe un nombre o título válido." } as const;
  const inicio = instanteAgenda(c.fecha, c.hora);
  if (!inicio) return { error: "Revisa la fecha y la hora de Utah." } as const;
  if (!Number.isInteger(c.duracion) || c.duracion < 1 || c.duracion > 24)
    return { error: "La duración debe estar entre 1 y 24 horas." } as const;
  if (
    typeof c.nota !== "string" ||
    c.nota.length > 2000 ||
    typeof c.ocupa !== "boolean" ||
    typeof c.whatsapp !== "string"
  )
    return { error: "Revisa los datos del formulario." } as const;
  const whatsapp = c.whatsapp.replace(/[\s()+.-]/g, "");
  if (whatsapp && !/^\d{8,15}$/.test(whatsapp))
    return {
      error: "Usa un WhatsApp de 8 a 15 dígitos, con código de país.",
    } as const;
  return {
    datos: {
      tipo: c.tipo,
      id: c.id ?? null,
      version: c.version ?? null,
      titulo: c.titulo.trim(),
      inicio: inicio.toISOString(),
      fin: new Date(
        inicio.getTime() + (c.tipo === "cita" ? 1 : c.duracion) * 3600000,
      ).toISOString(),
      ocupa: c.ocupa,
      nota: c.nota.trim(),
      whatsapp: whatsapp || null,
    },
  } as const;
}

export function errorAgenda(codigo?: string, mensaje = "") {
  if (codigo === "40001")
    return "Esta cita cambió en otro dispositivo. Recarga la agenda antes de editarla.";
  if (codigo === "23505" || codigo === "23P01")
    return "Esa hora acaba de ocuparse. Elige otra; no se guardó ningún cambio.";
  if (codigo === "42501")
    return "Tu sesión no permite editar. Vuelve a iniciar sesión.";
  if (codigo === "P0002")
    return "Este registro ya no existe. Recarga la agenda.";
  if (codigo === "23514" && mensaje.startsWith("AGENDA:"))
    return mensaje.slice(7).trim();
  return "No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.";
}

export type CeldaDia =
  | {
      estado: "cita";
      iso: string;
      nombre: string;
      /** Retenida, sin pagar. Ocupa la hora pero todavía no es una cita. */
      pendiente: boolean;
      pais: string;
      enEeuu: boolean;
      /** En hora de Utah, que es la de Henry. */
      hora: string;
      /** La de esa persona. `null` si está a la misma hora que Utah. */
      horaSuya: string | null;
      whatsapp: string | null;
    }
  | {
      /* Lo que Henry apuntó: el dentista, un viaje, una llamada. NO es una
         cita: otra tabla, sin precio, sin pago y fuera de Personas. */
      estado: "evento";
      iso: string;
      eventoId: number;
      titulo: string;
      /** Si además le quita la hora al público. */
      ocupa: boolean;
      /** Sólo la primera hora de una tira escribe el título. */
      primera: boolean;
    }
  | { estado: "libre"; iso: string }
  | { estado: "cerrada"; iso: string; suelta: boolean }
  | { estado: "pasada"; iso: string }
  | { estado: "fuera" };

export type DiaPintado = {
  clave: string;
  abreviatura: string;
  numero: number;
  esHoy: boolean;
  celdas: CeldaDia[];
};
