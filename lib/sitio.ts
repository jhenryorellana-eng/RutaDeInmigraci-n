/**
 * EN QUÉ DIRECCIÓN VIVE ESTE SITIO.
 *
 * Existe por las vistas previas de los enlaces. Cuando Henry pega su enlace
 * en WhatsApp, WhatsApp entra a la página, lee sus etiquetas y pinta la
 * tarjeta con la foto y el texto. Para traerse la foto necesita una
 * dirección ABSOLUTA —`https://…/og-links.jpg`—, y una ruta relativa como
 * `/og-links.jpg` no le dice desde qué servidor pedirla: la descarta y
 * enseña un enlace pelado.
 *
 * Next construye esas direcciones absolutas a partir de `metadataBase`, y
 * ese es el único trabajo de este archivo: decir cuál es.
 *
 * ── Por qué son tres intentos y no una constante ──
 *
 * Porque escribir el dominio a mano en el código es la clase de dato que se
 * queda viejo el día que cambie, y entonces la vista previa se rompe sin que
 * nadie lo note: la página sigue funcionando, sólo que el enlace compartido
 * deja de traer la foto.
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — el dominio de verdad, cuando lo haya. Es el
 *      que manda, y es donde hay que poner `https://rutadelinmigrante.com` o
 *      el que se acabe usando.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — lo pone Vercel solo, en todos los
 *      despliegues, apuntando al dominio de producción. Así la vista previa
 *      funciona desde el primer despliegue sin configurar nada.
 *   3. `localhost` — en desarrollo. Ahí la vista previa no va a funcionar de
 *      todos modos, porque WhatsApp no puede entrar a tu portátil.
 *
 * Vercel da el dominio SIN el `https://`, así que se lo ponemos nosotros.
 */
export const URL_SITIO: string =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
