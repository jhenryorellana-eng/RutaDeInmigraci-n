import { describe, expect, it } from "vitest";
import { PRIMERAS, RESPUESTAS, respuestaPorId } from "./guia-respuestas";

describe("el guía de /links", () => {
  it("cada botón lleva a una respuesta que existe", () => {
    const ofrecidas = [...PRIMERAS, ...RESPUESTAS.flatMap((r) => r.luego ?? [])];
    expect(ofrecidas.filter((id) => !respuestaPorId(id))).toEqual([]);
  });

  it("sólo ofrece lo que está en la pared: ni Andex, ni el bootcamp, ni La ruta del inmigrante", () => {
    const destinos = RESPUESTAS.flatMap((r) => r.enlaces ?? []).map((e) => e.href);
    expect(destinos.some((href) => /andex|starbiz/.test(href))).toBe(false);
    expect(respuestaPorId("ruta")).toBeNull();
    const textos = RESPUESTAS.flatMap((r) => [r.pregunta, ...r.dice, ...(r.enlaces ?? []).map((e) => e.texto)]);
    expect(textos.filter((t) => /la ruta/i.test(t))).toEqual([]);
  });
});
