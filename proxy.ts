import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { CLAVE_PUBLICA, URL_SUPABASE, hayBase } from "@/lib/supabase/constantes";

/**
 * Refresca la sesión de Henry en cada petición al panel.
 *
 * Sin esto, el token caduca y el panel manda a la entrada a media mañana sin
 * que él haya hecho nada. Sólo corre en `/panel`: la parte pública no tiene
 * sesión que refrescar y no hay razón para tocar cookies de quien sólo viene
 * a apartar una hora.
 *
 * ── Por qué el archivo se llama `proxy.ts` y no `middleware.ts` ──
 *
 * Next 16 renombró la convención. El nombre viejo sigue funcionando pero
 * avisa en cada arranque, y un aviso que se ignora todos los días deja de
 * leerse — incluido el día que diga algo importante.
 *
 * ── Y lo que esto NO es ──
 *
 * NO es la seguridad del panel. Aquí sólo se refresca un token. Quien decide
 * si Henry ve algo son las políticas de la base: `citas` sólo deja leer a
 * quien esté en `administradores`. Esa diferencia dejó de ser teórica en
 * 2025, cuando se descubrió que en Next se podía saltar el middleware con
 * una cabecera. A este panel eso no le habría dado acceso a una sola fila.
 */
export async function proxy(req: NextRequest) {
  if (!hayBase) return NextResponse.next();

  let respuesta = NextResponse.next({ request: req });

  const supabase = createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(nuevas: { name: string; value: string; options: CookieOptions }[]) {
        for (const { name, value } of nuevas) req.cookies.set(name, value);
        respuesta = NextResponse.next({ request: req });
        for (const { name, value, options } of nuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return respuesta;
}

export const config = {
  matcher: ["/panel/:path*"],
};
