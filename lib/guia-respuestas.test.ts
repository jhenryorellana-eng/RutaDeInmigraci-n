import { describe, expect, it } from "vitest";
import { PRIMERAS, RESPUESTAS, respuestaPorId } from "./guia-respuestas";

describe("el guía de /links", () => {
  it("cada botón lleva a una respuesta que existe", () => {
    const ofrecidas = [...PRIMERAS, ...RESPUESTAS.flatMap((r) => r.luego ?? [])];
    expect(ofrecidas.filter((id) => !respuestaPorId(id))).toEqual([]);
  });

  it("no ofrece Andex ni el bootcamp mientras no estén en la pared", () => {
    const destinos = RESPUESTAS.flatMap((r) => r.enlaces ?? []).map((e) => e.href);
    expect(destinos.some((href) => /andex|starbiz/.test(href))).toBe(false);
    expect(respuestaPorId("ruta")?.enlaces?.[0].href).toBe("/");
  });
});
