/**
 * LOS TRES PUNTOS DE PARTIDA DE LA ASESORÍA.
 *
 * Viven aquí y no en la portada porque los usan dos pantallas: la portada
 * los enseña, y la reserva deja elegir uno para que Henry sepa por dónde
 * empezar. El `id` es lo que viaja en `/reservar?tema=…`.
 *
 * Son una categoría, no el caso: quien reserva no cuenta aquí su situación
 * ni manda documentos, y eso es a propósito.
 */
export type Tema = {
  id: "orden" | "opciones" | "dudas";
  /** En primera persona: así se elige en la reserva y así le llega a Henry. */
  titulo: string;
  /** La pestaña de la portada en el teléfono, donde no cabe el título. */
  corto: string;
  etiqueta: string;
  frase: string;
  texto: string;
  nota: string;
};

export const TEMAS: Tema[] = [
  {
    id: "orden",
    titulo: "No sé por dónde empezar.",
    corto: "Empezar",
    etiqueta: "PONER ORDEN",
    frase: "No hace falta tener todas las respuestas.",
    texto:
      "Podemos empezar por lo que hoy te preocupa. Un espacio para poner tus preguntas sobre la mesa y entender qué necesitas aclarar primero.",
    nota: "Tu punto de partida también merece tiempo.",
  },
  {
    id: "opciones",
    titulo: "Quiero mirar mis opciones.",
    corto: "Mis opciones",
    etiqueta: "GANAR PERSPECTIVA",
    frase: "Dale espacio a lo que viene.",
    texto:
      "Conversa sobre tu situación y tus prioridades. Ordena tus ideas con Henry y habla de los próximos pasos que quieres explorar.",
    nota: "Una conversación centrada en tu momento.",
  },
  {
    id: "dudas",
    titulo: "Tengo preguntas concretas.",
    corto: "Mis dudas",
    etiqueta: "CONVERSARLO CONTIGO",
    frase: "Trae eso que te da vueltas.",
    texto:
      "Anota tus dudas y dedica la sesión a lo que más te importa. Si tu situación necesita atención especializada, conversa sobre a quién acudir.",
    nota: "Tus preguntas marcan la conversación.",
  },
];

export function temaPorId(id: string | null | undefined): Tema | null {
  return TEMAS.find((t) => t.id === id) ?? null;
}
