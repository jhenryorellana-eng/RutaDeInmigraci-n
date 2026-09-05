import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pago-stripe", () => ({ crearSesionDePago: vi.fn() }));
vi.mock("@/lib/sitio", () => ({ URL_SITIO: "http://localhost:3000" }));

import { crearSesionDePago } from "@/lib/pago-stripe";
import { abrirPagoConTarjeta } from "./pagar";

const crearCheckout = vi.mocked(crearSesionDePago);
const solicitud = { solicitudId: 123, servicioId: "primera", correo: "prueba@example.com" };

describe("pago público de la asesoría", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crearCheckout.mockResolvedValue({ url: "https://checkout.stripe.com/prueba" });
  });

  it.each(["segunda", "tercera", "inventado"])("no permite cobrar el servicio retirado o desconocido %s", async servicioId => {
    expect(await abrirPagoConTarjeta({ ...solicitud, servicioId })).toHaveProperty("error");
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it.each([0, -1, 1.5])("rechaza una solicitud inválida: %s", async solicitudId => {
    expect(await abrirPagoConTarjeta({ ...solicitud, solicitudId })).toHaveProperty("error");
    expect(crearCheckout).not.toHaveBeenCalled();
  });

  it("cobra 70 USD definidos en servidor aunque el cliente envíe otro importe", async () => {
    const datosManipulados = { ...solicitud, precioUsd: 1 };
    await abrirPagoConTarjeta(datosManipulados);
    expect(crearCheckout).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      solicitudId: 123,
      servicioId: "primera",
      precioUsd: 70,
      titulo: "Asesoría personalizada · Henry Orellana",
    }));
  });
});
