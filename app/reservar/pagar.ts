"use server";

import { crearSesionDePago } from "@/lib/pago-stripe";
import { servicioPorId, nombreLargo } from "@/lib/servicios";
import { URL_SITIO } from "@/lib/sitio";

/**
 * Abre el pago con tarjeta de una solicitud, todavía sin bloquear la hora.
 *
 * Vive en el servidor porque la clave de Stripe no puede pisar el navegador,
 * y el precio se resuelve AQUÍ contra la lista de servicios en vez de
 * aceptar el que llegue: si el importe viniera del cliente, cualquiera
 * podría alterar el importe de la asesoría.
 */
export async function abrirPagoConTarjeta(datos: {
  solicitudId: number;
  servicioId: string;
  correo: string;
}): Promise<{ url: string } | { error: string }> {
  const servicio = servicioPorId(datos.servicioId);
  if (!servicio) return { error: "Ese servicio no está disponible." };
  if (!Number.isInteger(datos.solicitudId) || datos.solicitudId <= 0) {
    return { error: "Esa solicitud no existe." };
  }

  return crearSesionDePago({
    solicitudId: datos.solicitudId,
    titulo: `${servicio.nombre} · Henry Orellana`,
    descripcion: `45 minutos · ${nombreLargo(servicio)}`,
    precioUsd: servicio.precioUsd,
    correo: datos.correo,
    urlBase: URL_SITIO,
    servicioId: servicio.id,
  });
}
