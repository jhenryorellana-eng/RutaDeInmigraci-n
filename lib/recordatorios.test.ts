import { describe, expect, it, vi } from "vitest";
import {
  contenidoRecordatorio,
  entregarRecordatorio,
  type Entrega,
} from "../supabase/functions/recordatorios-agenda/envio";

const entrega: Entrega = {
  id: 1,
  token: "token",
  tipo: "cita",
  registro_id: 10,
  inicia_en: "2027-07-14T16:00:00Z",
  minutos: 5,
  endpoint: "https://push.example",
  p256dh: "key",
  auth: "auth",
};
const ahora = () => Date.parse("2027-07-14T15:55:00Z");
function dependencias() {
  return {
    vigente: vi.fn().mockResolvedValue(true),
    enviar: vi.fn().mockResolvedValue(undefined),
    finalizar: vi.fn().mockResolvedValue(undefined),
    ahora,
  };
}

describe("recordatorios PWA desde el servidor", () => {
  it("envía un aviso cinco minutos antes con la hora correcta de Utah", async () => {
    const d = dependencias();
    expect(await entregarRecordatorio(entrega, d)).toBe("enviado");
    expect(d.enviar).toHaveBeenCalledWith(
      entrega,
      expect.objectContaining({
        titulo: "Tu cita comienza en 5 min",
        cuerpo: expect.stringContaining("10:00"),
      }),
      420,
    );
    expect(d.finalizar).toHaveBeenCalledWith(entrega, "enviado");
  });
  it("avisa al comenzar si llega a la hora de la cita", () =>
    expect(
      contenidoRecordatorio(entrega, Date.parse(entrega.inicia_en)).titulo,
    ).toBe("Es hora de tu cita"));
  it("revalida cancelaciones y reprogramaciones antes de enviar", async () => {
    const d = dependencias();
    d.vigente.mockResolvedValue(false);
    expect(await entregarRecordatorio(entrega, d)).toBe("omitido");
    expect(d.enviar).not.toHaveBeenCalled();
  });
  it("descarta avisos viejos en vez de enviarlos tarde", async () => {
    const d = {
      ...dependencias(),
      ahora: () => Date.parse(entrega.inicia_en) + 120000,
    };
    expect(await entregarRecordatorio(entrega, d)).toBe("omitido");
    expect(d.enviar).not.toHaveBeenCalled();
  });
  it.each([404, 410])(
    "limpia dispositivos expirados (%s)",
    async (statusCode) => {
      const d = dependencias();
      d.enviar.mockRejectedValue({ statusCode });
      expect(await entregarRecordatorio(entrega, d)).toBe("expirado");
      expect(d.finalizar).toHaveBeenCalledWith(entrega, "expirado");
    },
  );
  it("reintenta errores temporales sin registrarlos como entregados", async () => {
    const d = dependencias();
    d.enviar.mockRejectedValue({ statusCode: 503 });
    expect(await entregarRecordatorio(entrega, d)).toBe("reintentar");
  });
  it("agrupa reintentos pero distingue las citas reprogramadas", () => {
    const a = contenidoRecordatorio(entrega, ahora());
    expect(contenidoRecordatorio(entrega, ahora() + 30000).etiqueta).toBe(
      a.etiqueta,
    );
    expect(
      contenidoRecordatorio(
        { ...entrega, inicia_en: "2027-07-14T17:00:00Z" },
        ahora(),
      ).etiqueta,
    ).not.toBe(a.etiqueta);
    expect(a).not.toHaveProperty("endpoint");
    expect(a).not.toHaveProperty("auth");
  });
});
