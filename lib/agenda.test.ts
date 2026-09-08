import { describe, expect, it } from "vitest";
import {
  errorAgenda,
  fechaYHora,
  instanteAgenda,
  validarCambioAgenda,
  type CambioAgenda,
} from "./agenda";

const cambio: CambioAgenda = {
  tipo: "evento",
  titulo: "Cita manual",
  fecha: "2027-07-14",
  hora: "10:00",
  duracion: 2,
  ocupa: true,
  nota: "",
  whatsapp: "",
};

describe("editor administrativo", () => {
  it("usa Utah aunque el teléfono esté en otra zona, incluyendo horario de verano", () => {
    expect(instanteAgenda("2027-07-14", "10:00")?.toISOString()).toBe(
      "2027-07-14T16:00:00.000Z",
    );
    expect(instanteAgenda("2027-01-14", "10:00")?.toISOString()).toBe(
      "2027-01-14T17:00:00.000Z",
    );
    expect(fechaYHora("2027-07-15T05:00:00Z")).toEqual({
      fecha: "2027-07-14",
      hora: "23:00",
    });
  });
  it.each([
    ["2027-02-30", "10:00"],
    ["2027-03-14", "02:00"],
    ["2027-07-14", "24:00"],
    ["2027-07-14", "10:30"],
  ])("rechaza fecha u hora imposible: %s %s", (fecha, hora) => {
    expect(instanteAgenda(fecha, hora)).toBeNull();
  });
  it("conserva el límite de medianoche de un evento", () => {
    const r = validarCambioAgenda({ ...cambio, hora: "23:00" });
    expect(r.datos?.inicio).toBe("2027-07-15T05:00:00.000Z");
    expect(r.datos?.fin).toBe("2027-07-15T07:00:00.000Z");
  });
  it("sólo envía campos permitidos: ningún importe, servicio o estado de pago", () => {
    const r = validarCambioAgenda({
      ...cambio,
      tipo: "cita",
      id: 42,
      version: "2026-09-08T03:00:00Z",
      whatsapp: "+1 (202) 555-0100",
      precio_usd: 0,
      servicio: "tercera",
      estado: "reservada",
    } as CambioAgenda);
    expect(r.datos?.whatsapp).toBe("12025550100");
    expect(r.datos).not.toHaveProperty("precio_usd");
    expect(r.datos).not.toHaveProperty("servicio");
    expect(r.datos).not.toHaveProperty("estado");
  });
  it.each([0, -1, 1.5, 25])("rechaza duración %s", (duracion) =>
    expect(validarCambioAgenda({ ...cambio, duracion }).error).toBeTruthy(),
  );
  it("requiere versión para evitar sobrescribir otra edición", () =>
    expect(validarCambioAgenda({ ...cambio, id: 1 }).error).toBeTruthy());
  it("no crea una reserva pagada desde el formulario manual", () =>
    expect(
      validarCambioAgenda({ ...cambio, tipo: "cita" }).error,
    ).toBeTruthy());
  it("rechaza teléfonos inválidos y notas demasiado largas", () => {
    expect(
      validarCambioAgenda({ ...cambio, whatsapp: "123ABC456789" }).error,
    ).toBeTruthy();
    expect(
      validarCambioAgenda({ ...cambio, nota: "x".repeat(2001) }).error,
    ).toBeTruthy();
  });
  it("explica conflictos y ediciones concurrentes sin exponer SQL", () => {
    expect(errorAgenda("23P01")).toContain("no se guardó ningún cambio");
    expect(errorAgenda("40001")).toContain("otro dispositivo");
    expect(errorAgenda("23514", "secret database detail")).not.toContain(
      "secret",
    );
  });
});
