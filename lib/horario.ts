/**
 * EL HORARIO, EN CÓDIGO.
 *
 * Lunes a viernes de 8:00 a 17:00 y sábados de 8:00 a 13:00, hora de Utah.
 * Las sesiones duran 45 minutos y empiezan en punto, así que la última entre
 * semana empieza a las 16:00 y el sábado a las 12:00.
 *
 * ── Por qué esto está duplicado en la base de datos ──
 *
 * `dentro_del_horario()` en `0001_citas.sql` dice exactamente lo mismo. No es
 * un descuido: este archivo decide QUÉ SE PINTA y aquella función decide QUÉ
 * SE ACEPTA. Cualquiera con la clave pública puede llamar a la API sin pasar
 * por esta pantalla; si el horario viviera sólo aquí, apartar el domingo a
 * las tres de la mañana sería una petición hecha a mano.
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

/** Horas de inicio, por día de la semana ISO (1 = lunes … 7 = domingo). */
const HORAS_POR_DIA: Record<number, readonly number[]> = {
  1: [8, 9, 10, 11, 12, 13, 14, 15, 16],
  2: [8, 9, 10, 11, 12, 13, 14, 15, 16],
  3: [8, 9, 10, 11, 12, 13, 14, 15, 16],
  4: [8, 9, 10, 11, 12, 13, 14, 15, 16],
  5: [8, 9, 10, 11, 12, 13, 14, 15, 16],
  6: [8, 9, 10, 11, 12],
  7: [],
};

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

/** Los huecos que ofrece un día, en instantes. Vacío si está cerrado. */
export function huecosDelDia(anio: number, mes: number, dia: number): Date[] {
  const diaJs = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  const diaSemana = diaJs === 0 ? 7 : diaJs;
  return (HORAS_POR_DIA[diaSemana] ?? []).map((h) =>
    instanteEnZona(anio, mes, dia, h),
  );
}

/** ¿Este instante cae dentro del horario? El espejo del portero de la base. */
export function dentroDelHorario(instante: Date): boolean {
  const p = partesEnZona(instante);
  if (p.minuto !== 0) return false;
  return (HORAS_POR_DIA[p.diaSemana] ?? []).includes(p.hora);
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

function clave(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Los próximos días con huecos, a partir de un instante.
 *
 * Devuelve días ABIERTOS: los domingos no se pintan como «sin horas», se
 * saltan. Enseñar un día vacío obliga a tocarlo para descubrir que no hay
 * nada, y esta pantalla existe para ahorrar toques.
 */
export function proximosDias(desde: Date, cuantos = 6): Dia[] {
  const dias: Dia[] = [];
  const p = partesEnZona(desde);
  let cursor = Date.UTC(p.anio, p.mes - 1, p.dia);

  /* Tope de 21 iteraciones: seis días abiertos caben de sobra en tres
     semanas, y un bucle sin freno en el servidor es un incidente. */
  for (let i = 0; i < 21 && dias.length < cuantos; i += 1) {
    const d = new Date(cursor);
    const anio = d.getUTCFullYear();
    const mes = d.getUTCMonth() + 1;
    const dia = d.getUTCDate();
    const huecos = huecosDelDia(anio, mes, dia).filter((h) => h > desde);

    if (huecos.length > 0) {
      const diaJs = d.getUTCDay();
      dias.push({
        clave: clave(anio, mes, dia),
        anio,
        mes,
        dia,
        diaSemana: diaJs === 0 ? 7 : diaJs,
        huecos,
      });
    }
    cursor += 24 * 60 * 60 * 1000;
  }

  return dias;
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

/** «jueves 20 de agosto», en la zona que se le pase. */
export function fechaLarga(instante: Date, zona: string = ZONA): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    weekday: "long",
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
