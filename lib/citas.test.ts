import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/servidor", () => ({
  hayBase: true,
  clienteServidor: async () => ({ rpc }),
}));
vi.mock("@/lib/tramos", () => ({
  leerTramos: async () => [{ diaSemana: 1, desdeHora: 8, hastaHora: 17 }],
}));
import { apartarCita } from "./citas";

const datos = {
  iso: "2026-09-07T15:00:00.000Z",
  nombre: "Prueba local",
  correo: "prueba@example.com",
  nacionalidad: "PE",
  enEeuu: false,
  whatsapp: "51999999999",
  zonaHoraria: "America/Lima",
};

describe("solicitudes para los cuatro servicios", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-05T12:00:00Z"));
    rpc
      .mockReset()
      .mockResolvedValue({
        data: { id: 123, codigoPago: "1234" },
        error: null,
      });
  });
  afterEach(() => vi.useRealTimers());

  it.each([
    ["primera", 70],
    ["segunda", 150],
    ["tercera", 250],
    ["asesoria", 70],
  ])(
    "guarda %s con el precio del catálogo y mantiene el circuito de pago",
    async (servicio, precio) => {
      const resultado = await apartarCita({
        ...datos,
        servicio: String(servicio),
        metodoPago: "zelle",
        ...{ precioUsd: 1 },
      });
      expect(resultado).toEqual({
        ok: true,
        solicitudId: 123,
        codigoPago: "1234",
      });
      expect(rpc).toHaveBeenCalledExactlyOnceWith(
        "pedir_hora",
        expect.objectContaining({
          p_servicio: servicio,
          p_precio_usd: precio,
          p_metodo_pago: "zelle",
          p_inicia_en: datos.iso,
        }),
      );
    },
  );

  it("rechaza un servicio desconocido antes de guardar una solicitud", async () => {
    expect(await apartarCita({ ...datos, servicio: "inventado" })).toEqual({
      ok: false,
      motivo: "Ese servicio no está disponible.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
