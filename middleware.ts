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
 */
export async function middleware(req: NextRequest) {
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
