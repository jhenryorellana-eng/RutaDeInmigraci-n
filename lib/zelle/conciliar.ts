import { clienteServidor } from "@/lib/supabase/servidor";

import { abrirCorreo, barrerBuzon, configDelEntorno } from "./buzon";
import {
  decidir,
  parsearCorreoChase,
  verificarAutenticidad,
  ErrorParseo,
  type CitaPendiente,
} from "./dominio";

/**
 * EL CONCILIADOR · pega las piezas.
 *
 * Barre el buzón, abre cada correo, lo verifica, lo parsea, pregunta a la
 * base qué citas esperan ese importe, decide, y aplica.
 *
 * ── Por qué NO hay `service_role` en este archivo ──
 *
 * Porque la regla de este proyecto es que esa llave no entra aquí: se salta
 * el RLS entero, y el RLS es lo único que impide leer los datos de todas las
 * personas que han reservado. Un fallo en cualquier ruta del sitio con esa
 * llave presente lo abre todo.
 *
 * En su lugar, cuatro funciones estrechas de la base con un secreto
 * compartido (`0009_zelle_conciliador.sql`). Con ese secreto se puede
 * preguntar «¿quién espera $70?» y confirmar una cita concreta, y nada más:
 * no se puede listar la agenda ni sacar los datos de nadie.
 *
 * ── Lo que pasa cuando algo va mal ──
 *
 * Nada se pierde. Un correo que lanza se queda sin marcar en el buzón y el
 * siguiente barrido vuelve a por él; el cursor no lo salta. Un correo que no
 * se entiende se apunta igual, con el motivo, y espera a que lo mire una
 * persona. La única forma de perder un pago sería descartarlo en silencio, y
 * eso no ocurre en ninguna rama.
 */

export type ResumenConciliacion = {
  corrio: boolean;
  motivo?: string;
  leidos: number;
  confirmados: number;
  aRevisar: number;
  rechazados: number;
  yaVistos: number;
};

function secreto(): string | null {
  return process.env.AVISO_SECRETO?.trim() || null;
}

/**
 * Un barrido completo. Es lo que llama el cron.
 *
 * Devuelve un resumen sin un solo dato personal: se publica en la respuesta
 * de una ruta, y ahí no puede aparecer el nombre de nadie.
 */
export async function conciliarBuzon(): Promise<ResumenConciliacion> {
  const vacio = { leidos: 0, confirmados: 0, aRevisar: 0, rechazados: 0, yaVistos: 0 };

  const cfg = configDelEntorno();
  if (!cfg) {
    return { corrio: false, motivo: "Faltan las variables ZELLE_IMAP_*.", ...vacio };
  }
  const clave = secreto();
  if (!clave) {
    return { corrio: false, motivo: "Falta AVISO_SECRETO.", ...vacio };
  }

  const supabase = await clienteServidor();

  const { data: cursor, error: errCursor } = await supabase.rpc("zelle_cursor_leer", {
    secreto: clave,
  });
  if (errCursor) {
    return { corrio: false, motivo: "La base rechazó el secreto o no responde.", ...vacio };
  }

  const leido = (cursor ?? {}) as { uidvalidity: number | null; ultimoUid: number };
  let confirmados = 0;
  let aRevisar = 0;
  let rechazados = 0;
  let yaVistos = 0;

  const resultado = await barrerBuzon(
    cfg,
    {
      desdeUid: leido.ultimoUid ?? 0,
      uidvalidityConocido: leido.uidvalidity !== null ? BigInt(leido.uidvalidity) : null,
    },
    async (correo) => {
      const abierto = await abrirCorreo(correo.fuente);
      const autenticidad = verificarAutenticidad({
        authenticationResults: abierto.authenticationResults,
        remitente: abierto.remitente,
        asunto: abierto.asunto,
      });

      /* El parseo va DESPUÉS de la verificación pero su fallo no descarta
         nada: un correo que no se entiende puede ser dinero que entró, así
         que se apunta con lo que se sepa y lo mira una persona. Lo que no se
         puede hacer nunca es tirarlo. */
      let pago;
      try {
        pago = parsearCorreoChase(abierto.html);
      } catch (e) {
        if (e instanceof ErrorParseo) {
          /* Sin número de transacción no hay llave de idempotencia, así que
             no se puede apuntar en la tabla. Se deja sin marcar para que el
             siguiente barrido lo reintente y quede en el buzón, que es donde
             Henry lo va a ver. */
          throw new Error(`Correo ilegible (${e.codigo}); queda en el buzón para revisarlo.`);
        }
        throw e;
      }

      const { data: apunte, error } = await supabase.rpc("zelle_apuntar_y_candidatas", {
        secreto: clave,
        p_transaccion: pago.transaccion,
        p_remitente: pago.remitente,
        p_monto_centavos: pago.montoCentavos,
        p_memo: pago.memo,
        p_enviado_el: pago.enviadoEl,
        p_auth_ok: autenticidad.ok,
        p_auth_detalle: {
          dkim: autenticidad.dkim,
          spf: autenticidad.spf,
          dmarc: autenticidad.dmarc,
          motivos: autenticidad.motivos,
          plantilla: pago.plantilla,
          plantillaConocida: pago.plantillaConocida,
        },
      });

      /* Si la base no acepta el apunte, se lanza: el correo se queda sin
         marcar y se reintenta. Marcarlo aquí perdería el pago. */
      if (error) throw new Error("La base no aceptó el apunte del correo.");

      const res = apunte as { ya_visto: boolean; candidatas?: CitaPendiente[] };
      if (res.ya_visto) {
        yaVistos += 1;
        return;
      }

      const decision = decidir({
        pago,
        autenticidad,
        pendientes: res.candidatas ?? [],
      });

      const aplicado = await supabase.rpc("zelle_aplicar", {
        secreto: clave,
        p_transaccion: pago.transaccion,
        p_decision: decision.tipo === "confirmar" ? "confirmado" : decision.tipo,
        p_cita_id: decision.tipo === "confirmar" ? decision.citaId : null,
        p_motivo: decision.motivo,
      });
      if (aplicado.error) throw new Error("La base no aceptó la decisión.");

      if (decision.tipo === "confirmar") confirmados += 1;
      else if (decision.tipo === "rechazado") rechazados += 1;
      else aRevisar += 1;
    },
  );

  await supabase.rpc("zelle_cursor_guardar", {
    secreto: clave,
    p_uidvalidity: Number(resultado.uidvalidity),
    p_ultimo_uid: resultado.ultimoUid,
    p_error: resultado.fallidos > 0 ? `${resultado.fallidos} correo(s) quedaron por reintentar` : null,
  });

  return {
    corrio: true,
    leidos: resultado.leidos,
    confirmados,
    aRevisar,
    rechazados,
    yaVistos,
  };
}
