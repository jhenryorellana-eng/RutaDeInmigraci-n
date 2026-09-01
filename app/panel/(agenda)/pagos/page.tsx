import { TablaPagos, type CorreoPago, type SolicitudEsperando, type Devolucion } from "@/components/panel/tabla-pagos";
import { fechaCorta, horaEnZona, ZONA } from "@/lib/horario";
import { clienteServidor } from "@/lib/supabase/servidor";
import { servicioPorId } from "@/lib/servicios";

/**
 * PAGOS · lo que el sistema no supo colocar solo.
 *
 * La conciliación resuelve sola el caso normal —una persona, un importe, una
 * hora— y esta pantalla es para el resto. Existe por una frase concreta que
 * Henry va a oír algún día: «yo pagué y no me aparece». Sin un sitio donde
 * mirar, esa frase no tiene respuesta.
 *
 * ── Tres cosas, y el orden es el de la urgencia ──
 *
 *   1. DEVOLUCIONES · alguien pagó y su hora ya no estaba. Es dinero de otra
 *      persona en la cuenta de Henry, y es lo único de esta pantalla que hay
 *      que resolver hoy.
 *   2. PAGOS SIN COLOCAR · llegó dinero y no se supo de quién. Puede ser de
 *      x-legal —el buzón es compartido y eso es lo normal— o de alguien de
 *      aquí que pagó un importe que no cuadra.
 *   3. ESPERANDO · quién está a mitad de pagar ahora mismo. No hay nada que
 *      hacer con ellas; están para entender las otras dos.
 *
 * ── Lo que NO se ofrece, a propósito ──
 *
 * Confirmar una cita sin un pago detrás. Todo lo que crea una cita en esta
 * pantalla parte de un correo del banco verificado: si no hay dinero, no hay
 * cita. Un botón de «marcar como pagada» convertiría toda la cadena —el
 * sello DKIM, la idempotencia, el cerrojo— en una sugerencia.
 */
export const dynamic = "force-dynamic";

type FilaCorreo = {
  id: number;
  transaccion: string;
  remitente: string;
  monto_centavos: number;
  memo: string | null;
  decision: string;
  motivo: string | null;
  auth_ok: boolean;
  leido_en: string;
};

type FilaSolicitud = {
  id: number;
  nombre: string;
  correo: string;
  whatsapp: string;
  inicia_en: string;
  servicio: string;
  precio_usd: number;
  codigo_pago: string;
  estado: string;
  motivo: string | null;
  referencia_pago: string | null;
  creado_en: string;
};

export default async function PantallaPagos() {
  const supabase = await clienteServidor();

  const [{ data: correos }, { data: solicitudes }] = await Promise.all([
    supabase
      .from("zelle_correos")
      .select("id, transaccion, remitente, monto_centavos, memo, decision, motivo, auth_ok, leido_en")
      .in("decision", ["sin_identificar", "ambiguo"])
      .order("leido_en", { ascending: false })
      .limit(100),
    supabase
      .from("solicitudes_pago")
      .select("id, nombre, correo, whatsapp, inicia_en, servicio, precio_usd, codigo_pago, estado, motivo, referencia_pago, creado_en")
      .in("estado", ["esperando", "hora_tomada"])
      .order("creado_en", { ascending: false })
      .limit(100),
  ]);

  const todas = ((solicitudes ?? []) as FilaSolicitud[]).map((s) => {
    const cuando = new Date(s.inicia_en);
    return {
      id: s.id,
      nombre: s.nombre,
      correo: s.correo,
      whatsapp: s.whatsapp,
      /* Formateado aquí, en hora de Utah: el panel enseña siempre la hora que
         Henry tiene en la cabeza. */
      cuando: `${fechaCorta(cuando)} · ${horaEnZona(cuando)}`,
      servicio: servicioPorId(s.servicio)?.nombre ?? s.servicio,
      precioUsd: s.precio_usd,
      codigoPago: s.codigo_pago,
      estado: s.estado,
      motivo: s.motivo,
      referenciaPago: s.referencia_pago,
      pedidaEl: diaYHora(new Date(s.creado_en)),
    };
  });

  const esperando: SolicitudEsperando[] = todas.filter((s) => s.estado === "esperando");
  const devoluciones: Devolucion[] = todas.filter((s) => s.estado === "hora_tomada");

  const pagos: CorreoPago[] = ((correos ?? []) as FilaCorreo[]).map((c) => ({
    id: c.id,
    remitente: c.remitente,
    montoUsd: c.monto_centavos / 100,
    memo: c.memo,
    ambiguo: c.decision === "ambiguo",
    motivo: c.motivo,
    selloOk: c.auth_ok,
    transaccion: c.transaccion,
    leidoEl: diaYHora(new Date(c.leido_en)),
  }));

  return <TablaPagos pagos={pagos} esperando={esperando} devoluciones={devoluciones} />;
}

/** «31 ago · 14:22», en hora de Utah. */
function diaYHora(instante: Date): string {
  const dia = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
  })
    .format(instante)
    .replace(".", "");
  return `${dia} · ${horaEnZona(instante)}`;
}
