import { describe, expect, it } from "vitest";
import {
  AUDIENCIAS,
  PRECIO_DESDE,
  servicioPorId,
  nombreDeServicio,
  nombreLargo,
} from "./servicios";
import { ENLACES } from "./enlaces";
import { respuestaPorId } from "./guia-respuestas";

describe("catálogo de preparaciones", () => {
  it("ofrece la segunda y la tercera audiencia con sus precios", () => {
    expect(AUDIENCIAS.map((s) => [s.id, s.nombre, s.precioUsd])).toEqual([
      ["segunda", "Segunda audiencia", 150],
      ["tercera", "Tercera audiencia", 350],
    ]);
    expect(nombreLargo(servicioPorId("segunda")!)).toBe(
      "Preparación · Segunda audiencia (Preliminar)",
    );
    expect(PRECIO_DESDE).toBe(150);
    expect(servicioPorId("incorrecto")).toBeNull();
  });

  it("ya no ofrece la primera audiencia ni la asesoría de $70, pero el panel sigue nombrando sus citas", () => {
    expect(servicioPorId("primera")).toBeNull();
    expect(servicioPorId("asesoria")).toBeNull();
    expect(nombreDeServicio("primera")).toBe("Primera audiencia");
    expect(nombreDeServicio("asesoria")).toBe("Asesoría personalizada");
    expect(nombreDeServicio("tercera")).toBe("Tercera audiencia");
    expect(nombreDeServicio("incorrecto")).toBeNull();
  });

  it("deja en links La ruta del inmigrante, que abre las audiencias, y los trámites", () => {
    expect(ENLACES.filter((e) => e.abreServicios)).toHaveLength(1);
    expect(ENLACES.find((e) => e.abreServicios)?.titulo).toBe(
      "La ruta del inmigrante",
    );
    expect(ENLACES.map((e) => e.href)).toEqual([
      "/",
      "https://landing.contygo.app",
    ]);
    expect(respuestaPorId("ruta")?.enlaces?.map((e) => e.href)).toEqual([
      "/reservar?servicio=segunda",
      "/reservar?servicio=tercera",
      "/",
    ]);
    expect(respuestaPorId("asesoria")).toBeNull();
  });
});
