"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { clienteNavegador } from "@/lib/supabase/navegador";

/** Correo y contraseña. Nada más. */
export function Entrada() {
  const router = useRouter();
  const [enCurso, empezar] = useTransition();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  function entrar() {
    setError(null);
    empezar(async () => {
      const { error: fallo } = await clienteNavegador().auth.signInWithPassword({
        email: correo.trim().toLowerCase(),
        password: clave,
      });
      if (fallo) {
        /* El mensaje no distingue entre «ese correo no existe» y «esa
           contraseña está mal»: decirlo sirve para averiguar qué correos
           tienen cuenta aquí, que es justo lo que no interesa. */
        setError("Ese correo o esa contraseña no son correctos.");
        return;
      }
      router.replace("/panel");
      router.refresh();
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-2.5">
      <label className="block">
        <span className="sr-only">Tu correo</span>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Tu correo"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-[56px] w-full rounded-2xl bg-white/[0.07] px-4 text-[17px] outline-none placeholder:text-tinta-tenue"
        />
      </label>
      <label className="block">
        <span className="sr-only">Tu contraseña</span>
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          className="min-h-[56px] w-full rounded-2xl bg-white/[0.07] px-4 text-[17px] outline-none placeholder:text-tinta-tenue"
        />
      </label>

      {error ? (
        <p role="alert" className="text-[15px] leading-[1.45] text-aviso">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={entrar}
        disabled={enCurso || !correo || !clave}
        className="mt-2 flex min-h-[58px] w-full items-center justify-center rounded-full bg-acento text-[18px] font-extrabold text-fondo disabled:opacity-40"
      >
        {enCurso ? "Entrando…" : "Entrar"}
      </button>
    </div>
  );
}
