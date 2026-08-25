/**
 * LOS ESTADOS, Y LA HORA QUE SE GASTA EN CADA UNO.
 *
 * Existe por una cita perdida: alguien quiso las cuatro de la tarde SUYAS,
 * la pantalla le enseñó las cuatro de la tarde de Utah en letra grande y
 * apartó una hora que no era la que quería.
 *
 * ── Por qué el estado y no la zona ──
 *
 * Porque todo el mundo sabe en qué estado vive y casi nadie sabe en qué zona
 * horaria. «America/Denver» no significa nada para nadie, y «hora de la
 * montaña» tampoco: quien lleva dos años aquí sabe que vive en Texas, no que
 * vive en Central.
 *
 * ── Por qué algunos estados tienen dos ──
 *
 * Porque están partidos de verdad. El Paso va con Denver y Houston con
 * Chicago, aunque los dos sean Texas; Pensacola no está a la misma hora que
 * Miami. Doce estados están así, y en ésos hace falta una segunda pregunta
 * — pero SÓLO en ésos: preguntársela a quien vive en California sería
 * cobrarle a todos el problema de unos pocos.
 *
 * La segunda pregunta se hace con CIUDADES, no con nombres de zona. «¿Más
 * cerca de El Paso o de Houston?» lo contesta cualquiera; «¿Mountain o
 * Central?» no.
 *
 * ── Lo que NO hace esto ──
 *
 * Calcular la hora. Eso lo hace `Intl` con la zona IANA, que ya sabe de
 * cambios de hora y de sus excepciones — Arizona no adelanta el reloj, y esa
 * clase de detalle es justo lo que no se escribe a mano.
 */

export type Estado = {
  /** Como se llama en español, que es el idioma del sitio. */
  nombre: string;
  /**
   * Sus zonas. Una en casi todos; dos en los que están partidos.
   *
   * Cuando hay dos, la primera es la de la mayor parte de la población: si
   * alguien no contesta la segunda pregunta, esa es la apuesta menos mala.
   */
  zonas: { zona: string; donde: string }[];
};

export const ESTADOS: Estado[] = [
  { nombre: "Alabama", zonas: [{ zona: "America/Chicago", donde: "" }] },
  {
    nombre: "Alaska",
    zonas: [
      { zona: "America/Anchorage", donde: "Anchorage, Juneau" },
      { zona: "America/Adak", donde: "las islas Aleutianas" },
    ],
  },
  { nombre: "Arizona", zonas: [{ zona: "America/Phoenix", donde: "" }] },
  { nombre: "Arkansas", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "California", zonas: [{ zona: "America/Los_Angeles", donde: "" }] },
  { nombre: "Carolina del Norte", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Carolina del Sur", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Colorado", zonas: [{ zona: "America/Denver", donde: "" }] },
  { nombre: "Connecticut", zonas: [{ zona: "America/New_York", donde: "" }] },
  {
    nombre: "Dakota del Norte",
    zonas: [
      { zona: "America/Chicago", donde: "Fargo, Bismarck" },
      { zona: "America/Denver", donde: "el suroeste del estado" },
    ],
  },
  {
    nombre: "Dakota del Sur",
    zonas: [
      { zona: "America/Chicago", donde: "Sioux Falls" },
      { zona: "America/Denver", donde: "Rapid City" },
    ],
  },
  { nombre: "Delaware", zonas: [{ zona: "America/New_York", donde: "" }] },
  {
    nombre: "Florida",
    zonas: [
      { zona: "America/New_York", donde: "Miami, Orlando, Tampa" },
      { zona: "America/Chicago", donde: "Pensacola" },
    ],
  },
  { nombre: "Georgia", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Hawái", zonas: [{ zona: "Pacific/Honolulu", donde: "" }] },
  {
    nombre: "Idaho",
    zonas: [
      { zona: "America/Boise", donde: "Boise, Idaho Falls" },
      { zona: "America/Los_Angeles", donde: "Coeur d'Alene" },
    ],
  },
  { nombre: "Illinois", zonas: [{ zona: "America/Chicago", donde: "" }] },
  {
    nombre: "Indiana",
    zonas: [
      { zona: "America/Indiana/Indianapolis", donde: "Indianápolis" },
      { zona: "America/Chicago", donde: "Gary, cerca de Chicago" },
    ],
  },
  { nombre: "Iowa", zonas: [{ zona: "America/Chicago", donde: "" }] },
  {
    nombre: "Kansas",
    zonas: [
      { zona: "America/Chicago", donde: "Wichita, Kansas City" },
      { zona: "America/Denver", donde: "el extremo oeste" },
    ],
  },
  {
    nombre: "Kentucky",
    zonas: [
      { zona: "America/New_York", donde: "Lexington, Louisville" },
      { zona: "America/Chicago", donde: "Bowling Green, Paducah" },
    ],
  },
  { nombre: "Luisiana", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "Maine", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Maryland", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Massachusetts", zonas: [{ zona: "America/New_York", donde: "" }] },
  {
    nombre: "Michigan",
    zonas: [
      { zona: "America/Detroit", donde: "Detroit, Grand Rapids" },
      { zona: "America/Chicago", donde: "el extremo oeste, junto a Wisconsin" },
    ],
  },
  { nombre: "Minnesota", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "Misisipi", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "Misuri", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "Montana", zonas: [{ zona: "America/Denver", donde: "" }] },
  {
    nombre: "Nebraska",
    zonas: [
      { zona: "America/Chicago", donde: "Omaha, Lincoln" },
      { zona: "America/Denver", donde: "el oeste del estado" },
    ],
  },
  { nombre: "Nevada", zonas: [{ zona: "America/Los_Angeles", donde: "" }] },
  { nombre: "Nueva Jersey", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Nueva York", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Nuevo Hampshire", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Nuevo México", zonas: [{ zona: "America/Denver", donde: "" }] },
  { nombre: "Ohio", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Oklahoma", zonas: [{ zona: "America/Chicago", donde: "" }] },
  {
    nombre: "Oregón",
    zonas: [
      { zona: "America/Los_Angeles", donde: "Portland, Salem" },
      { zona: "America/Boise", donde: "el rincón sureste" },
    ],
  },
  { nombre: "Pensilvania", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Puerto Rico", zonas: [{ zona: "America/Puerto_Rico", donde: "" }] },
  { nombre: "Rhode Island", zonas: [{ zona: "America/New_York", donde: "" }] },
  {
    nombre: "Tennessee",
    zonas: [
      { zona: "America/Chicago", donde: "Nashville, Memphis" },
      { zona: "America/New_York", donde: "Knoxville, Chattanooga" },
    ],
  },
  {
    nombre: "Texas",
    zonas: [
      { zona: "America/Chicago", donde: "Houston, Dallas, San Antonio" },
      { zona: "America/Denver", donde: "El Paso" },
    ],
  },
  { nombre: "Utah", zonas: [{ zona: "America/Denver", donde: "" }] },
  { nombre: "Vermont", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Virginia", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Virginia Occidental", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Washington", zonas: [{ zona: "America/Los_Angeles", donde: "" }] },
  { nombre: "Washington D. C.", zonas: [{ zona: "America/New_York", donde: "" }] },
  { nombre: "Wisconsin", zonas: [{ zona: "America/Chicago", donde: "" }] },
  { nombre: "Wyoming", zonas: [{ zona: "America/Denver", donde: "" }] },
];

/** El que se ofrece primero cuando no se pudo adivinar nada. */
export const ESTADO_DE_HENRY = "Utah";

export function estadoPorNombre(nombre: string): Estado | null {
  return ESTADOS.find((e) => e.nombre === nombre) ?? null;
}

/**
 * A qué estado apunta una zona horaria.
 *
 * Sirve para PRERRELLENAR el selector con lo que dijo el navegador, no para
 * decidir por nadie: una zona cubre muchos estados —`America/Chicago` va de
 * Texas a Minnesota— así que esto acierta el reloj y no el sitio. Por eso lo
 * que se elige a mano siempre gana.
 *
 * Se prefiere el estado cuya PRIMERA zona coincide: con `America/Chicago`,
 * Texas antes que Florida, porque en Florida esa zona es la del rincón y en
 * Texas la de casi todo el mundo.
 */
export function estadoProbable(zona: string | null | undefined): Estado | null {
  if (!zona) return null;
  return (
    ESTADOS.find((e) => e.zonas[0]?.zona === zona) ??
    ESTADOS.find((e) => e.zonas.some((z) => z.zona === zona)) ??
    null
  );
}
