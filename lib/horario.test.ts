import { describe, expect, it } from "vitest";

import {
  dentroDelHorario,
  diaCorto,
  horaEnZona,
  huecosDelDia,
  instanteEnZona,
  partesEnZona,
  proximosDias,
} from "./horario";

/**
 * El horario es lo único de este producto que puede fallar en silencio: una
 * cita a la hora equivocada no lanza ningún error, simplemente nadie
 * aparece. Por eso se prueba el cambio de hora, los bordes del día y el
 * domingo, que son los tres sitios donde esto se rompe de verdad.
 */

describe("la hora de pared de Utah", () => {
  it("resuelve las 11:00 de un día de verano (MDT, UTC−6)", () => {
    const i = instanteEnZona(2026, 8, 20, 11);
    expect(i.toISOString()).toBe("2026-08-20T17:00:00.000Z");
    expect(horaEnZona(i)).toBe("11:00");
  });

  it("resuelve las 11:00 de un día de invierno (MST, UTC−7)", () => {
    const i = instanteEnZona(2026, 1, 15, 11);
    expect(i.toISOString()).toBe("2026-01-15T18:00:00.000Z");
    expect(horaEnZona(i)).toBe("11:00");
  });

  it("el día que ADELANTAN el reloj sigue dando las horas correctas", () => {
    // En 2026 el cambio a horario de verano en EE. UU. es el 8 de marzo.
    const antes = instanteEnZona(2026, 3, 8, 8);
    const despues = instanteEnZona(2026, 3, 8, 16);
    expect(horaEnZona(antes)).toBe("8:00");
    expect(horaEnZona(despues)).toBe("16:00");
  });

  it("el día que ATRASAN el reloj sigue dando las horas correctas", () => {
    // 1 de noviembre de 2026.
    expect(horaEnZona(instanteEnZona(2026, 11, 1, 9))).toBe("9:00");
    expect(horaEnZona(instanteEnZona(2026, 11, 2, 9))).toBe("9:00");
  });

  it("a las 23:00 de Utah el día local sigue siendo el mismo, aunque en UTC ya sea otro", () => {
    const i = instanteEnZona(2026, 8, 20, 23);
    expect(i.getUTCDate()).toBe(21); // en UTC ya es día 21
    const p = partesEnZona(i);
    expect(p.dia).toBe(20); // pero en Utah sigue siendo el 20
    expect(p.diaSemana).toBe(4); // y sigue siendo jueves
  });
});

describe("los huecos de cada día", () => {
  it("entre semana ofrece nueve, de 8:00 a 16:00", () => {
    const h = huecosDelDia(2026, 8, 20); // jueves
    expect(h).toHaveLength(9);
    expect(horaEnZona(h[0])).toBe("8:00");
    expect(horaEnZona(h[h.length - 1])).toBe("16:00");
  });

  it("el sábado ofrece cinco, de 8:00 a 12:00 — la última termina a la 1", () => {
    const h = huecosDelDia(2026, 8, 22); // sábado
    expect(h).toHaveLength(5);
    expect(horaEnZona(h[0])).toBe("8:00");
    expect(horaEnZona(h[h.length - 1])).toBe("12:00");
  });

  it("el domingo no ofrece ninguno", () => {
    expect(huecosDelDia(2026, 8, 23)).toHaveLength(0);
  });

  it("ningún hueco entre semana empieza a las 17:00", () => {
    // La sesión dura 45 min: empezar a las 17:00 la terminaría a las 17:45,
    // fuera del horario que se anuncia.
    const horas = huecosDelDia(2026, 8, 20).map((h) => horaEnZona(h));
    expect(horas).not.toContain("17:00");
  });
});

describe("dentroDelHorario — el espejo del portero de la base", () => {
  it("acepta una hora en punto dentro del horario", () => {
    expect(dentroDelHorario(instanteEnZona(2026, 8, 20, 11))).toBe(true);
  });

  it("rechaza el domingo", () => {
    expect(dentroDelHorario(instanteEnZona(2026, 8, 23, 11))).toBe(false);
  });

  it("rechaza las 17:00 entre semana y las 13:00 el sábado", () => {
    expect(dentroDelHorario(instanteEnZona(2026, 8, 20, 17))).toBe(false);
    expect(dentroDelHorario(instanteEnZona(2026, 8, 22, 13))).toBe(false);
  });

  it("rechaza una hora que no empieza en punto", () => {
    const enPunto = instanteEnZona(2026, 8, 20, 11);
    const y37 = new Date(enPunto.getTime() + 37 * 60 * 1000);
    expect(dentroDelHorario(y37)).toBe(false);
  });
});

describe("los próximos días", () => {
  it("se salta los domingos en vez de pintarlos vacíos", () => {
    // Viernes 21 de agosto de 2026, 7:00 de Utah.
    const dias = proximosDias(instanteEnZona(2026, 8, 21, 7), 3);
    const claves = dias.map((d) => d.clave);
    expect(claves).toEqual(["2026-08-21", "2026-08-22", "2026-08-24"]);
  });

  it("no ofrece horas que ya pasaron hoy", () => {
    // Jueves a las 14:00: sólo deben quedar 15:00 y 16:00.
    const ahora = instanteEnZona(2026, 8, 20, 14);
    const [hoy] = proximosDias(ahora, 1);
    expect(hoy.huecos.map((h) => horaEnZona(h))).toEqual(["15:00", "16:00"]);
  });

  it("salta el día entero cuando ya no queda ninguna hora", () => {
    // Jueves a las 16:30: hoy ya no cabe nada, el primero es el viernes.
    const ahora = new Date(instanteEnZona(2026, 8, 20, 16).getTime() + 30 * 60 * 1000);
    const [primero] = proximosDias(ahora, 1);
    expect(primero.clave).toBe("2026-08-21");
  });

  it("devuelve como mucho los que se le piden", () => {
    expect(proximosDias(instanteEnZona(2026, 8, 20, 7), 4)).toHaveLength(4);
  });
});

describe("cómo se escriben las fechas", () => {
  it("el día corto sale en tres letras y en mayúsculas", () => {
    expect(diaCorto(instanteEnZona(2026, 8, 20, 11))).toBe("JUE");
  });

  it("la misma cita se lee distinta según dónde estés", () => {
    // 11:00 en Utah son las 12:00 en Chicago y las 13:00 en Nueva York.
    const i = instanteEnZona(2026, 8, 20, 11);
    expect(horaEnZona(i, "America/Chicago")).toBe("12:00");
    expect(horaEnZona(i, "America/New_York")).toBe("13:00");
  });
});
