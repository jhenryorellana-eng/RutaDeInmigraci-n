/**
 * Las dos variables públicas, en un archivo sin `next/headers`.
 *
 * Existe para que el cliente del navegador pueda leerlas sin arrastrar
 * `servidor.ts` —que importa `cookies()`— al paquete del navegador. Ese
 * import rompe la compilación con un error que no menciona cookies por
 * ninguna parte.
 */
export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const hayBase = URL_SUPABASE.length > 0 && CLAVE_PUBLICA.length > 0;
