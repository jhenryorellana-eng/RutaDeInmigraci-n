import { SERVICIOS } from "@/lib/servicios";
import { ZELLE_NOMBRE, ZELLE_TELEFONO } from "@/lib/pago";

/**
 * LO QUE EL GUÍA SABE RESPONDER.
 *
 * Un guion cerrado: preguntas escritas de antemano y respuestas escritas de
 * antemano. No hay modelo detrás, no se manda nada a ningún sitio y no se
 * escribe texto libre — quien toca una pregunta recibe exactamente lo que
 * pone aquí.
 *
 * ── Por qué cerrado y no un modelo ──
 *
 * Porque esto se lo lee gente que está a semanas de una audiencia de
 * inmigración, y una respuesta inventada sobre su caso no es un fallo de
 * producto: es una persona tomando una decisión mala con información falsa.
 * Un guion no improvisa. Lo que no está aquí, no se contesta.
 *
 * ── Y no se manda a WhatsApp ──
 *
 * Henry no atiende consultas por ahí, así que ofrecer «escríbele» sería
 * mandar a alguien a esperar una respuesta que no va a llegar: peor que no
 * ofrecer nada. La salida del guion es la sesión, que es donde sí le
 * contesta —45 minutos, con las dudas apuntadas—, y eso se dice con esas
 * palabras.
 *
 * El WhatsApp sigue apareciendo en UN sitio, el pago: ahí no se pide
 * respuesta, se manda el comprobante de una transferencia que su banco no le
 * anuncia. Es un envío, no una conversación.
 *
 * ── Los cuatro, no uno ──
 *
 * La pared ofrece cuatro cosas y el guion tiene que cubrir las cuatro. Una
 * primera versión respondía de precios, pago y sesión —todo de la
 * preparación— y de los otros tres servicios sólo decía una línea: quien
 * venía por la comunidad o por el bootcamp se encontraba un guía que no
 * sabía de lo suyo.
 *
 * ── De dónde salen los datos, y dónde se acaban ──
 *
 * De donde ya vivían: los precios de las preparaciones de `lib/servicios.ts`
 * y el Zelle de `lib/pago.ts`. Los de la comunidad son los de ANDEX, $25 al
 * mes o $250 al año.
 *
 * De los servicios migratorios y del bootcamp NO hay datos en ninguna parte
 * —ni precios, ni fechas, ni qué incluye cada uno—, así que el guion dice
 * qué son, para quién son y manda a su página. Escribir aquí un precio de
 * oídas sería exactamente el fallo que este archivo existe para evitar. En
 * cuanto Henry los dé, se añaden como sub-preguntas igual que las de la
 * preparación.
 *
 * ── Lo que NO se promete ──
 *
 * Que Henry es abogado, porque no lo es, y ésa es una de las preguntas del
 * guion en vez de una nota al pie. Que la comunidad avise de las fechas
 * límite, porque esos avisos todavía no existen. Y no se dice por dónde
 * ocurre la sesión —videollamada, teléfono— porque eso aún no está decidido.
 */

export type Enlace = {
  texto: string;
  href: string;
  /** Vive en este mismo sitio: se navega sin salir. */
  interno?: boolean;
};

export type Respuesta = {
  id: string;
  /** Como lo pregunta quien lee, no como lo nombraríamos nosotros. */
  pregunta: string;
  /**
   * La misma pregunta, en el botón.
   *
   * Los botones se apilan: cinco preguntas largas ocupaban cuatro filas y en
   * un iPhone SE dejaban la conversación en dos líneas. Cortas caben en dos
   * filas y la respuesta que se acaba de leer sigue en pantalla. En la
   * conversación se escribe la larga, que es como lo diría una persona.
   */
  corto: string;
  dice: string[];
  enlaces?: Enlace[];
  /** Qué se ofrece después de ésta. Vacío = vuelve al menú entero. */
  luego?: string[];
  /**
   * El color del servicio, para el punto de su botón.
   *
   * Sólo lo llevan las cuatro que son un servicio. Es lo que ata cada botón
   * al cuadro que le corresponde en la pared: quien vio pasar la luz coral
   * por el borde de «Servicio Migratorio» reconoce el punto coral sin leer.
   * Las preguntas sueltas —el pago, la sesión— no llevan ninguno, porque no
   * son un sitio al que ir.
   */
  tono?: "agua" | "arena" | "coral" | "verde";
};

const precio = (id: string) => SERVICIOS.find((s) => s.id === id)?.precioUsd ?? 0;

/** La membresía de ANDEX. El anual son diez mensualidades, no doce. */
const ANDEX_MES = 25;
const ANDEX_ANIO = 250;

export const SALUDO =
  "Soy la guía de esta página. No soy Henry: respondo lo que él dejó escrito sobre las cuatro cosas de aquí.";

export const RESPUESTAS: Respuesta[] = [
  {
    id: "cual",
    pregunta: "¿Cuál me toca a mí?",
    corto: "¿Cuál me toca?",
    dice: [
      "Depende de en qué punto estés:",
      "Si ya tienes fecha de audiencia → la preparación con Henry.",
      "Si hay un trámite que presentar → los servicios migratorios.",
      "Si quieres acompañamiento durante el año → la comunidad.",
      "Si es para un hijo tuyo → el bootcamp.",
      "Dime cuál te suena y te cuento más.",
    ],
    /* Con «henry» al final: si ninguna de las cuatro le encaja, esta es
       justo la persona que necesita hablar con él, y sin esta salida se
       queda mirando cuatro botones que ya ha descartado. */
    luego: ["preparacion", "migratorio", "comunidad", "bootcamp", "otra"],
  },

  // ── 1 · La preparación de audiencia ────────────────────
  {
    id: "preparacion",
    pregunta: "La preparación de audiencia",
    corto: "La preparación",
    tono: "agua",
    dice: [
      "Son 45 minutos, tú y Henry, para llegar a tu audiencia sabiendo qué te van a preguntar y con tus papeles en orden.",
      `Hay tres, según qué audiencia tengas: la primera (preliminar) $${precio("primera")}, la segunda (preliminar) $${precio("segunda")} y la de mérito $${precio("tercera")}.`,
    ],
    enlaces: [{ texto: "Ver horas libres", href: "/reservar", interno: true }],
    /* Con «henry» y sin «cual»: éste es el servicio que se paga, así que la
       salida a él tiene que estar a un toque. Volver a los cuatro sigue
       estando en las tres siguientes. */
    luego: ["pago", "sesion", "abogado", "otra"],
  },
  {
    id: "pago",
    pregunta: "¿Cómo se paga?",
    corto: "¿Cómo se paga?",
    dice: [
      "La preparación se paga después de apartar la hora, no antes. Es por Zelle:",
      `${ZELLE_TELEFONO}, a nombre de ${ZELLE_NOMBRE}.`,
      "Cuando lo envíes, mándale la captura por WhatsApp. Zelle no avisa a nadie más que al banco de Henry, así que esa captura es lo que le confirma que pagaste.",
      "Esta página no te pide ni ve ningún dato de tu banco: la transferencia ocurre entera dentro de tu app bancaria.",
    ],
    luego: ["sesion", "abogado", "cual", "otra"],
  },
  {
    id: "sesion",
    pregunta: "¿Cómo es la sesión?",
    corto: "¿Cómo es?",
    dice: [
      "45 minutos, tú y Henry, sin nadie más.",
      "Las horas de la agenda son de Utah, que es donde está él. Al elegir una, la página te enseña también qué hora es donde tú estás.",
      "La cita queda apartada en cuanto la eliges. Henry te confirma.",
    ],
    enlaces: [{ texto: "Apartar mi hora", href: "/reservar", interno: true }],
    luego: ["pago", "abogado", "cual", "otra"],
  },
  {
    id: "abogado",
    pregunta: "¿Henry es abogado?",
    corto: "¿Es abogado?",
    dice: [
      "No. Henry no es abogado y esto no es asesoría legal.",
      "Lo que hace es prepararte: que llegues sabiendo qué te van a preguntar y con tus papeles en orden. Cuando tu caso necesite un abogado, te lo va a decir.",
    ],
    luego: ["preparacion", "cual", "otra"],
  },

  // ── 2 · Los trámites ───────────────────────────────────
  {
    id: "migratorio",
    pregunta: "Los servicios migratorios",
    corto: "Los trámites",
    tono: "coral",
    dice: [
      "Los trámites en sí los lleva el equipo de USALatino Prime. Es a donde vas cuando hay algo que presentar.",
      "Qué trámite te toca y cuánto cuesta lo ven ellos contigo, porque depende de tu caso: no te lo puedo decir yo desde aquí sin conocerlo.",
    ],
    enlaces: [{ texto: "Ver los servicios", href: "https://www.usalatinoprime.com/" }],
    luego: ["cual", "preparacion", "comunidad", "otra"],
  },

  // ── 3 · La comunidad ───────────────────────────────────
  {
    id: "comunidad",
    pregunta: "La comunidad Andex",
    corto: "La comunidad",
    tono: "arena",
    dice: [
      "Es la membresía para tu familia, y funciona como una app: allí guardas tus documentos, tienes la academia de inglés y los talleres en vivo de la comunidad.",
      `Cuesta $${ANDEX_MES} al mes, o $${ANDEX_ANIO} al año — que son diez mensualidades: pagando de una vez, dos meses no los pagas.`,
      "Ahora mismo funciona como piloto en Utah, en español y en inglés.",
    ],
    enlaces: [{ texto: "Ver la comunidad", href: "https://andex.usalatinoprime.com/" }],
    luego: ["cual", "preparacion", "migratorio", "otra"],
  },

  // ── 4 · El bootcamp ────────────────────────────────────
  {
    id: "bootcamp",
    pregunta: "El bootcamp para jóvenes",
    corto: "El bootcamp",
    tono: "verde",
    dice: [
      "Es para tus hijos: emprendimiento, liderazgo y transformación familiar. La edición que viene es la de 2027.",
      "Las fechas, el precio y cómo se entra están en su página, que es donde se apuntan.",
    ],
    enlaces: [
      { texto: "Ver el bootcamp", href: "https://comunidad.starbizacademy.com/bootcamp" },
    ],
    luego: ["cual", "comunidad", "preparacion", "otra"],
  },

  // ── La salida ──────────────────────────────────────────
  {
    id: "otra",
    pregunta: "Tengo otra pregunta",
    corto: "Otra pregunta",
    dice: [
      "Aquí sólo está lo que Henry dejó escrito, y tu caso no cabe en cinco respuestas.",
      "Lo que no encuentres aquí lo ve él contigo en la sesión: son 45 minutos y puedes llevar tus dudas apuntadas.",
    ],
    enlaces: [{ texto: "Ver horas libres", href: "/reservar", interno: true }],
    luego: ["cual", "preparacion", "pago"],
  },
];

/**
 * Lo que se ofrece nada más abrir: los cuatro servicios y la pregunta que
 * orienta entre ellos. Las de precio, pago y sesión no salen aquí — son de
 * la preparación, y sacarlas al menú principal es lo que hacía parecer que
 * el guía sólo sabía de un servicio.
 */
export const PRIMERAS = ["cual", "preparacion", "migratorio", "comunidad", "bootcamp"];

export function respuestaPorId(id: string): Respuesta | null {
  return RESPUESTAS.find((r) => r.id === id) ?? null;
}
