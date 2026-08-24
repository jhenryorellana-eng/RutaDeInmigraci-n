import { SERVICIOS } from "@/lib/servicios";
import { WHATSAPP_HENRY, ZELLE_NOMBRE, ZELLE_TELEFONO } from "@/lib/pago";

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
 * Un guion no improvisa. Lo que no está aquí, no se contesta — se manda a
 * Henry.
 *
 * ── De dónde salen los datos ──
 *
 * De donde ya vivían: los precios de `lib/servicios.ts`, el Zelle de
 * `lib/pago.ts`. Escritos otra vez a mano aquí, se quedarían viejos el día
 * que cambie un precio y nadie se acordaría de esta pantalla.
 *
 * ── Lo que NO se promete ──
 *
 * Que Henry es abogado, porque no lo es, y ésa es una de las preguntas del
 * guion en vez de una nota al pie. Y no se dice por dónde ocurre la sesión
 * —videollamada, teléfono— porque eso todavía no está decidido, y escribirlo
 * aquí sería inventárselo.
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
  dice: string[];
  enlaces?: Enlace[];
  /** Qué se ofrece después de esta. Vacío = vuelve al menú entero. */
  luego?: string[];
};

const precio = (id: string) => SERVICIOS.find((s) => s.id === id)?.precioUsd ?? 0;

export const SALUDO =
  "Soy la guía de esta página. No soy Henry — respondo lo que ya sé, y para lo demás te paso con él.";

export const RESPUESTAS: Respuesta[] = [
  {
    id: "cual",
    pregunta: "¿Cuál de los cuatro me toca?",
    dice: [
      "Depende de en qué punto estés:",
      "Si ya tienes fecha de audiencia, la preparación con Henry.",
      "Si lo que quieres es acompañamiento durante el año —tus documentos, tus fechas, gente en tu misma situación—, la comunidad.",
      "Si hay algo que presentar, los servicios migratorios.",
      "Y si es para un hijo tuyo, el bootcamp.",
    ],
    enlaces: [{ texto: "Ver las preparaciones", href: "/reservar", interno: true }],
    luego: ["precio", "sesion", "henry"],
  },
  {
    id: "precio",
    pregunta: "¿Cuánto cuesta?",
    dice: [
      `Hay tres preparaciones y cada una cuesta distinto: la primera audiencia (preliminar) $${precio("primera")}, la segunda (preliminar) $${precio("segunda")} y la de mérito $${precio("tercera")}.`,
      "Las tres duran lo mismo, 45 minutos, y comparten la misma agenda: la hora que apartes queda tuya en cualquier caso.",
    ],
    enlaces: [{ texto: "Apartar mi hora", href: "/reservar", interno: true }],
    luego: ["pago", "sesion", "henry"],
  },
  {
    id: "pago",
    pregunta: "¿Cómo se paga?",
    dice: [
      "Se paga después de apartar la hora, no antes. Es por Zelle:",
      `${ZELLE_TELEFONO}, a nombre de ${ZELLE_NOMBRE}.`,
      "Cuando lo envíes, mándale la captura por WhatsApp. Zelle no avisa a nadie más que al banco de Henry, así que esa captura es lo que le confirma que pagaste.",
      "Esta página no te pide ni ve ningún dato de tu banco. La transferencia ocurre entera dentro de tu app bancaria.",
    ],
    luego: ["precio", "sesion", "henry"],
  },
  {
    id: "sesion",
    pregunta: "¿Cómo es la sesión?",
    dice: [
      "45 minutos, tú y Henry, sin nadie más.",
      "Las horas que ves en la agenda son de Utah, que es donde está él. Al elegir hora, la página te enseña también qué hora es donde tú estás, para que no haya confusión.",
      "La cita queda apartada en cuanto la eliges. Henry te confirma.",
    ],
    enlaces: [{ texto: "Ver horas libres", href: "/reservar", interno: true }],
    luego: ["pago", "abogado", "henry"],
  },
  {
    id: "abogado",
    pregunta: "¿Henry es abogado?",
    dice: [
      "No. Henry no es abogado y esto no es asesoría legal.",
      "Lo que hace es prepararte: que llegues sabiendo qué te van a preguntar y con tus papeles en orden. Cuando tu caso necesite un abogado, te lo va a decir.",
    ],
    luego: ["cual", "sesion", "henry"],
  },
  {
    id: "henry",
    pregunta: "Quiero hablar con Henry",
    dice: [
      "Te paso con él por WhatsApp. Es su número de verdad, el mismo del Zelle.",
      "Escríbele lo que necesites; te contesta él, no yo.",
    ],
    enlaces: [{ texto: "Escribirle por WhatsApp", href: `https://wa.me/${WHATSAPP_HENRY}` }],
    luego: [],
  },
];

/** Lo que se ofrece nada más abrir. El orden es el de la duda más común. */
export const PRIMERAS = ["cual", "precio", "sesion", "pago", "abogado"];

export function respuestaPorId(id: string): Respuesta | null {
  return RESPUESTAS.find((r) => r.id === id) ?? null;
}
