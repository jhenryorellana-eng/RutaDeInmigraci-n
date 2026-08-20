import { NextResponse, type NextRequest } from "next/server";

import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Cerrar sesión.
 *
 * Sólo POST: con GET, cualquier imagen o enlace de un tercero podría sacar a
 * Henry de su propia agenda sin que él tocara nada.
 */
export async function POST(req: NextRequest) {
  const supabase = await clienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/panel/entrar", req.url), { status: 303 });
}
