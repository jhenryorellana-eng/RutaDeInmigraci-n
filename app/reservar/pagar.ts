"use server";

import { crearSesionDePago } from "@/lib/pago-stripe";
import { servicioPorId } from "@/lib/servicios";
import { URL_SITIO } from "@/lib/sitio";

/**
 * Abre el pago con tarjeta de una cita ya apartada.
 *
 * Vive en el servidor porque la clave de Stripe no puede pisar el navegador,
 * y el precio se resuelve AQUÍ contra la lista de servicios en vez de
 * aceptar el que llegue: si el importe viniera del cliente, cualquiera
 * podría pagar $1 por una preparación de $250.
 */
export async function abrirPagoConTarjeta(datos: {
  solicitudId: number;
  servicioId: string;
  correo: string;
}): Promise<{ url: string } | { error: string }> {
  const servicio = servicioPorId(datos.servicioId);
  if (!servicio) return { error: "Esa preparación no existe." };
  if (!Number.isInteger(datos.solicitudId) || datos.solicitudId <= 0) {
    return { error: "Esa solicitud no existe." };
  }

  return crearSesionDePago({
    solicitudId: datos.solicitudId,
    titulo: `Preparación · ${servicio.nombre}`,
    descripcion: `${servicio.etapa} · 45 minutos con Henry Orellana`,
    precioUsd: servicio.precioUsd,
    correo: datos.correo,
    urlBase: URL_SITIO,
    servicioId: servicio.id,
  });
}
