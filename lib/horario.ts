/**
 * EL HORARIO, EN CÓDIGO.
 *
 * Las sesiones duran 45 minutos y empiezan en punto, en la hora de Utah.
 *
 * ── El horario ya no está escrito aquí ──
 *
 * Antes estaba: «lunes a viernes de 8 a 17, sábado de 8 a 13», en una
 * constante. Ahora vive en la tabla `horario` de la base y llega a estas
 * funciones como una lista de TRAMOS, porque Henry tiene que poder cambiarlo
 * sin que nadie toque el código.
 *
 * Un tramo es `[desdeHora, hastaHora)` — la hora de cierre no se ofrece. Un
 * día puede tener varios, y ésa es justo la gracia: «de 8 a 1 y de 3 a 5»
 * son dos tramos con un agujero en medio, que es lo que no se podía decir
 * con una hora de apertura y otra de cierre.
 *
 * ── Por qué el parámetro va al final y tiene valor por defecto ──
 *
 * Para que estas funciones sigan siendo puras y comprobables sin base de
 * datos. Las pruebas pasan los tramos que quieren; el sitio pasa los de la
 * base. `HORARIO_POR_DEFECTO` es la red de un despliegue sin base conectada,
 * no la fuente de verdad.
 *
 * ── Por qué esto está duplicado en la base ──
 *
 * `dentro_del_horario()` en `0002_horario.sql` responde a la misma pregunta.
 * No es un descuido: este archivo decide QUÉ SE PINTA y aquella función
 * decide QUÉ SE ACEPTA. Cualquiera con la clave pública puede llamar a la
 * API sin pasar por esta pantalla; si el horario viviera sólo aquí, apartar
 * el domingo a las tres de la mañana sería una petición hecha a mano.
 * Ahora las dos leen los mismos tramos, así que ya no pueden discrepar.
 *
 * ── Por qué no hay librería de fechas ──
 *
 * Todo lo que hace falta es convertir entre «las 11:00 en Utah» y un
 * instante. `Intl` ya sabe de zonas horarias y de cambios de hora, y una
 * dependencia más en una landing que este público abre con datos contados no
 * se paga sola.
 */

/** La zona donde vive el horario. Utah, con su cambio de hora incluido. */
export const ZONA = "America/Denver";

/** Cuánto dura una sesión. */
export const MINUTOS_SESION = 45;

/**
 * Un rato abierto de un día de la semana.
 *
 * `diaSemana` en ISO: 1 = lunes … 7 = domingo, igual que `extract(isodow)`
 * en Postgres, para que no haya que traducir en la frontera.
 */
export type Tramo = {
  diaSemana: number;
  desdeHora: number;
  hastaHora: number;
};

/**
 * El horario con el que arranca la base, y el que se usa si no hay base.
 *
 * No es la fuente de verdad: la fuente de verdad es la tabla `horario`. Esto
 * existe para que un despliegue sin variables configuradas enseñe un horario
 * creíble en vez de una pantalla vacía, y para que las pruebas tengan algo
 * con lo que empezar.
 */
export const HORARIO_POR_DEFECTO: readonly Tramo[] = [
  { diaSemana: 1, desdeHora: 8, hastaHora: 17 },
  { diaSemana: 2, desdeHora: 8, hastaHora: 17 },
  { diaSemana: 3, desdeHora: 8, hastaHora: 17 },
  { diaSemana: 4, desdeHora: 8, hastaHora: 17 },
  { diaSemana: 5, desdeHora: 8, hastaHora: 17 },
  { diaSemana: 6, desdeHora: 8, hastaHora: 13 },
];

/**
 * Las horas de inicio que ofrece un día de la semana, ordenadas.
 *
 * Sin repetidos y en orden a propósito: si dos tramos se pisaran —la base lo
 * impide, pero estas funciones también las llaman las pruebas y el modo sin
 * base— una hora repetida pintaría dos botones para el mismo hueco.
 */
export function horasDelDiaSemana(
  diaSemana: number,
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): number[] {
  const horas = new Set<number>();
  for (const t of tramos) {
    if (t.diaSemana !== diaSemana) continue;
    for (let h = t.desdeHora; h < t.hastaHora; h += 1) horas.add(h);
  }
  return [...horas].sort((a, b) => a - b);
}

const PARTES = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export type PartesLocales = {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
  /** 1 = lunes … 7 = domingo. */
  diaSemana: number;
};

/** Descompone un instante en la hora de pared de Utah. */
export function partesEnZona(instante: Date): PartesLocales {
  const p: Record<string, string> = {};
  for (const parte of PARTES.formatToParts(instante)) {
    if (parte.type !== "literal") p[parte.type] = parte.value;
  }
  const anio = Number(p.year);
  const mes = Number(p.month);
  const dia = Number(p.day);
  /* `hour12: false` devuelve «24» a medianoche en algunos motores. Se
     normaliza a 0 o el día siguiente empieza a las 24. */
  const hora = Number(p.hour) % 24;

  /* El día de la semana se calcula sobre la fecha local ya resuelta, no
     sobre el instante: a las 23:00 de Utah en UTC ya es el día siguiente. */
  const diaJs = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();

  return {
    anio,
    mes,
    dia,
    hora,
    minuto: Number(p.minute),
    diaSemana: diaJs === 0 ? 7 : diaJs,
  };
}

/** Milisegundos que hay que sumar a UTC para obtener la hora de pared. */
function desfase(instante: Date): number {
  const p = partesEnZona(instante);
  const comoSiFueraUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, 0);
  return comoSiFueraUtc - Math.floor(instante.getTime() / 1000) * 1000;
}

/**
 * «Las 11:00 del 20 de agosto en Utah» → el instante que le corresponde.
 *
 * Se resuelve en dos pasadas porque el desfase depende de la fecha y la
 * fecha depende del desfase. La primera estima, la segunda corrige — que es
 * lo único que hace falta salvo en las dos horas al año del cambio.
 */
export function instanteEnZona(
  anio: number,
  mes: number,
  dia: number,
  hora: number,
): Date {
  const tentativo = Date.UTC(anio, mes - 1, dia, hora, 0, 0);
  const primera = new Date(tentativo - desfase(new Date(tentativo)));
  return new Date(tentativo - desfase(primera));
}

/** El día de la semana ISO (1 = lunes … 7 = domingo) de una fecha. */
export function diaSemanaDe(anio: number, mes: number, dia: number): number {
  const diaJs = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return diaJs === 0 ? 7 : diaJs;
}

/** Los huecos que ofrece un día, en instantes. Vacío si está cerrado. */
export function huecosDelDia(
  anio: number,
  mes: number,
  dia: number,
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): Date[] {
  return horasDelDiaSemana(diaSemanaDe(anio, mes, dia), tramos).map((h) =>
    instanteEnZona(anio, mes, dia, h),
  );
}

/** ¿Este instante cae dentro del horario? El espejo del portero de la base. */
export function dentroDelHorario(
  instante: Date,
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): boolean {
  const p = partesEnZona(instante);
  if (p.minuto !== 0) return false;
  return horasDelDiaSemana(p.diaSemana, tramos).includes(p.hora);
}

export type Dia = {
  /** `2026-08-20`, la fecha local de Utah. Sirve de clave estable. */
  clave: string;
  anio: number;
  mes: number;
  dia: number;
  diaSemana: number;
  huecos: Date[];
};

export function clave(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Los próximos días con huecos, a partir de un instante.
 *
 * Devuelve días ABIERTOS: los cerrados no se pintan como «sin horas», se
 * saltan. Enseñar un día vacío obliga a tocarlo para descubrir que no hay
 * nada, y esta pantalla existe para ahorrar toques.
 */
export function proximosDias(
  desde: Date,
  cuantos = 6,
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): Dia[] {
  const dias: Dia[] = [];
  const p = partesEnZona(desde);
  let cursor = Date.UTC(p.anio, p.mes - 1, p.dia);

  /* Tope de 21 iteraciones: seis días abiertos caben de sobra en tres
     semanas, y un bucle sin freno en el servidor es un incidente. Con el
     horario en manos de Henry esto pasa de precaución a necesidad: si un día
     cierra la semana entera, sin tope el bucle no pararía nunca. */
  for (let i = 0; i < 21 && dias.length < cuantos; i += 1) {
    const d = new Date(cursor);
    const anio = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const huecos = huecosDelDia(anio, mes, dia, tramos).filter((h) => h > desde);

    if (huecos.length > 0) {
      dias.push({
        clave: clave(anio, mes, dia),
        anio,
        mes,
        dia,
        diaSemana: diaSemanaDe(anio, mes, dia),
        huecos,
      });
    }
    cursor += 24 * 60 * 60 * 1000;
  }

  return dias;
}

/**
 * TODOS los días de una ventana, abiertos y cerrados, a partir de un instante.
 *
 * Es la fuente del calendario de mes de la pantalla de reserva, y por eso se
 * parece a `semanaDesde()` y no a `proximosDias()`: los cerrados también
 * salen, con la lista de huecos vacía, para que la rejilla pueda pintarlos
 * apagados en su casilla. Saltárselos —lo que hace `proximosDias()`— deja un
 * mes con agujeros que no se entienden.
 *
 * ── Por qué existe además de `proximosDias()` ──
 *
 * Porque aquélla busca «los próximos N con horas» y para a los 21 días. Con
 * eso, alguien que quería el día 10 no tenía forma de llegar: pasó de verdad.
 * Aquí la ventana es fija en DÍAS y no en «días abiertos», así que el 10 está
 * siempre donde se espera.
 *
 * El tope de días lo pone quien llama, y en la práctica es el mismo que
 * impone `horas_ocupadas()` en la base: sesenta. Pedir más aquí no serviría
 * de nada, porque la ocupación no llegaría.
 */
export function diasEnRango(
  desde: Date,
  cuantosDias: number,
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): Dia[] {
  const dias: Dia[] = [];
  const p = partesEnZona(desde);
  let cursor = Date.UTC(p.anio, p.mes - 1, p.dia);

  for (let i = 0; i < cuantosDias; i += 1) {
    const d = new Date(cursor);
    const anio = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();

    dias.push({
      clave: clave(anio, mes, dia),
      anio,
      mes,
      dia,
      diaSemana: diaSemanaDe(anio, mes, dia),
      /* Las horas que ya pasaron hoy no se ofrecen. Un día abierto cuyas
         horas pasaron todas queda con la lista vacía, igual que un cerrado:
         para quien reserva es lo mismo. */
      huecos: huecosDelDia(anio, mes, dia, tramos).filter((h) => h > desde),
    });
    cursor += 24 * 60 * 60 * 1000;
  }

  return dias;
}

/**
 * Los días de una semana, desde su lunes.
 *
 * Los días CERRADOS también salen, al revés que en `proximosDias()`. Es la
 * diferencia entre las dos pantallas: quien reserva no quiere ver días
 * vacíos, y Henry sí — un día cerrado es información para él, y además es
 * donde tiene que tocar para reabrirlo.
 *
 * El domingo sólo aparece si tiene tramos: una columna vacía fija robaría
 * una séptima parte del ancho para no decir nada.
 */
export function semanaDesde(
  lunes: { anio: number; mes: number; dia: number },
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): Dia[] {
  const dias: Dia[] = [];
  let cursor = Date.UTC(lunes.anio, lunes.mes - 1, lunes.dia);

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(cursor);
    const anio = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const diaSemana = diaSemanaDe(anio, mes, dia);

    if (diaSemana !== 7 || horasDelDiaSemana(7, tramos).length > 0) {
      dias.push({
        clave: clave(anio, mes, dia),
        anio,
        mes,
        dia,
        diaSemana,
        huecos: huecosDelDia(anio, mes, dia, tramos),
      });
    }
    cursor += 24 * 60 * 60 * 1000;
  }

  return dias;
}

/** El lunes de la semana en la que cae un instante, en fecha de Utah. */
export function lunesDe(instante: Date): { anio: number; mes: number; dia: number } {
  const p = partesEnZona(instante);
  const utc = Date.UTC(p.anio, p.mes - 1, p.dia) - (p.diaSemana - 1) * 86_400_000;
  const d = new Date(utc);
  return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() };
}

/** Suma días a una fecha de calendario, sin pasar por instantes. */
export function sumaDias(
  fecha: { anio: number; mes: number; dia: number },
  cuantos: number,
): { anio: number; mes: number; dia: number } {
  const d = new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia) + cuantos * 86_400_000);
  return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1, dia: d.getUTCDate() };
}

/**
 * Todas las horas que abarca el horario, para pintar las filas de la rejilla.
 *
 * La rejilla del panel necesita una fila por hora aunque ese día concreto no
 * la ofrezca: si el lunes abre a las 8 y el sábado a las 10, la fila de las
 * 8 tiene que existir para que el lunes tenga dónde ponerse.
 */
export function franjaDeHoras(
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): number[] {
  if (tramos.length === 0) return [];
  const min = Math.min(...tramos.map((t) => t.desdeHora));
  const max = Math.max(...tramos.map((t) => t.hastaHora));
  const horas: number[] = [];
  for (let h = min; h < max; h += 1) horas.push(h);
  return horas;
}

/**
 * «11:00» en la hora de Utah — o en la zona que se le pase.
 *
 * El cero de la izquierda se quita a mano y no se deja al formateador: con
 * `hour12: false` unos ICU devuelven «8:00» y otros «08:00», así que la
 * misma hora se escribía distinta según dónde corriera el servidor. Lo cazó
 * una prueba, no la revisión.
 */
export function horaEnZona(instante: Date, zona: string = ZONA): string {
  const crudo = new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instante);
  return crudo.replace(/^0/, "").replace(/^24:/, "0:");
}

/**
 * La hora en la zona de quien reservó, para el panel de Henry.
 *
 * Devuelve `null` cuando no hay nada que añadir: si no se guardó la zona, si
 * el dato no es una zona válida, o si esa persona está a la misma hora que
 * Utah. Repetir «11:00 · 11:00» hace dudar de si el sitio se equivocó, y
 * ésa es justo la duda que esta función existe para evitar.
 *
 * El `try` no es paranoia: la zona la manda un navegador, y `Intl` lanza una
 * excepción con cualquier cadena que no reconozca. Sin él, un dato raro en
 * una fila tumbaría la pantalla entera del panel.
 */
export function horaDeQuienReserva(
  instante: Date,
  zona: string | null | undefined,
): string | null {
  if (!zona || zona === ZONA) return null;
  try {
    const suya = horaEnZona(instante, zona);
    return suya === horaEnZona(instante) ? null : suya;
  } catch {
    return null;
  }
}

/** «11:00» a partir del número de hora, sin pasar por un instante. */
export function horaSuelta(hora: number): string {
  return `${hora}:00`;
}

/** «jueves 20 de agosto», en la zona que se le pase. */
export function fechaLarga(instante: Date, zona: string = ZONA): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(instante);
}

/** «20 de agosto», sin el día de la semana. */
export function fechaCorta(instante: Date, zona: string = ZONA): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    day: "numeric",
    month: "long",
  }).format(instante);
}

/** Abreviatura del día: «JUE». */
export function diaCorto(instante: Date, zona: string = ZONA): string {
  return new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "short" })
    .format(instante)
    .replace(".", "")
    .toUpperCase();
}

const NOMBRES_DIA = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
];

/** «lunes», «martes»… para la pantalla del horario. */
export function nombreDiaSemana(diaSemana: number): string {
  return NOMBRES_DIA[diaSemana - 1] ?? "";
}

const PLURALES = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
  "domingos",
];

/**
 * El horario dicho en una frase: «De lunes a viernes, de 8:00 a 13:00 y de
 * 15:00 a 17:00. Los sábados, de 8:00 a 13:00.»
 *
 * Existe porque ese texto estaba escrito a mano al pie de la pantalla de
 * reserva, y en cuanto Henry cambie sus horas pasaría a ser una promesa
 * falsa publicada. Un horario que se puede cambiar tiene que contarse solo.
 *
 * Los días con los MISMOS tramos se agrupan, y si además son seguidos se
 * dicen como un rango. Así «lunes, martes, miércoles, jueves y viernes» no
 * ocupa una línea entera para decir «de lunes a viernes».
 */
export function describirHorario(
  tramos: readonly Tramo[] = HORARIO_POR_DEFECTO,
): string {
  const firmas = new Map<number, string>();
  for (let d = 1; d <= 7; d += 1) {
    const suyos = tramos
      .filter((t) => t.diaSemana === d)
      .sort((a, b) => a.desdeHora - b.desdeHora)
      .map((t) => `${t.desdeHora}-${t.hastaHora}`)
      .join(",");
    if (suyos) firmas.set(d, suyos);
  }

  if (firmas.size === 0) return "";

  /* Los días seguidos con la misma firma se juntan en un bloque. */
  const bloques: { dias: number[]; firma: string }[] = [];
  for (const [dia, firma] of [...firmas.entries()].sort((a, b) => a[0] - b[0])) {
    const ultimo = bloques.at(-1);
    if (ultimo && ultimo.firma === firma && ultimo.dias.at(-1) === dia - 1) {
      ultimo.dias.push(dia);
    } else {
      bloques.push({ dias: [dia], firma });
    }
  }

  return bloques
    .map((b) => `${nombresDe(b.dias)}, ${horasDe(b.firma)}.`)
    .join(" ");
}

function nombresDe(dias: number[]): string {
  if (dias.length === 1) return `Los ${PLURALES[dias[0] - 1]}`;
  if (dias.length === 2) {
    return `Los ${PLURALES[dias[0] - 1]} y los ${PLURALES[dias[1] - 1]}`;
  }
  /* Tres o más seguidos: un rango. «De lunes a viernes» usa el singular. */
  return `De ${NOMBRES_DIA[dias[0] - 1]} a ${NOMBRES_DIA[dias.at(-1)! - 1]}`;
}

function horasDe(firma: string): string {
  const partes = firma.split(",").map((p) => {
    const [d, h] = p.split("-").map(Number);
    return `de ${horaSuelta(d)} a ${horaSuelta(h)}`;
  });
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/**
 * El desfase de un sitio respecto a Utah, en horas, para un instante dado.
 *
 * Positivo si van por delante —Carolina del Sur, +2—, negativo si van por
 * detrás —California, −1—, cero si están a la misma hora.
 *
 * ── Por qué hace falta el instante ──
 *
 * Porque el desfase NO es una propiedad del sitio: cambia con el calendario.
 * Arizona está a la misma hora que Utah en invierno y una hora por detrás en
 * verano, porque Utah adelanta el reloj y Arizona no. Calcularlo «una vez
 * por estado» daría el número equivocado media parte del año.
 *
 * ── Por qué no se resta con `getTimezoneOffset` ──
 *
 * Porque ése es el desfase del NAVEGADOR, no el de una zona cualquiera. Aquí
 * hay que comparar dos zonas entre sí y ninguna de las dos tiene por qué ser
 * la del aparato. Se hace formateando el mismo instante en cada una y
 * midiendo cuánto se separan las dos lecturas.
 */
function minutosDeZona(instante: Date, zona: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instante);

  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? "0");
  /* `hour` puede venir como 24 a medianoche en algunos entornos: el módulo lo
     devuelve a 0 antes de que se convierta en un día de más. */
  const comoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour") % 24, v("minute"));
  return (comoUtc - instante.getTime()) / 60000;
}

export function desfaseConUtah(instante: Date, zona: string | null | undefined): number {
  if (!zona) return 0;
  try {
    return (minutosDeZona(instante, zona) - minutosDeZona(instante, ZONA)) / 60;
  } catch {
    /* La zona la manda un navegador o una tabla: si no es válida, mejor decir
       que no hay diferencia que romper la pantalla de reservas. */
    return 0;
  }
}
