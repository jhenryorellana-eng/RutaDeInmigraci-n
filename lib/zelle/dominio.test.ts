import { describe, expect, it } from "vitest";

import {
  codigosDelMemo,
  contencionNombre,
  decidir,
  normalizarNombre,
  palabrasCompartidas,
  type CitaPendiente,
  type PagoZelle,
  type Veredicto,
} from "./dominio";

/**
 * Lo que se prueba aquí es LA DECISIÓN, que es la parte escrita para este
 * proyecto. El parser y la verificación del sello vienen portados de
 * x-legal, donde llevan meses corriendo contra correos reales de Chase.
 *
 * Y se prueba porque es la clase de código que falla en silencio: confirmar
 * la cita equivocada no lanza ningún error, no aparece en ningún registro y
 * sólo se descubre cuando dos personas se presentan a la misma hora.
 */

const SELLO_OK: Veredicto = {
  ok: true,
  dkim: "pass",
  spf: "pass",
  dmarc: "pass",
  motivos: [],
};

function pago(parcial: Partial<PagoZelle> = {}): PagoZelle {
  return {
    remitente: "MARIA VIZCARRA DIAZ",
    montoCentavos: 7000,
    enviadoEl: "2026-08-31",
    transaccion: "123456789012",
    memo: null,
    plantilla: "zelle_auto_accept_receiver",
    plantillaConocida: true,
    nombreVerificadoDosVeces: true,
    ...parcial,
  };
}

function cita(parcial: Partial<CitaPendiente> = {}): CitaPendiente {
  return {
    id: 1,
    nombre: "María Vizcarra Díaz",
    codigoPago: "4821",
    precioUsd: 70,
    creadoEnMs: Date.now(),
    ...parcial,
  };
}

describe("el caso normal, que es el que tiene que resolverse solo", () => {
  it("una sola cita esperando ese importe se confirma sin código", () => {
    const d = decidir({
      pago: pago(),
      autenticidad: SELLO_OK,
      pendientes: [cita({ id: 7 })],
    });
    expect(d).toEqual({
      tipo: "confirmar",
      citaId: 7,
      motivo: expect.stringContaining("Una sola cita"),
    });
  });

  it("se confirma aunque el nombre del banco no se parezca al del formulario", () => {
    /* Pasa de verdad: la cuenta está a nombre del marido, de la madre o de
       quien puso el dinero. Si sólo hay una cita esperando ese importe, el
       nombre no aporta nada y exigirlo sólo generaría trabajo manual. */
    const d = decidir({
      pago: pago({ remitente: "JOSE ANTONIO RAMIREZ" }),
      autenticidad: SELLO_OK,
      pendientes: [cita({ id: 3 })],
    });
    expect(d.tipo).toBe("confirmar");
  });
});

describe("cuando no hay a quién apuntarle el pago", () => {
  it("sin ninguna cita esperando, no se identifica", () => {
    const d = decidir({ pago: pago(), autenticidad: SELLO_OK, pendientes: [] });
    expect(d.tipo).toBe("sin_identificar");
    expect(d.motivo).toContain("no hay ninguna cita");
  });

  it("un importe que no cuadra con ninguna NO se aproxima a la más cercana", () => {
    /* Pagar $65 de una cita de $70 es un problema de dinero, no de
       identificación. Redondear sería dar por pagada una cita que no lo
       está. */
    const d = decidir({
      pago: pago({ montoCentavos: 6500 }),
      autenticidad: SELLO_OK,
      pendientes: [cita({ precioUsd: 70 })],
    });
    expect(d.tipo).toBe("sin_identificar");
  });
});

describe("el desempate, que es para lo que existe el código", () => {
  const dos = [
    cita({ id: 1, nombre: "Ana Pérez", codigoPago: "1111" }),
    cita({ id: 2, nombre: "Luis Gómez", codigoPago: "2222" }),
  ];

  it("dos citas del mismo importe se desempatan por el código del memo", () => {
    const d = decidir({
      pago: pago({ memo: "pago 2222", remitente: "LUIS GOMEZ" }),
      autenticidad: SELLO_OK,
      pendientes: dos,
    });
    expect(d).toMatchObject({ tipo: "confirmar", citaId: 2 });
  });

  it("sin código utilizable, desempata el nombre", () => {
    const d = decidir({
      pago: pago({ memo: null, remitente: "ANA PEREZ" }),
      autenticidad: SELLO_OK,
      pendientes: dos,
    });
    expect(d).toMatchObject({ tipo: "confirmar", citaId: 1 });
  });

  it("si no desempata nada, va a revisión con las dos candidatas", () => {
    const d = decidir({
      pago: pago({ memo: null, remitente: "QUIEN SABE" }),
      autenticidad: SELLO_OK,
      pendientes: dos,
    });
    expect(d.tipo).toBe("ambiguo");
    if (d.tipo === "ambiguo") expect(d.candidatas).toEqual([1, 2]);
  });

  it("un código que no corresponde a ninguna NO cae de vuelta al nombre", () => {
    /* Quien escribe un código está diciendo cuál es su cita. Si ese código
       no existe, algo va mal: adivinar por el nombre sería ignorar lo único
       que esa persona nos dijo explícitamente. */
    const d = decidir({
      pago: pago({ memo: "9999", remitente: "ANA PEREZ" }),
      autenticidad: SELLO_OK,
      pendientes: dos,
    });
    expect(d.tipo).toBe("sin_identificar");
    expect(d.motivo).toContain("9999");
  });
});

describe("lo que nunca se confirma solo", () => {
  it("un correo cuyo sello no pasó se rechaza", () => {
    const d = decidir({
      pago: pago(),
      autenticidad: { ...SELLO_OK, ok: false, motivos: ["DKIM no pasó."] },
      pendientes: [cita()],
    });
    expect(d.tipo).toBe("rechazado");
  });

  it("una plantilla desconocida va a revisión aunque todo lo demás cuadre", () => {
    /* El dinero entró igual, así que no se descarta. Pero una plantilla
       nueva puede tener el importe en otra casilla, y confirmar sobre eso
       es apuntar una cifra que quizá se leyó del sitio equivocado. */
    const d = decidir({
      pago: pago({ plantilla: "zelle_plantilla_nueva_2027", plantillaConocida: false }),
      autenticidad: SELLO_OK,
      pendientes: [cita()],
    });
    expect(d.tipo).toBe("sin_identificar");
    expect(d.motivo).toContain("Plantilla desconocida");
  });
});

describe("los códigos del memo", () => {
  it("lo encuentra entre palabras", () => {
    expect(codigosDelMemo("pago cita 4821 gracias").unico).toBe("4821");
  });

  it("no confunde un importe con un código", () => {
    expect(codigosDelMemo("pago de $1500.00").unico).toBeNull();
  });

  it("dos números distintos dejan de ser un código", () => {
    const r = codigosDelMemo("4821 y 1234");
    expect(r.unico).toBeNull();
    expect(r.todos).toEqual(["4821", "1234"]);
  });

  it("el mismo número repetido sigue siendo uno", () => {
    expect(codigosDelMemo("4821 ref 4821").unico).toBe("4821");
  });

  it("no rellena ceros ni corrige: 482 no es 0482", () => {
    expect(codigosDelMemo("pago 482").unico).toBeNull();
  });

  it("sin memo no hay código", () => {
    expect(codigosDelMemo(null).unico).toBeNull();
  });
});

describe("los nombres, pensados para dos apellidos", () => {
  it("el orden no importa", () => {
    expect(normalizarNombre("Vizcarra Díaz María")).toBe(normalizarNombre("María Vizcarra Diaz"));
  });

  it("los acentos y la eñe no importan", () => {
    expect(normalizarNombre("Muñoz Peña")).toBe(normalizarNombre("Munoz Pena"));
  });

  it("las iniciales sueltas se caen", () => {
    expect(normalizarNombre("Eliana M Villa")).toBe(normalizarNombre("Eliana Villa"));
  });

  it("el banco con menos apellidos sigue estando contenido", () => {
    expect(contencionNombre("Lucía Fernanda Paredes Solís", "LUCIA PAREDES")).toBe(1);
    expect(palabrasCompartidas("Lucía Fernanda Paredes Solís", "LUCIA PAREDES")).toBe(2);
  });

  it("un nombre suelto tiene contención perfecta y por eso hace falta el mínimo de dos", () => {
    expect(contencionNombre("María González", "MARIA")).toBe(1);
    expect(palabrasCompartidas("María González", "MARIA")).toBe(1);
  });
});
