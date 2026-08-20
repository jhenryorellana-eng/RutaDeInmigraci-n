import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * LOS CLIENTES DE SUPABASE.
 *
 * ── Qué clave usa cada uno, y por qué importa ──
 *
 * Todo lo que hace esta aplicación pasa por la clave PÚBLICA (`anon`), que
 * es la que puede vivir en el navegador. La `service_role` no aparece en
 * ninguna parte de este proyecto: se salta el RLS entero, y aquí el RLS es
 * lo único que impide que alguien lea el nombre, el correo y la nacionalidad
 * de todas las personas que han apartado una cita.
 *
 * Con `anon` la base ya deja hacer exactamente lo que hace falta:
 *   · insertar una cita (cinco columnas, y sólo esas)
 *   · preguntar qué horas están ocupadas, que devuelve instantes y nada más
 *
 * Lo demás lo abre la sesión de Henry, y lo abre la BASE, no este código.
 */

export { URL_SUPABASE, CLAVE_PUBLICA, hayBase } from "./constantes";
import { CLAVE_PUBLICA, URL_SUPABASE } from "./constantes";

/** Cliente de servidor con la sesión del visitante, si la hay. */
export async function clienteServidor() {
  const almacen = await cookies();

  return createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(nuevas: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of nuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          /* Un Server Component no puede escribir cookies. Lo hace el
             middleware; aquí se ignora en vez de reventar el render. */
        }
      },
    },
  });
}
