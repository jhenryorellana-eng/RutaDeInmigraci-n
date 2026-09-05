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
export function enlaceWhatsapp(cuando?: string): string {
  const texto = cuando
    ? `Hola Henry, solicité mi sesión para ${cuando}. Quisiera coordinar su confirmación.`
    : "Hola Henry, quisiera coordinar la confirmación de mi sesión.";
  return `https://wa.me/${WHATSAPP_HENRY}?text=${encodeURIComponent(texto)}`;
}
