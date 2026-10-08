import { AUDIENCIAS } from "@/lib/servicios";
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
   * Sólo lo llevan las que son un servicio. Es lo que ata cada botón
   * al cuadro que le corresponde en la pared: quien vio pasar la luz coral
   * por el borde de «Servicio Migratorio» reconoce el punto coral sin leer.
   * Las preguntas sueltas —el pago, la sesión— no llevan ninguno, porque no
   * son un sitio al que ir.
   */
  tono?: "agua" | "arena" | "coral" | "verde";
};

export const SALUDO =
  "Soy la guía de esta página. No soy Henry: respondo lo que él dejó escrito sobre los servicios de aquí.";

export const RESPUESTAS: Respuesta[] = [
  {
    id: "cual",
    pregunta: "¿Cuál me toca a mí?",
    corto: "¿Cuál me toca?",
    dice: [
      "Depende de en qué punto estés:",
      "Si tienes una audiencia → La ruta del inmigrante: ahí eliges tu preparación con Henry y su hora.",
      "Si hay un trámite que presentar → los servicios migratorios.",
      "Dime cuál te suena y te cuento más.",
    ],
    /* Con «otra» al final: si ninguno le encaja, esta es justo la persona
       que necesita hablar con Henry, y sin esta salida se queda mirando
       botones que ya ha descartado. */
    luego: ["ruta", "migratorio", "otra"],
  },

  // ── 1 · La ruta del inmigrante: la preparación de audiencia ──
  {
    id: "ruta",
    pregunta: "La ruta del inmigrante",
    corto: "La ruta",
    tono: "arena",
    dice: [
      "Es el espacio de Henry para preparar tu audiencia: 45 minutos uno a uno.",
      ...AUDIENCIAS.map(
        (s) => `${s.nombre} (${s.etapa}): $${s.precioUsd} USD.`,
      ),
      "En su web eliges la que vas a preparar y ves sus horas libres.",
    ],
    enlaces: [
      { texto: "Ir a La ruta del inmigrante", href: "/", interno: true },
      ...AUDIENCIAS.map((s) => ({
        texto: `${s.nombre} · $${s.precioUsd}`,
        href: `/reservar?servicio=${s.id}`,
        interno: true,
      })),
    ],
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
    luego: ["ruta", "cual", "otra"],
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
      { texto: "Ver los servicios", href: "https://landing.contygo.app" },
    ],
    luego: ["cual", "ruta", "otra"],
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
    luego: ["cual", "ruta", "pago"],
  },
];

/**
 * Lo que se ofrece nada más abrir: los servicios de la pared y la pregunta que
 * orienta entre ellos. Las de precio, pago y sesión no salen aquí — son de
 * la preparación, y sacarlas al menú principal es lo que hacía parecer que
 * el guía sólo sabía de un servicio.
 */
export const PRIMERAS = ["cual", "ruta", "migratorio"];

export function respuestaPorId(id: string): Respuesta | null {
  return RESPUESTAS.find((r) => r.id === id) ?? null;
}
