import { describe, expect, it } from "vitest";
import {
  enlaceCambioDeHora,
  enlaceComprobante,
  enlacePregunta,
  enlaceWhatsapp,
  WHATSAPP_HENRY,
} from "./pago";

const texto = (enlace: string) => {
  const url = new URL(enlace);
  expect(url.origin + url.pathname).toBe(`https://wa.me/${WHATSAPP_HENRY}`);
  return url.searchParams.get("text") ?? "";
};

describe("mensajes de WhatsApp para Henry", () => {
  it("el comprobante lleva el código, el servicio, la hora y el tema", () => {
    expect(
      texto(
        enlaceComprobante({
          codigo: "12 34",
          servicio: "Asesoría personalizada",
          cuando: "jueves, 15 de octubre a las 10:00",
          tema: "No sé por dónde empezar.",
        }),
      ),
    ).toBe(
      [
        "Hola Henry, te envío el comprobante de mi pago por Zelle.",
        "Código: 12 34",
        "Asesoría personalizada · jueves, 15 de octubre a las 10:00",
        "Mi punto de partida: No sé por dónde empezar.",
      ].join("\n"),
    );
  });

  it("el comprobante sigue sirviendo sin hora ni tema", () => {
    expect(
      texto(enlaceComprobante({ codigo: "12 34", servicio: "Tercera audiencia" })),
    ).toBe(
      "Hola Henry, te envío el comprobante de mi pago por Zelle.\nCódigo: 12 34\nTercera audiencia",
    );
  });

  it("la coordinación añade el tema sólo si se eligió", () => {
    expect(texto(enlaceWhatsapp("el lunes"))).not.toContain("punto de partida");
    expect(texto(enlaceWhatsapp("el lunes", "Tengo preguntas concretas."))).toContain(
      "Mi punto de partida: Tengo preguntas concretas.",
    );
  });

  it("cambiar la hora y preguntar llevan su propio mensaje", () => {
    expect(texto(enlaceCambioDeHora("el lunes a las 10:00"))).toContain(
      "tengo una sesión para el lunes a las 10:00 y necesito cambiar la hora",
    );
    expect(texto(enlaceCambioDeHora())).toContain("necesito cambiar la hora");
    expect(texto(enlacePregunta())).toContain("tengo una pregunta");
  });
});
