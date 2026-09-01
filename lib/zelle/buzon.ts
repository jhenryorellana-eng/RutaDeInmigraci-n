import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import { decodificarQuotedPrintable } from "./dominio";

/**
 * EL BUZÓN · el único sitio que habla con el correo.
 *
 * Chase manda una alerta a `henryorellana@usalatinoprime.com` cada vez que
 * alguien le paga por Zelle. Esto entra a leerlas.
 *
 * ── Por qué se entra a buscar y no se reenvía ──
 *
 * La alternativa fácil sería reenviar los correos a un webhook. Y es la
 * trampa: al reenviar, el mensaje pierde la alineación de SPF y DMARC, o
 * sea justo lo que permite saber que el correo lo mandó Chase y no alguien
 * imitándolo. Leyendo por IMAP se conserva la cabecera
 * `Authentication-Results` que estampó el servidor, que es la prueba.
 *
 * ── El buzón ES la cola ──
 *
 * No hay cola aparte, ni reintentos que mantener. Un barrido que falla se
 * arregla solo en el siguiente porque el correo sigue ahí sin marcar. Eso
 * hace que la pieza más frágil —la red— no pueda perder un pago.
 *
 * ── Nunca se marca como leído ──
 *
 * Henry abre este buzón con su cliente de correo. Si el barrido marcara
 * `\Seen`, bastaría con que él abriera un correo antes para que el sistema
 * lo diera por procesado y ese pago no se apuntara nunca. Se usa una marca
 * propia, `$Reconciled`, que su programa no toca.
 */

export const MARCA_PROCESADO = "$Reconciled";

/** Tope por barrido: acota la memoria y el tiempo de una ejecución. */
const TOPE_POR_BARRIDO = 50;

export type CorreoCrudo = {
  uid: number;
  /** El UIDVALIDITY del buzón: sin él, un uid no significa nada. */
  uidvalidity: number;
  /** El mensaje entero, tal cual llegó. Es la prueba. */
  fuente: Buffer;
};

export type ResultadoBarrido = {
  uidvalidity: bigint;
  /** El cursor a guardar. */
  ultimoUid: number;
  leidos: number;
  procesados: number;
  fallidos: number;
};

export type ConfigBuzon = {
  host: string;
  port: number;
  user: string;
  pass: string;
  mailbox: string;
};

/** La configuración, o `null` si falta algo. Sin ella el barrido no corre. */
export function configDelEntorno(): ConfigBuzon | null {
  const host = process.env.ZELLE_IMAP_HOST;
  const user = process.env.ZELLE_IMAP_USER;
  const pass = process.env.ZELLE_IMAP_PASS;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(process.env.ZELLE_IMAP_PORT ?? 993),
    user,
    pass,
    mailbox: process.env.ZELLE_IMAP_MAILBOX ?? "ZELLE",
  };
}

/**
 * Recorre el buzón y le pasa cada correo nuevo a `manejar`.
 *
 * Marca como procesados sólo los que no lanzaron. El cursor avanza
 * únicamente sobre el tramo inicial de éxitos seguidos: si el tercero falla,
 * el cursor se queda en el segundo y el siguiente barrido vuelve a por él.
 * Avanzarlo del todo dejaría ese pago sin apuntar para siempre.
 */
export async function barrerBuzon(
  cfg: ConfigBuzon,
  opciones: { desdeUid: number; uidvalidityConocido: bigint | null; tope?: number },
  manejar: (correo: CorreoCrudo) => Promise<void>,
): Promise<ResultadoBarrido> {
  const tope = opciones.tope ?? TOPE_POR_BARRIDO;

  const cliente = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
    socketTimeout: 60_000,
    greetingTimeout: 15_000,
    connectionTimeout: 20_000,
  });
  /* Sin esto, un error de socket sube como excepción no capturada y tumba la
     función entera en vez de fallar sólo este barrido. */
  cliente.on("error", () => {});

  await cliente.connect();
  try {
    const cerrojo = await cliente.getMailboxLock(cfg.mailbox);
    try {
      const buzon = cliente.mailbox;
      if (!buzon || typeof buzon === "boolean") {
        throw new Error("El buzón no devolvió estado al abrirse.");
      }
      const uidvalidity = buzon.uidValidity ?? BigInt(0);

      /* Si cambió el UIDVALIDITY, todos los uid guardados dejan de
         significar nada y hay que releer desde cero. No es grave: la marca
         `$Reconciled` y el número de transacción impiden apuntar dos veces
         el mismo pago. */
      const cursorSirve =
        opciones.uidvalidityConocido !== null && uidvalidity === opciones.uidvalidityConocido;
      const desdeUid = cursorSirve ? opciones.desdeUid : 0;

      /* Primero se traen todos y después se marcan: imapflow no deja mandar
         otras órdenes mientras un `fetch` sigue abierto. */
      const traidos: CorreoCrudo[] = [];
      for await (const msg of cliente.fetch(
        { uid: `${desdeUid + 1}:*`, unKeyword: MARCA_PROCESADO },
        { uid: true, source: true },
        { uid: true },
      )) {
        /* La rareza de `n:*` en IMAP: siempre incluye el mensaje de uid más
           alto aunque esté por debajo del suelo pedido. Se filtra a mano. */
        if (msg.uid <= desdeUid) continue;
        if (!msg.source) continue;
        traidos.push({
          uid: msg.uid,
          uidvalidity: Number(uidvalidity),
          fuente: msg.source as Buffer,
        });
        if (traidos.length >= tope) break;
      }
      traidos.sort((a, b) => a.uid - b.uid);

      let procesados = 0;
      const uidsOk: number[] = [];
      let primerFallo: number | null = null;

      for (const correo of traidos) {
        try {
          await manejar(correo);
          procesados += 1;
          uidsOk.push(correo.uid);
        } catch {
          /* Se queda sin marcar y el siguiente barrido lo reintenta. No se
             registra el contenido: son datos de una persona. */
          primerFallo = primerFallo ?? correo.uid;
        }
      }

      if (uidsOk.length > 0) {
        await cliente.messageFlagsAdd({ uid: uidsOk.join(",") }, [MARCA_PROCESADO], {
          uid: true,
        });
      }

      const maxVisto = traidos.length > 0 ? traidos[traidos.length - 1].uid : desdeUid;
      const ultimoUid =
        primerFallo !== null
          ? Math.max(desdeUid, primerFallo - 1)
          : Math.max(desdeUid, maxVisto);

      return {
        uidvalidity,
        ultimoUid,
        leidos: traidos.length,
        procesados,
        fallidos: traidos.length - procesados,
      };
    } finally {
      cerrojo.release();
    }
  } finally {
    await cliente.logout().catch(() => {});
  }
}

export type CorreoAbierto = {
  /** Los valores de `Authentication-Results`, y sólo ésos. */
  authenticationResults: string[];
  remitente: string | null;
  asunto: string | null;
  /** El cuerpo HTML ya decodificado de quoted-printable. */
  html: string;
};

/**
 * Abre un correo crudo y saca lo que hace falta para decidir.
 *
 * ── El orden importa, y es contraintuitivo ──
 *
 * El HTML se saca del mensaje CRUDO y se decodifica a mano en vez de
 * fiarse del `html` que devuelve el analizador. Chase parte palabras a mitad
 * de línea con saltos blandos de quoted-printable, y cualquier lectura que
 * no deshaga eso PRIMERO devuelve apellidos rotos —un caso real: «CRISTAL
 * BON=\nILLA CASANOVA»—, el nombre no casa con nadie y el pago se queda sin
 * apuntar sin que salte ningún error.
 *
 * ── Y por qué se leen las cabeceras a mano ──
 *
 * Porque hace falta saber CUÁNTAS cabeceras `Authentication-Results` hay,
 * no sólo la última. Un analizador que las junte en una sola cadena borra
 * exactamente la señal que delata una inyección.
 */
export async function abrirCorreo(fuente: Buffer): Promise<CorreoAbierto> {
  const analizado = await simpleParser(fuente);

  const crudo = fuente.toString("latin1");
  const finCabeceras = crudo.search(/\r?\n\r?\n/);
  const cabeceras = finCabeceras === -1 ? crudo : crudo.slice(0, finCabeceras);

  /* Se desdoblan las cabeceras continuadas (las que siguen en la línea de
     abajo empezando por espacio) antes de buscar. */
  const desdobladas = cabeceras.replace(/\r?\n[ \t]+/g, " ");
  const authenticationResults: string[] = [];
  for (const linea of desdobladas.split(/\r?\n/)) {
    const m = linea.match(/^Authentication-Results:\s*(.*)$/i);
    if (m) authenticationResults.push(m[1].trim());
  }

  return {
    authenticationResults,
    remitente: analizado.from?.value?.[0]?.address?.toLowerCase() ?? null,
    asunto: analizado.subject ?? null,
    html: decodificarQuotedPrintable(crudo),
  };
}
