/** Datos públicos de pago y contacto. Conservar los datos del destinatario verificados. */

/** Tal y como aparece en su cuenta. Si no coincide, el banco puede parar el envío. */
export const ZELLE_NOMBRE = "Jimy Henry Orellana Dominguez";

/** Para leerlo y teclearlo en la app del banco. */
export const ZELLE_TELEFONO = "(385) 456-4470";

/** El mismo número, en crudo: es lo que se copia y lo que abre WhatsApp. */
export const ZELLE_TELEFONO_CRUDO = "3854564470";

/** Con el código de país, como lo quiere `wa.me`. */
export const WHATSAPP_HENRY = "13854564470";

/* El precio de la asesoría vive en lib/servicios.ts. */

/** Donde la pantalla de reserva deja la cita para la de pago. */
export const CLAVE_CITA = "ruta_cita_apartada";

/**
 * El enlace de WhatsApp con el mensaje ya escrito.
 *
 * Lleva el día y la hora porque a Henry le sirven para encontrar la cita, y
 * porque son lo que la persona escribiría de todos modos. Lo que NO lleva es
 * su nombre ni su correo: eso ya está en el panel, y una dirección se queda
 * en el historial del teléfono y en el portapapeles de quien la copie.
 *
 * Y lleva la hora de UTAH a secas, sin el «donde estás». La pantalla enseña
 * las dos porque a quien reserva le hacen falta las dos; este mensaje lo lee
 * Henry, que no sabe dónde está esa persona y para quien una segunda hora
 * entre paréntesis sólo es una hora más que no cuadra con su agenda.
 */
export function enlaceWhatsapp(cuando?: string, tema?: string): string {
  const texto = cuando
    ? `Hola Henry, solicité mi sesión para ${cuando}. Quisiera coordinar su confirmación.`
    : "Hola Henry, quisiera coordinar la confirmación de mi sesión.";
  return aWhatsapp(tema ? `${texto}\nMi punto de partida: ${tema}` : texto);
}

/**
 * El comprobante de Zelle, con el código de pago delante.
 *
 * El código es lo que une la transferencia con la solicitud cuando el
 * memo llega vacío o mal escrito: sin él, Henry tiene que adivinar de quién
 * es un pago de $70 entre varios del mismo importe.
 */
export function enlaceComprobante(datos: {
  codigo: string;
  servicio: string;
  cuando?: string;
  tema?: string;
}): string {
  const lineas = [
    "Hola Henry, te envío el comprobante de mi pago por Zelle.",
    `Código: ${datos.codigo}`,
    datos.cuando ? `${datos.servicio} · ${datos.cuando}` : datos.servicio,
  ];
  if (datos.tema) lineas.push(`Mi punto de partida: ${datos.tema}`);
  return aWhatsapp(lineas.join("\n"));
}

/** Cambiar la hora sigue pasando por Henry; esto le ahorra a la persona redactarlo. */
export function enlaceCambioDeHora(cuando?: string): string {
  return aWhatsapp(
    cuando
      ? `Hola Henry, tengo una sesión para ${cuando} y necesito cambiar la hora. ¿Qué otras opciones hay?`
      : "Hola Henry, necesito cambiar la hora de mi sesión. ¿Qué otras opciones hay?",
  );
}

export function enlacePregunta(): string {
  return aWhatsapp("Hola Henry, tengo una pregunta sobre la preparación de mi audiencia.");
}

function aWhatsapp(texto: string): string {
  return `https://wa.me/${WHATSAPP_HENRY}?text=${encodeURIComponent(texto)}`;
}
