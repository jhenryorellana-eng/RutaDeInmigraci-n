import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Navegacion } from "@/components/panel/navegacion";
import { RegistrarApp } from "@/components/panel/registrar-app";
import { clienteServidor, hayBase } from "@/lib/supabase/servidor";

/**
 * LA GUARDA Y LA CABECERA DEL PANEL.
 *
 * Está en un grupo de rutas `(agenda)` y no en `app/panel/` a secas por un
 * motivo concreto: `/panel/entrar` cuelga de `/panel` y, si compartiera este
 * layout, la guarda lo mandaría a iniciar sesión desde la propia pantalla de
 * iniciar sesión. Un grupo no aparece en la URL, así que `/panel`,
 * `/panel/horario` y `/panel/personas` siguen donde estaban y `entrar` queda
 * fuera.
 *
 * ── Dónde está la seguridad de verdad ──
 *
 * Aquí NO. Esto sólo decide qué pantalla se pinta. Aunque alguien se saltara
 * esta comprobación, la base no le devolvería ni una fila: las políticas de
 * `citas` sólo dejan leer a quien está en `administradores`, y las de
 * `cierres` y `horario` sólo dejan escribir a esa misma gente.
 */
export const dynamic = "force-dynamic";

export default async function LayoutAgenda({ children }: { children: ReactNode }) {
  if (!hayBase) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-16">
        <h1 className="font-titulo text-[32px] font-semibold">Falta conectar la base</h1>
        <p className="mt-4 text-tinta-suave">
          Pon <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en <code>.env.local</code> y
          vuelve a cargar. Están en el panel de Supabase, en Project settings →
          API.
        </p>
      </main>
    );
  }

  const supabase = await clienteServidor();
  const { data: sesion } = await supabase.auth.getUser();
  if (!sesion.user) redirect("/panel/entrar");

  const { data: esAdmin } = await supabase.rpc("es_admin");
  if (!esAdmin) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-16">
        <h1 className="font-titulo text-[32px] font-semibold">
          Esta cuenta no es de Henry
        </h1>
        <p className="mt-4 text-tinta-suave">
          Entraste con {sesion.user.email}, que no está en la tabla de
          administradores. Si eres Henry y ves esto, falta añadir tu id de
          usuario a <code>administradores</code> — está explicado en el README.
        </p>
        <form action="/panel/salir" method="post" className="mt-6">
          <button className="min-h-11 rounded-xl border border-white/25 px-4 text-[15px]">
            Salir
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 pb-28 sm:px-6 md:pb-10">
      <RegistrarApp />
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-white/15 py-4">
        <div className="flex items-center gap-6">
          <span className="text-[19px] font-extrabold tracking-tight">
            ANDEX{" "}
            <span className="text-[11px] font-medium tracking-[0.16em] text-tinta-tenue">
              AGENDA
            </span>
          </span>
          <Navegacion className="hidden md:flex" />
        </div>
        <form action="/panel/salir" method="post" className="flex items-center gap-3">
          <span className="hidden text-[15px] text-tinta-tenue sm:inline">
            {sesion.user.email}
          </span>
          <button className="min-h-11 rounded-xl border border-white/25 px-4 text-[15px]">
            Salir
          </button>
        </form>
      </header>

      {children}

      {/* En el teléfono la navegación baja al pie: es donde llega el pulgar. */}
      <Navegacion className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-1 border-t border-white/12 bg-panel px-3 pb-5 pt-2.5 md:hidden" />
    </div>
  );
}
