/**
 * CÓMO SE COBRA LA SESIÓN.
 *
 * Por Zelle, a mano. No hay pasarela: la persona aparta su hora, ve estos
 * datos, hace la transferencia desde su banco y le manda la captura a Henry
 * por WhatsApp.
 *
 * ── Lo que esto NO hace, y es lo importante ──
 *
 * Aquí no se pide ni un dato financiero. Ni número de cuenta, ni tarjeta, ni
 * nada que se le parezca: sólo se ENSEÑA a dónde mandar el dinero. El pago
 * ocurre entero dentro del banco de cada uno, y este sitio no lo toca ni lo
 * ve. Por eso no hace falta ninguna pasarela para empezar a cobrar, y por
 * eso el producto no entra en el alcance de PCI DSS.
 *
 * ── Lo que tampoco hace ──
 *
 * Comprobar que se ha pagado. No hay forma: Zelle no avisa a nadie más que
 * al banco de Henry. La cita queda apartada en cuanto se pulsa el botón,
 * pagada o no, y es él quien confirma. La pantalla lo dice con esas palabras
 * en vez de dar a entender que el sistema lo sabe.
 *
 * ── Estos datos hay que verificarlos ──
 *
 * Un dígito mal en el número manda el dinero de otra persona a un
 * desconocido, y Zelle es de los pagos que NO se pueden revertir. Cualquiera
 * que toque este archivo tiene que confirmar los datos con Henry antes, no
 * después.
 */

/** Tal y como aparece en su cuenta. Si no coincide, el banco puede parar el envío. */
export const ZELLE_NOMBRE = "Jimy Henry Orellana Dominguez";

/** Para leerlo y teclearlo en la app del banco. */
export const ZELLE_TELEFONO = "(801) 941-3479";

/** El mismo número, en crudo: es lo que se copia y lo que abre WhatsApp. */
export const ZELLE_TELEFONO_CRUDO = "8019413479";

/** Con el código de país, como lo quiere `wa.me`. */
export const WHATSAPP_HENRY = "18019413479";

/** Lo que cuesta la sesión. El precio se escribe AQUÍ y en ningún otro
 *  sitio: cuando estaba repetido por las pantallas, cambiarlo era buscar
 *  cuatro literales sueltos y rezar por no dejarse uno. */
export const PRECIO_USD = 50;

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
    ? `Hola Henry, aparté mi sesión para ${cuando} y aquí te mando el comprobante del pago.`
    : "Hola Henry, aparté mi sesión y aquí te mando el comprobante del pago.";
  return `https://wa.me/${WHATSAPP_HENRY}?text=${encodeURIComponent(texto)}`;
}
