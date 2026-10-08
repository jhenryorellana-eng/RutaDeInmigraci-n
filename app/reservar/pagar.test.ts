import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pago-stripe", () => ({ crearSesionDePago: vi.fn() }));
vi.mock("@/lib/sitio", () => ({ URL_SITIO: "http://localhost:3000" }));

import { crearSesionDePago } from "@/lib/pago-stripe";
import { abrirPagoConTarjeta } from "./pagar";

const crearCheckout = vi.mocked(crearSesionDePago);
const solicitud = {
  solicitudId: 123,
  servicioId: "segunda",
  correo: "prueba@example.com",
};

describe("pago público de las preparaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/prueba",
    });
  });

  it.each(["", "inventado", "primera", "asesoria"])(
    "no permite cobrar el servicio desconocido %s",
    async (servicioId) => {
      expect(
        await abrirPagoConTarjeta({ ...solicitud, servicioId }),
      ).toHaveProperty("error");
      expect(crearCheckout).not.toHaveBeenCalled();
    },
  );

  it.each([0, -1, 1.5])(
    "rechaza una solicitud inválida: %s",
    async (solicitudId) => {
      expect(
        await abrirPagoConTarjeta({ ...solicitud, solicitudId }),
      ).toHaveProperty("error");
      expect(crearCheckout).not.toHaveBeenCalled();
    },
  );

  it("cobra el precio del servidor aunque el cliente envíe otro importe", async () => {
    const datosManipulados = { ...solicitud, precioUsd: 1 };
    await abrirPagoConTarjeta(datosManipulados);
    expect(crearCheckout).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        solicitudId: 123,
        servicioId: "segunda",
        precioUsd: 150,
        titulo: "Segunda audiencia · Henry Orellana",
      }),
    );
  });

  it.each([
    ["segunda", 150, "Segunda audiencia"],
    ["tercera", 350, "Tercera audiencia"],
  ])(
    "mantiene la reserva de %s y su precio en servidor",
    async (servicioId, precioUsd, nombre) => {
      await abrirPagoConTarjeta({
        ...solicitud,
        servicioId: String(servicioId),
        ...{ precioUsd: 1 },
      });
      expect(crearCheckout).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          servicioId,
          precioUsd,
          titulo: `${nombre} · Henry Orellana`,
        }),
      );
    },
  );
});
