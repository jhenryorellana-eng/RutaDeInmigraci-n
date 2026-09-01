/**
 * CONCILIACIÓN DE ZELLE · la parte que piensa.
 *
 * Sin nada de entrada/salida: todo lo de aquí es determinista y se puede
 * probar sin buzón, sin base y sin red. Leer el correo es cosa de
 * `lib/zelle/buzon.ts`; decidir contra qué cita casa es cosa de
 * `lib/zelle/conciliar.ts`.
 *
 * ── De dónde sale ──
 *
 * Portado del módulo `zelle-recon` de x-legal, que lleva meses corriendo
 * contra correos reales de Chase. Lo que se conserva es lo que allí se ganó
 * a base de golpes —el orden de decodificación, la verificación del sello y
 * el parser por pares etiqueta/valor— y lo que cambia es a qué se parece el
 * otro lado: allí había casos con planes de cuotas, aquí hay una cita con un
 * precio.
 *
 * ── Lo que se simplificó, y por qué se puede ──
 *
 * Allí el memo TENÍA que llevar el número de caso, porque un cliente podía
 * tener seis cuotas abiertas de importes distintos y sin esa referencia no
 * había forma de saber cuál pagaba. Aquí casi nadie tiene dos citas a la
 * vez: el nombre, el importe y la hora suelen bastar para señalar una sola
 * candidata. El código de cuatro dígitos sigue existiendo y se sigue
 * pidiendo, pero es un desempate, no un requisito — y esa diferencia es la
 * que evita tener que aprobar pagos a mano todos los días.
 */

// ═══════════════════════════════════════════════════════════════
// Lo que se espera de un correo de Chase
// ═══════════════════════════════════════════════════════════════

export const CHASE = {
  /** El `authserv-id` que sella el servidor de correo. Los MX rotan. */
  selloServidor: /^mx\d+\.migadu\.com$/i,
  dominioFirmante: "chase.com",
  remitente: "no.reply.alerts@chase.com",
  /** El sobre lleva un sufijo numérico rotatorio: .01@, .06@, .10@… */
  remitenteSobre: /^no\.reply\.alerts(\.\d+)?@chase\.com$/i,
  asunto: /^You received money with Zelle/i,
} as const;

/**
 * Las dos plantillas vivas de Chase.
 *
 * El banco corre dos sistemas de envío y los dos identificadores están en
 * producción. Uno desconocido NO se descarta —el dinero llegó igual— pero
 * cierra la puerta a confirmar solo: se guarda para que alguien lo mire y
 * se revise el parser, porque una plantilla nueva puede estar dejando el
 * importe en otro sitio.
 */
export const PLANTILLAS_CONOCIDAS: readonly string[] = [
  "zelle_auto_accept_receiver",
  "zelle_auto_accept_receiver_chase_email",
];

// ═══════════════════════════════════════════════════════════════
// MIME
// ═══════════════════════════════════════════════════════════════

/**
 * Deshace el quoted-printable.
 *
 * ESTO VA PRIMERO, SIEMPRE. Chase manda el cuerpo en quoted-printable con
 * saltos blandos —un «=» al final de la línea— que parten palabras por la
 * mitad: en un correo real llegó «CRISTAL BON=\nILLA CASANOVA». Si se lanza
 * cualquier expresión regular antes de deshacer esto, el apellido sale roto
 * y el pago no casa con nadie, sin ningún error por medio.
 *
 * La entrada tiene que venir leída como latin1/binario, un carácter por byte.
 */
export function decodificarQuotedPrintable(entrada: string): string {
  const sinSaltosBlandos = entrada.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < sinSaltosBlandos.length; i += 1) {
    const c = sinSaltosBlandos[i];
    if (c === "=" && /^[0-9A-Fa-f]{2}$/.test(sinSaltosBlandos.substr(i + 1, 2))) {
      bytes.push(parseInt(sinSaltosBlandos.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(sinSaltosBlandos.charCodeAt(i) & 0xff);
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

const ENTIDADES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&reg;": "®",
};

function sinEtiquetas(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#a-z0-9]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escaparRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ═══════════════════════════════════════════════════════════════
// ¿Vino de verdad del banco?
// ═══════════════════════════════════════════════════════════════

export type Veredicto = {
  ok: boolean;
  dkim: string | null;
  spf: string | null;
  dmarc: string | null;
  motivos: string[];
};

/**
 * Decide si el correo lo mandó Chase de verdad.
 *
 * El servidor de correo valida DKIM, SPF y DMARC al recibir y estampa el
 * resultado en una cabecera `Authentication-Results`. Ese sello es de fiar
 * PORQUE lo escribe el último servidor — pero sólo si se lee la cabecera
 * correcta.
 *
 * ── El detalle que parece paranoia y no lo es ──
 *
 * Quien manda un correo puede meter de antemano una cabecera
 * `Authentication-Results` falsa con el mismo `authserv-id`, y el servidor
 * añade la suya sin borrar la impostora. Al leer, aparecen dos. Por eso: MÁS
 * DE UN SELLO ⇒ se rechaza. Sin esa regla, falsificar un pago es escribir
 * una línea de cabecera.
 *
 * Y sólo cuentan las cabeceras `Authentication-Results`:
 * `ARC-Authentication-Results` es otra cosa y no vale nunca.
 */
export function verificarAutenticidad(entrada: {
  authenticationResults: string[];
  remitente: string | null;
  asunto: string | null;
}): Veredicto {
  const motivos: string[] = [];
  const v: Veredicto = { ok: false, dkim: null, spf: null, dmarc: null, motivos };

  const sellos = entrada.authenticationResults.filter((s) =>
    CHASE.selloServidor.test(s.split(";")[0].trim()),
  );

  if (sellos.length === 0) {
    motivos.push("El servidor de correo no selló este mensaje.");
    return v;
  }
  if (sellos.length > 1) {
    motivos.push(
      `Hay ${sellos.length} sellos del servidor: posible inyección de cabecera. Rechazado.`,
    );
    return v;
  }

  const sello = sellos[0];
  let dkimOk = false;
  let spfOk = false;
  let dmarcOk = false;

  const dkim = sello.match(/\bdkim=(\w+)([^;]*)/i);
  v.dkim = dkim?.[1]?.toLowerCase() ?? null;
  if (v.dkim === "pass") {
    const d = dkim?.[2]?.match(/header\.d=([^\s;]+)/i)?.[1]?.toLowerCase();
    if (d === CHASE.dominioFirmante) dkimOk = true;
    else motivos.push(`La firma DKIM es de «${d ?? "?"}», no de ${CHASE.dominioFirmante}.`);
  } else {
    motivos.push(`DKIM no pasó (${v.dkim ?? "ausente"}).`);
  }

  const spf = sello.match(/\bspf=(\w+)/i);
  v.spf = spf?.[1]?.toLowerCase() ?? null;
  if (v.spf === "pass") {
    const sobre = sello.match(/smtp\.mailfrom=([^\s;]+)/i)?.[1] ?? "";
    if (CHASE.remitenteSobre.test(sobre)) spfOk = true;
    else motivos.push(`SPF pasó pero el sobre viene de «${sobre}».`);
  } else {
    motivos.push(`SPF no pasó (${v.spf ?? "ausente"}).`);
  }

  const dmarc = sello.match(/\bdmarc=(\w+)([^;]*)/i);
  v.dmarc = dmarc?.[1]?.toLowerCase() ?? null;
  if (v.dmarc === "pass") {
    const hf = dmarc?.[2]?.match(/header\.from=([^\s;]+)/i)?.[1]?.toLowerCase();
    if (hf === CHASE.dominioFirmante) dmarcOk = true;
    else motivos.push(`DMARC alineado con «${hf ?? "?"}».`);
  } else {
    motivos.push(`DMARC no pasó (${v.dmarc ?? "ausente"}).`);
  }

  const de = (entrada.remitente ?? "").trim().toLowerCase();
  const deOk = de === CHASE.remitente;
  if (!deOk) motivos.push(`Remitente inesperado: «${de}».`);

  const asuntoOk = CHASE.asunto.test(entrada.asunto ?? "");
  if (!asuntoOk) motivos.push(`Asunto inesperado: «${entrada.asunto ?? ""}».`);

  v.ok = dkimOk && spfOk && dmarcOk && deOk && asuntoOk;
  return v;
}

// ═══════════════════════════════════════════════════════════════
// El parser
// ═══════════════════════════════════════════════════════════════

export type PagoZelle = {
  remitente: string;
  montoCentavos: number;
  /** «2026-08-31» tal y como lo declara Chase. `null` si no venía. */
  enviadoEl: string | null;
  /** La llave de idempotencia: sobrevive a los reenvíos del banco. */
  transaccion: string;
  memo: string | null;
  plantilla: string | null;
  plantillaConocida: boolean;
  /** El nombre del titular aparece dos veces; comprobarlo sale gratis. */
  nombreVerificadoDosVeces: boolean;
};

export class ErrorParseo extends Error {
  constructor(
    mensaje: string,
    readonly codigo: "SIN_PLANTILLA" | "FALTA_CAMPO" | "MONTO_RARO" | "FECHA_RARA",
  ) {
    super(mensaje);
    this.name = "ErrorParseo";
  }
}

const MESES: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

/** «Jul 22, 2026» → «2026-07-22». Con tabla propia: no depende del locale. */
function fechaDeChase(crudo: string): string {
  const m = crudo.trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) throw new ErrorParseo(`Fecha que no entiendo: «${crudo}»`, "FECHA_RARA");
  const mes = MESES[m[1].toLowerCase()];
  if (!mes) throw new ErrorParseo(`Mes que no entiendo: «${m[1]}»`, "FECHA_RARA");
  return `${m[3]}-${mes}-${m[2].padStart(2, "0")}`;
}

/** «$1,234.56» → 123456. En centavos, para no comparar decimales. */
function montoEnCentavos(crudo: string): number {
  const m = crudo.match(/\$?\s*([\d,]+)(?:\.(\d{2}))?/);
  if (!m) throw new ErrorParseo(`Importe ilegible: «${crudo}»`, "MONTO_RARO");
  const dolares = Number(m[1].replace(/,/g, ""));
  const centavos = m[2] ? Number(m[2]) : 0;
  const total = dolares * 100 + centavos;
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new ErrorParseo(`Importe inválido: «${crudo}»`, "MONTO_RARO");
  }
  return total;
}

/**
 * Saca los datos del pago. Recibe el HTML YA decodificado.
 *
 * Lanza cuando la plantilla no cuadra, y quien llame tiene que mandar ese
 * correo a revisión — nunca descartarlo en silencio. Un correo que no se
 * entiende es dinero que entró y que nadie apuntó.
 */
export function parsearCorreoChase(html: string): PagoZelle {
  /* Sólo el PRIMER <title>: la plantilla de Chase lleva un segundo, vacío,
     más abajo en el cuerpo. Sale en todos los correos reales. */
  const plantilla = html.match(/<title>\s*([^<]*?)\s*<\/title>/i)?.[1] || null;

  // 1 · Quién paga. El <h1> es el ancla más estable de la plantilla.
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (!h1) throw new ErrorParseo("No encuentro el <h1> con el remitente", "SIN_PLANTILLA");
  const titular = sinEtiquetas(h1);
  const m = titular.match(/^(.+?)\s+sent you money\b/i);
  if (!m) throw new ErrorParseo(`Titular inesperado: «${titular}»`, "SIN_PLANTILLA");
  const remitente = m[1].trim();

  /* 2 · La tabla de detalles, leída como pares etiqueta/valor. Aguanta mucho
     mejor los cambios de estilo en línea que una regex por campo. */
  const desde = html.search(/Here are the details/i);
  if (desde === -1) throw new ErrorParseo("No encuentro el bloque de detalles", "SIN_PLANTILLA");
  const ini = html.indexOf("<table", desde);
  const fin = html.indexOf("</table>", ini);
  if (ini === -1 || fin === -1) throw new ErrorParseo("No encuentro la tabla", "SIN_PLANTILLA");

  const celdas = [...html.slice(ini, fin).matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
    sinEtiquetas(c[1]),
  );
  const campos = new Map<string, string>();
  for (let i = 0; i + 1 < celdas.length; i += 2) campos.set(celdas[i].toLowerCase(), celdas[i + 1]);

  const exigir = (etiqueta: string): string => {
    const v = campos.get(etiqueta);
    if (v === undefined || v === "") {
      throw new ErrorParseo(`Falta el campo «${etiqueta}»`, "FALTA_CAMPO");
    }
    return v;
  };

  const montoCentavos = montoEnCentavos(exigir("amount"));

  const txnCrudo = exigir("transaction number");
  const transaccion = txnCrudo.replace(/\s+/g, "");
  if (!/^\d{6,}$/.test(transaccion)) {
    throw new ErrorParseo(`Número de transacción raro: «${txnCrudo}»`, "FALTA_CAMPO");
  }

  const memoCrudo = campos.get("memo") ?? "";
  const memo = !memoCrudo || /^n\s*\/?\s*a$/i.test(memoCrudo) ? null : memoCrudo;

  /* Chase repite el nombre más abajo («X is registered with a Zelle® member
     bank…»). Comprobarlo no cuesta nada y descarta un parseo torcido. */
  const nombreVerificadoDosVeces = new RegExp(
    `${escaparRegExp(remitente)}\\s+is registered with a Zelle`,
    "i",
  ).test(sinEtiquetas(html));

  let enviadoEl: string | null = null;
  const fechaCruda = campos.get("sent on");
  if (fechaCruda) enviadoEl = fechaDeChase(fechaCruda);

  return {
    remitente,
    montoCentavos,
    enviadoEl,
    transaccion,
    memo,
    plantilla,
    plantillaConocida: plantilla !== null && PLANTILLAS_CONOCIDAS.includes(plantilla),
    nombreVerificadoDosVeces,
  };
}

// ═══════════════════════════════════════════════════════════════
// El código del memo
// ═══════════════════════════════════════════════════════════════

export type CodigosEnMemo = {
  /** El único que había, o `null` si hubo cero o más de uno. */
  unico: string | null;
  todos: string[];
};

/**
 * Saca códigos de cuatro dígitos del memo.
 *
 * Tolerante con lo que la gente escribe alrededor —«pago 4821», «cita
 * #4821», «4821 henry»— y nada tolerante con el número en sí: no se corrige
 * un dígito ni se rellenan ceros. Un código mal leído no es un fallo menor,
 * es el pago de una persona apuntado en la cita de otra.
 *
 * Si aparecen dos números distintos de cuatro dígitos, nadie puede saber
 * cuál era el código: se devuelve `unico: null` y el pago va a revisión.
 *
 * ── Por qué se exige que esté aislado ──
 *
 * Un importe escrito en el memo («pago 150.00») o un teléfono no pueden
 * confundirse con un código. Por eso el número tiene que ir rodeado de algo
 * que no sea un dígito ni un punto: «1500» dentro de «$1500.00» no cuenta.
 */
export function codigosDelMemo(memo: string | null | undefined): CodigosEnMemo {
  if (!memo) return { unico: null, todos: [] };
  const vistos = new Set<string>();
  const todos: string[] = [];
  for (const m of memo.matchAll(/(?:^|[^\d.,])(\d{4})(?![\d.,])/g)) {
    if (!vistos.has(m[1])) {
      vistos.add(m[1]);
      todos.push(m[1]);
    }
  }
  return { unico: todos.length === 1 ? todos[0] : null, todos };
}

// ═══════════════════════════════════════════════════════════════
// Nombres
// ═══════════════════════════════════════════════════════════════

/**
 * Normaliza pensando en nombres hispanos: dos apellidos, iniciales sueltas y
 * un orden que casi nunca coincide entre lo que la persona escribió aquí y
 * lo que tiene puesto en su banco.
 *
 * Se tiran las iniciales de una letra («ELIANA M VILLA» → ELIANA VILLA) y se
 * ordena alfabéticamente, para que el orden deje de importar.
 */
export function normalizarNombre(entrada: string): string {
  return entrada
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[Ññ]/g, "N")
    .toUpperCase()
    .replace(/[^A-Z]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 1)
    .sort()
    .join(" ");
}

function fichas(nombre: string): Set<string> {
  return new Set(normalizarNombre(nombre).split(" ").filter((t) => t !== ""));
}

/** Cuántas palabras comparten los dos nombres. */
export function palabrasCompartidas(a: string, b: string): number {
  const fa = fichas(a);
  const fb = fichas(b);
  let n = 0;
  for (const t of fa) if (fb.has(t)) n += 1;
  return n;
}

/**
 * Cuánto del nombre más corto está contenido en el más largo.
 *
 * El banco casi siempre lleva MENOS palabras que el formulario («LUCIA
 * PAREDES» contra «Lucía Fernanda Paredes Solís»). Por eso se mide
 * contención y no parecido global.
 *
 * Quien lo use tiene que exigir además DOS palabras compartidas como mínimo:
 * un «MARÍA» suelto tiene contención perfecta contra todas las Marías del
 * mundo, y eso no identifica a nadie.
 */
export function contencionNombre(a: string, b: string): number {
  const fa = fichas(a);
  const fb = fichas(b);
  const min = Math.min(fa.size, fb.size);
  if (min === 0) return 0;
  return palabrasCompartidas(a, b) / min;
}

// ═══════════════════════════════════════════════════════════════
// La decisión
// ═══════════════════════════════════════════════════════════════

/** Una cita esperando pago, tal y como la ve el conciliador. */
export type CitaPendiente = {
  id: number;
  nombre: string;
  codigoPago: string | null;
  precioUsd: number;
  /** Cuándo se creó, en milisegundos. Se usa para preferir la más reciente. */
  creadoEnMs: number;
};

export type Decision =
  | { tipo: "confirmar"; citaId: number; motivo: string }
  | { tipo: "sin_identificar"; motivo: string }
  | { tipo: "ambiguo"; motivo: string; candidatas: number[] }
  | { tipo: "rechazado"; motivo: string };

/**
 * A qué cita corresponde este pago.
 *
 * ── La regla, y por qué es tan corta ──
 *
 * En x-legal esto era un sistema de puntuación con seis señales, porque un
 * cliente podía tener seis cuotas abiertas de importes parecidos. Aquí casi
 * nadie tiene dos citas a la vez, así que la pregunta de verdad es mucho más
 * simple: **de las que esperan pago, ¿cuántas cuadran con este importe?**
 *
 *   · Ninguna              → no se identifica. A revisión.
 *   · Una sola             → esa es. Se confirma.
 *   · Varias con el mismo importe → hace falta desempatar, y para eso está
 *                            el código del memo; si tampoco desempata, el
 *                            nombre; y si nada desempata, a revisión.
 *
 * Ese es exactamente el encargo: que el código de cuatro dígitos sea un
 * desempate para los días raros, y que el día normal —una persona, un
 * importe, una hora— se resuelva solo.
 *
 * ── Lo que NUNCA confirma solo ──
 *
 * Un correo cuyo sello no pasó, o cuya plantilla no reconocemos. En los dos
 * casos el dinero pudo entrar igual, así que no se descarta: se guarda para
 * que lo mire una persona. Confirmar sobre una plantilla desconocida sería
 * fiarse de un importe que quizá se leyó de la casilla equivocada.
 */
export function decidir(entrada: {
  pago: PagoZelle;
  autenticidad: Veredicto;
  pendientes: CitaPendiente[];
}): Decision {
  const { pago, autenticidad, pendientes } = entrada;

  if (!autenticidad.ok) {
    return {
      tipo: "rechazado",
      motivo: `El correo no se pudo verificar: ${autenticidad.motivos.join(" ")}`,
    };
  }

  if (!pago.plantillaConocida) {
    return {
      tipo: "sin_identificar",
      motivo:
        `Plantilla desconocida («${pago.plantilla ?? "sin título"}»). ` +
        "No se confirma solo: el parser puede estar leyendo otra casilla.",
    };
  }

  /* El importe es la primera criba, y es exacta. Un pago de $70 no puede ser
     una cita de $150 aunque el nombre coincida: o pagó de menos, o es otra
     cosa, y ninguna de las dos se arregla adivinando. */
  const mismoImporte = pendientes.filter((c) => c.precioUsd * 100 === pago.montoCentavos);

  if (mismoImporte.length === 0) {
    const dolares = (pago.montoCentavos / 100).toFixed(2);
    return {
      tipo: "sin_identificar",
      motivo:
        pendientes.length === 0
          ? `Llegaron $${dolares} y no hay ninguna cita esperando pago.`
          : `Llegaron $${dolares} y ninguna de las ${pendientes.length} citas que esperan cuesta eso.`,
    };
  }

  if (mismoImporte.length === 1) {
    return {
      tipo: "confirmar",
      citaId: mismoImporte[0].id,
      motivo: "Una sola cita esperaba ese importe.",
    };
  }

  /* Empate por importe. Aquí es donde el código gana su sitio. */
  const codigos = codigosDelMemo(pago.memo);
  if (codigos.unico) {
    const porCodigo = mismoImporte.filter((c) => c.codigoPago === codigos.unico);
    if (porCodigo.length === 1) {
      return {
        tipo: "confirmar",
        citaId: porCodigo[0].id,
        motivo: `Desempatado por el código ${codigos.unico} del memo.`,
      };
    }
    if (porCodigo.length === 0) {
      return {
        tipo: "sin_identificar",
        motivo:
          `El memo trae el código ${codigos.unico}, que no corresponde a ninguna ` +
          "de las citas que esperan ese importe.",
      };
    }
  }

  /* Sin código utilizable, el nombre. Se exige contención total y al menos
     dos palabras compartidas: un «MARÍA» suelto no identifica a nadie. */
  const porNombre = mismoImporte.filter(
    (c) =>
      palabrasCompartidas(c.nombre, pago.remitente) >= 2 &&
      contencionNombre(c.nombre, pago.remitente) === 1,
  );

  if (porNombre.length === 1) {
    return {
      tipo: "confirmar",
      citaId: porNombre[0].id,
      motivo: `Desempatado por el nombre («${pago.remitente}»).`,
    };
  }

  return {
    tipo: "ambiguo",
    motivo:
      `Hay ${mismoImporte.length} citas esperando $${(pago.montoCentavos / 100).toFixed(2)} ` +
      (codigos.todos.length > 1
        ? `y el memo trae más de un número de cuatro cifras (${codigos.todos.join(", ")}).`
        : "y ni el memo ni el nombre desempatan."),
    candidatas: mismoImporte.map((c) => c.id),
  };
}
