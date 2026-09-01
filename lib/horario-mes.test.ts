import { describe, expect, it } from "vitest";

import { diasEnRango, instanteEnZona, type Tramo } from "./horario";

/**
 * La ventana del calendario de mes.
 *
 * Existe por un fallo concreto: alguien quería el día 10 y la pantalla sólo
 * enseñaba «los seis próximos días con horas». Estas pruebas fijan lo que
 * aquella función no garantizaba — que un día concreto de la ventana esté
 * siempre donde se espera, abierto o cerrado.
 */

const HORARIO: readonly Tramo[] = [
  { diaSemana: 1, desdeHora: 13, hastaHora: 17 },
  { diaSemana: 2, desdeHora: 13, hastaHora: 17 },
  { diaSemana: 3, desdeHora: 13, hastaHora: 17 },
  { diaSemana: 4, desdeHora: 9, hastaHora: 17 },
  { diaSemana: 5, desdeHora: 9, hastaHora: 17 },
  { diaSemana: 6, desdeHora: 9, hastaHora: 13 },
];

/* Martes 1 de septiembre de 2026, a las 8:00 de Utah. */
const MARTES_1 = instanteEnZona(2026, 9, 1, 8);

describe("la ventana es de días de calendario, no de días abiertos", () => {
  it("devuelve exactamente los días pedidos, seguidos", () => {
    const dias = diasEnRango(MARTES_1, 14, HORARIO);
    expect(dias).toHaveLength(14);
    expect(dias[0].clave).toBe("2026-09-01");
    expect(dias[13].clave).toBe("2026-09-14");
  });

  it("el día 10 está en su sitio, que es lo que fallaba", () => {
    const dias = diasEnRango(MARTES_1, 60, HORARIO);
    const diez = dias.find((d) => d.clave === "2026-09-10");
    expect(diez).toBeDefined();
    /* Es jueves: abre de 9 a 17, ocho horas. */
    expect(diez!.diaSemana).toBe(4);
    expect(diez!.huecos).toHaveLength(8);
  });

  it("los cerrados también salen, con la lista vacía", () => {
    const dias = diasEnRango(MARTES_1, 7, HORARIO);
    const domingo = dias.find((d) => d.diaSemana === 7);
    expect(domingo).toBeDefined();
    expect(domingo!.huecos).toEqual([]);
  });

  it("sesenta días cruzan de mes y siguen contiguos", () => {
    const dias = diasEnRango(MARTES_1, 60, HORARIO);
    expect(dias[dias.length - 1].clave).toBe("2026-10-30");
    /* Ningún salto: cada clave es el día siguiente de la anterior. */
    for (let i = 1; i < dias.length; i += 1) {
      const a = Date.UTC(dias[i - 1].anio, dias[i - 1].mes - 1, dias[i - 1].dia);
      const b = Date.UTC(dias[i].anio, dias[i].mes - 1, dias[i].dia);
      expect(b - a).toBe(86_400_000);
    }
  });
});

describe("las horas que ya pasaron", () => {
  it("hoy no ofrece las que quedaron atrás", () => {
    /* Jueves 3 de septiembre a las 11:30: de las ocho horas del jueves, las
       9, 10 y 11 ya pasaron. Quedan cinco. */
    const jueves = instanteEnZona(2026, 9, 3, 11);
    const yMedia = new Date(jueves.getTime() + 30 * 60 * 1000);
    const [hoy] = diasEnRango(yMedia, 1, HORARIO);
    expect(hoy.clave).toBe("2026-09-03");
    expect(hoy.huecos).toHaveLength(5);
  });

  it("un día abierto cuyas horas pasaron todas queda como cerrado", () => {
    /* Martes a las 18:00: el martes abría de 13 a 17 y ya se fue entero. */
    const tarde = instanteEnZona(2026, 9, 1, 18);
    const [hoy] = diasEnRango(tarde, 1, HORARIO);
    expect(hoy.huecos).toEqual([]);
  });
});

describe("sin horario", () => {
  it("con la agenda cerrada del todo, la ventana sale entera y vacía", () => {
    const dias = diasEnRango(MARTES_1, 30, []);
    expect(dias).toHaveLength(30);
    expect(dias.every((d) => d.huecos.length === 0)).toBe(true);
  });
});
