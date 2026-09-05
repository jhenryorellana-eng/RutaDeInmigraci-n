import { ASESORIA, AUDIENCIAS } from "@/lib/servicios";
import { ZELLE_NOMBRE, ZELLE_TELEFONO } from "@/lib/pago";

/** Respuestas predefinidas del directorio de proyectos. Los precios de la asesoría se leen del catálogo. */

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

/** La membresía de ANDEX. El anual son diez mensualidades, no doce. */
const ANDEX_MES = 25;
const ANDEX_ANIO = 250;

export const SALUDO =
  "Soy la guía de esta página. No soy Henry: respondo lo que él dejó escrito sobre los servicios de aquí.";

export const RESPUESTAS: Respuesta[] = [
  {
    id: "cual",
    pregunta: "¿Cuál me toca a mí?",
    corto: "¿Cuál me toca?",
    dice: [
      "Depende de en qué punto estés:",
      "Si tienes una audiencia → la preparación de primera, segunda o tercera audiencia.",
      "Si quieres conversar sobre tus dudas → la asesoría con Henry.",
      "Si hay un trámite que presentar → los servicios migratorios.",
      "Si quieres acompañamiento durante el año → la comunidad.",
      "Si es para un hijo tuyo → el bootcamp.",
      "Dime cuál te suena y te cuento más.",
    ],
    /* Con «henry» al final: si ninguna de las cuatro le encaja, esta es
       justo la persona que necesita hablar con él, y sin esta salida se
       queda mirando cuatro botones que ya ha descartado. */
    luego: [
      "preparacion",
      "asesoria",
      "migratorio",
      "comunidad",
      "bootcamp",
      "otra",
    ],
  },

  // ── 1 · La preparación de audiencia ────────────────────
  {
    id: "preparacion",
    pregunta: "La preparación de audiencia",
    corto: "Las audiencias",
    tono: "agua",
    dice: [
      "Son 45 minutos uno a uno con Henry para preparar tu audiencia.",
      ...AUDIENCIAS.map(
        (s) => `${s.nombre} (${s.etapa}): $${s.precioUsd} USD.`,
      ),
      "Elige la audiencia que necesitas preparar. La asesoría personalizada es otro servicio.",
    ],
    enlaces: AUDIENCIAS.map((s) => ({
      texto: `${s.nombre} · $${s.precioUsd}`,
      href: `/reservar?servicio=${s.id}`,
      interno: true,
    })),
    luego: ["pago", "sesion", "abogado", "asesoria", "otra"],
  },
  {
    id: "asesoria",
    pregunta: "La asesoría personalizada",
    corto: "La asesoría",
    tono: "agua",
    dice: [
      "Son 45 minutos, tú y Henry, para conversar sobre tus dudas, ordenar tus prioridades y orientar tu próximo paso.",
      `La asesoría personalizada cuesta $${ASESORIA.precioUsd} USD por sesión. No necesitas tener una audiencia programada.`,
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
      "Primero eliges una hora y completas tus datos. Después pagas con los métodos disponibles en la reserva. Para Zelle, los datos son:",
      `${ZELLE_TELEFONO}, a nombre de ${ZELLE_NOMBRE}.`,
      "Incluye el código de tu solicitud en el pago. Puedes enviar el comprobante por WhatsApp para facilitar su revisión.",
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
      "Seleccionar una hora no la bloquea. La reserva se confirma al verificar el pago y la disponibilidad; Henry te contacta por WhatsApp.",
    ],
    enlaces: [
      { texto: "Ver todos los servicios", href: "/links", interno: true },
    ],
    luego: ["pago", "abogado", "cual", "otra"],
  },
  {
    id: "abogado",
    pregunta: "¿Henry es abogado?",
    corto: "¿Es abogado?",
    dice: [
      "No. Henry no es abogado y esto no es asesoría legal.",
      "La sesión ofrece orientación personal. Para cuestiones legales o representación, consulta a un profesional autorizado.",
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
    enlaces: [
      { texto: "Ver los servicios", href: "https://www.usalatinoprime.com/" },
    ],
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
    enlaces: [
      { texto: "Ver la comunidad", href: "https://andex.usalatinoprime.com/" },
    ],
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
      {
        texto: "Ver el bootcamp",
        href: "https://comunidad.starbizacademy.com/bootcamp",
      },
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
export const PRIMERAS = [
  "cual",
  "preparacion",
  "asesoria",
  "migratorio",
  "comunidad",
  "bootcamp",
];

export function respuestaPorId(id: string): Respuesta | null {
  return RESPUESTAS.find((r) => r.id === id) ?? null;
}
