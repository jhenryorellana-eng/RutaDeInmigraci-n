import { describe, expect, it } from "vitest";

import {
  dentroDelHorario,
  describirHorario,
  franjaDeHoras,
  horaSuelta,
  horasDelDiaSemana,
  huecosDelDia,
  instanteEnZona,
  lunesDe,
  proximosDias,
  semanaDesde,
  sumaDias,
  type Tramo,
} from "./horario";

/**
 * EL HORARIO PARTIDO.
 *
 * Todo esto existe por una frase: «entre las 8 y las 5 tal vez no quiera
 * estar libre de 1 a 3». Un día con un agujero en medio no se puede decir
 * con una hora de apertura y otra de cierre, y el fallo que produce es de
 * los que no se ven — la pantalla ofrece las 13:00, alguien la aparta, y
 * nadie se entera hasta que Henry no aparece.
 *
 * `2026-08-20` es jueves; `2026-08-17`, lunes. Utah está en MDT (UTC−6) en
 * agosto y en MST (UTC−7) en noviembre.
 */

/** Un día partido: de 8 a 1 y de 3 a 5. El caso del encargo. */
const PARTIDO: Tramo[] = [
  { diaSemana: 4, desdeHora: 8, hastaHora: 13 },
  { diaSemana: 4, desdeHora: 15, hastaHora: 17 },
];

describe("un día partido en dos tramos", () => {
  it("ofrece las horas de los dos tramos y ninguna del agujero", () => {
    expect(horasDelDiaSemana(4, PARTIDO)).toEqual([8, 9, 10, 11, 12, 15, 16]);
  });

  it("no ofrece la hora de cierre de ningún tramo", () => {
    /* Ni las 13:00 ni las 17:00: una sesión que empezara ahí acabaría 45
       minutos después de cerrar. */
    const horas = horasDelDiaSemana(4, PARTIDO);
    expect(horas).not.toContain(13);
    expect(horas).not.toContain(17);
  });

  it("rechaza las horas del agujero aunque estén entre la apertura y el cierre", () => {
    const trece = instanteEnZona(2026, 8, 20, 13);
    const catorce = instanteEnZona(2026, 8, 20, 14);
    expect(dentroDelHorario(trece, PARTIDO)).toBe(false);
    expect(dentroDelHorario(catorce, PARTIDO)).toBe(false);
  });

  it("acepta la primera hora del segundo tramo", () => {
    expect(dentroDelHorario(instanteEnZona(2026, 8, 20, 15), PARTIDO)).toBe(true);
  });

  it("pinta los huecos del día con el agujero dentro", () => {
    const huecos = huecosDelDia(2026, 8, 20, PARTIDO);
    expect(huecos).toHaveLength(7);
    /* El salto entre el quinto y el sexto hueco son tres horas: 12:00 → 15:00.
       Ésa es la firma del agujero, y si algún día vuelve a ser de una hora
       significa que los tramos se fundieron. */
    const salto = huecos[5].getTime() - huecos[4].getTime();
    expect(salto).toBe(3 * 60 * 60 * 1000);
  });
});

describe("tramos raros", () => {
  it("no repite una hora que caiga en dos tramos solapados", () => {
    const solapados: Tramo[] = [
      { diaSemana: 1, desdeHora: 8, hastaHora: 12 },
      { diaSemana: 1, desdeHora: 10, hastaHora: 14 },
    ];
    expect(horasDelDiaSemana(1, solapados)).toEqual([8, 9, 10, 11, 12, 13]);
  });

  it("un día sin tramos no ofrece nada", () => {
    expect(horasDelDiaSemana(3, PARTIDO)).toEqual([]);
    expect(huecosDelDia(2026, 8, 19, PARTIDO)).toEqual([]);
  });

  it("sin ningún tramo, la agenda está cerrada y no cuelga", () => {
    /* El caso de Henry cerrando la temporada. Sin el tope de iteraciones de
       `proximosDias`, este bucle no pararía nunca. */
    expect(proximosDias(new Date("2026-08-20T15:00:00Z"), 6, [])).toEqual([]);
    expect(franjaDeHoras([])).toEqual([]);
  });
});

describe("la franja de horas de la rejilla", () => {
  it("cubre el agujero, para que la fila exista igualmente", () => {
    /* La rejilla necesita una fila por hora entre la primera apertura y el
       último cierre, incluidas las del descanso: si no, el descanso no
       tendría dónde pintarse. */
    expect(franjaDeHoras(PARTIDO)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  });

  it("va del más madrugador al más tardío de toda la semana", () => {
    const mezcla: Tramo[] = [
      { diaSemana: 1, desdeHora: 7, hastaHora: 12 },
      { diaSemana: 6, desdeHora: 10, hastaHora: 19 },
    ];
    expect(franjaDeHoras(mezcla)[0]).toBe(7);
    expect(franjaDeHoras(mezcla).at(-1)).toBe(18);
  });
});

describe("la semana del panel", () => {
  it("empieza en lunes y salta el domingo si está cerrado", () => {
    const dias = semanaDesde({ anio: 2026, mes: 8, dia: 17 }, PARTIDO);
    expect(dias).toHaveLength(6);
    expect(dias[0].clave).toBe("2026-08-17");
    expect(dias.at(-1)?.clave).toBe("2026-08-22");
  });

  it("incluye el domingo si Henry lo abre", () => {
    const conDomingo: Tramo[] = [...PARTIDO, { diaSemana: 7, desdeHora: 9, hastaHora: 12 }];
    const dias = semanaDesde({ anio: 2026, mes: 8, dia: 17 }, conDomingo);
    expect(dias).toHaveLength(7);
    expect(dias.at(-1)?.clave).toBe("2026-08-23");
  });

  it("trae también los días cerrados, al revés que la pantalla pública", () => {
    /* Quien reserva no quiere ver días vacíos; Henry sí, porque un día
       cerrado es información y además es donde toca para reabrirlo. */
    const dias = semanaDesde({ anio: 2026, mes: 8, dia: 17 }, PARTIDO);
    const miercoles = dias.find((d) => d.clave === "2026-08-19");
    expect(miercoles).toBeDefined();
    expect(miercoles?.huecos).toEqual([]);
  });
});

describe("el lunes de la semana", () => {
  it("de un jueves", () => {
    expect(lunesDe(new Date("2026-08-20T15:00:00Z"))).toEqual({
      anio: 2026,
      mes: 8,
      dia: 17,
    });
  });

  it("de un domingo — que pertenece a la semana que ya acabó", () => {
    expect(lunesDe(new Date("2026-08-16T18:00:00Z"))).toEqual({
      anio: 2026,
      mes: 8,
      dia: 10,
    });
  });

  it("a las 23:00 de Utah, cuando en UTC ya es el día siguiente", () => {
    /* 05:00Z del lunes 17 son las 23:00 del domingo 16 en Denver. Si el
       cálculo usara el día UTC, daría el lunes 17 y la semana entera saldría
       corrida. */
    expect(lunesDe(new Date("2026-08-17T05:00:00Z"))).toEqual({
      anio: 2026,
      mes: 8,
      dia: 10,
    });
  });
});

describe("sumar días", () => {
  it("cruza el final de mes", () => {
    expect(sumaDias({ anio: 2026, mes: 8, dia: 31 }, 1)).toEqual({
      anio: 2026,
      mes: 9,
      dia: 1,
    });
  });

  it("cruza el cambio de hora sin desplazar la fecha", () => {
    /* El 1 de noviembre de 2026 Utah atrasa la hora. Como esto opera sobre
       fechas de calendario y no sobre instantes, el día siguiente al 31 de
       octubre sigue siendo el 1 de noviembre. */
    expect(sumaDias({ anio: 2026, mes: 10, dia: 31 }, 1)).toEqual({
      anio: 2026,
      mes: 11,
      dia: 1,
    });
  });

  it("y por eso el fin del día se calcula con la fecha siguiente, no sumando 24 horas", () => {
    /* La prueba de por qué existe `finDelDia()` en las acciones del panel: el
       1 de noviembre de 2026 dura VEINTICINCO horas. Cerrar «el resto del
       día» sumando 24 dejaría la última hora abierta. */
    const medianoche = instanteEnZona(2026, 11, 1, 0);
    const siguiente = instanteEnZona(2026, 11, 2, 0);
    expect(siguiente.getTime() - medianoche.getTime()).toBe(25 * 60 * 60 * 1000);
  });
});

describe("el horario contado en una frase", () => {
  it("agrupa los días seguidos que abren igual", () => {
    /* El texto que va al pie de la pantalla de reserva. Escrito a mano
       mentiría en cuanto Henry moviera una hora, y nadie se acordaría de
       tocarlo. */
    expect(describirHorario()).toBe(
      "De lunes a viernes, de 8:00 a 17:00. Los sábados, de 8:00 a 13:00.",
    );
  });

  it("dice los dos tramos de un día partido", () => {
    const semana: Tramo[] = [1, 2, 3, 4, 5].flatMap((d) => [
      { diaSemana: d, desdeHora: 8, hastaHora: 13 },
      { diaSemana: d, desdeHora: 15, hastaHora: 17 },
    ]);
    expect(describirHorario(semana)).toBe(
      "De lunes a viernes, de 8:00 a 13:00 y de 15:00 a 17:00.",
    );
  });

  it("no junta días seguidos si no abren a la misma hora", () => {
    const distintos: Tramo[] = [
      { diaSemana: 1, desdeHora: 8, hastaHora: 12 },
      { diaSemana: 2, desdeHora: 9, hastaHora: 12 },
    ];
    expect(describirHorario(distintos)).toBe(
      "Los lunes, de 8:00 a 12:00. Los martes, de 9:00 a 12:00.",
    );
  });

  it("con la agenda cerrada no se inventa nada", () => {
    expect(describirHorario([])).toBe("");
  });
});

describe("cómo se escribe una hora suelta", () => {
  it("sin cero a la izquierda, igual que las horas con instante", () => {
    expect(horaSuelta(8)).toBe("8:00");
    expect(horaSuelta(15)).toBe("15:00");
    expect(horaSuelta(0)).toBe("0:00");
  });
});
