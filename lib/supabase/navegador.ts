"use client";

import { createBrowserClient } from "@supabase/ssr";

import { CLAVE_PUBLICA, URL_SUPABASE } from "./constantes";

/** Cliente del navegador. Sólo lo usa la entrada de Henry, para iniciar sesión. */
export function clienteNavegador() {
  return createBrowserClient(URL_SUPABASE, CLAVE_PUBLICA);
}
