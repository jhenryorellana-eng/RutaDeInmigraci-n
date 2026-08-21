/**
 * Las dos variables públicas, en un archivo sin `next/headers`.
 *
 * Existe para que el cliente del navegador pueda leerlas sin arrastrar
 * `servidor.ts` —que importa `cookies()`— al paquete del navegador. Ese
 * import rompe la compilación con un error que no menciona cookies por
 * ninguna parte.
 */
export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * La clave pública, con sus DOS nombres.
 *
 * Supabase está cambiando de claves: las de siempre (`anon`, un JWT que
 * empieza por `eyJ`) y las nuevas (`sb_publishable_…`, que se pueden rotar
 * por su cuenta). Su panel ya ofrece la nueva con el nombre
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, mientras que medio internet y este
 * proyecto usaban `..._ANON_KEY`.
 *
 * Se aceptan las dos a propósito. Copiar la variable del panel de Supabase
 * con su nombre nuevo es lo que cualquiera haría al desplegar, y el fallo
 * que produce es de los peores: el sitio ARRANCA, se ve entero, y sólo se
 * descubre que no hay base cuando alguien intenta apartar una hora.
 *
 * Los dos accesos van escritos enteros y no con `process.env[nombre]`: Next
 * sustituye estas expresiones por su valor al compilar, y sólo sabe hacerlo
 * cuando el nombre está escrito literalmente. Con un índice variable, en el
 * navegador llegaría `undefined`.
 */
export const CLAVE_PUBLICA =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const hayBase = URL_SUPABASE.length > 0 && CLAVE_PUBLICA.length > 0;
