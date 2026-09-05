import { describe, expect, it } from "vitest";
import { AUDIENCIAS, ASESORIA, servicioPorId, nombreLargo } from "./servicios";
import { ENLACES } from "./enlaces";
import { respuestaPorId } from "./guia-respuestas";

describe("servicios originales y nueva landing", () => {
  it("conserva las tres audiencias con sus identificadores y precios originales", () => {
    expect(AUDIENCIAS.map((s) => [s.id, s.nombre, s.precioUsd])).toEqual([
      ["primera", "Primera audiencia", 70],
      ["segunda", "Segunda audiencia", 150],
      ["tercera", "Tercera audiencia", 250],
    ]);
    expect(nombreLargo(servicioPorId("primera")!)).toBe(
      "Preparación · Primera audiencia (Preliminar)",
    );
    expect(ASESORIA.id).toBe("asesoria");
    expect(ASESORIA.precioUsd).toBe(70);
    expect(servicioPorId("incorrecto")).toBeNull();
  });

  it("mantiene en links el selector de audiencias y añade la landing sin quitar los otros proyectos", () => {
    expect(ENLACES.filter((e) => e.abreServicios)).toHaveLength(1);
    expect(ENLACES.find((e) => e.abreServicios)?.titulo).toBe(
      "Preparación de audiencia",
    );
    expect(ENLACES.map((e) => e.href)).toEqual([
      "/reservar",
      "/",
      "https://www.usalatinoprime.com/",
      "https://andex.usalatinoprime.com/",
      "https://comunidad.starbizacademy.com/bootcamp",
    ]);
    expect(respuestaPorId("preparacion")?.enlaces?.map((e) => e.href)).toEqual([
      "/reservar?servicio=primera",
      "/reservar?servicio=segunda",
      "/reservar?servicio=tercera",
    ]);
    expect(respuestaPorId("asesoria")).not.toBeNull();
  });
});
