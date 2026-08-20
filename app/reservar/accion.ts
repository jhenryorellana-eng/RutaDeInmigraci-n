"use server";

import { apartarCita, type DatosCita, type Resultado } from "@/lib/citas";

/**
 * La acción que aparta la hora.
 *
 * Vive en el servidor a propósito: los datos de quien reserva —nombre,
 * correo, nacionalidad, si está o no en EE. UU.— no dan una vuelta por
 * ningún sitio más. Y NADA de esto viaja por la URL: una dirección queda en
 * el historial, en el portapapeles de quien la copia y en los registros de
 * cualquier proxy por el que pase.
 */
export async function reservar(datos: DatosCita): Promise<Resultado> {
  return apartarCita(datos);
}
