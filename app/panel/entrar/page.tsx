import { Entrada } from "@/components/entrada";

/**
 * La puerta de Henry.
 *
 * Correo y contraseña. Sin registro público: la única forma de que exista
 * una cuenta aquí es que alguien la cree desde el panel de Supabase, y la
 * única forma de que esa cuenta vea algo es que su id esté en
 * `administradores`. Un formulario de alta abierto en una agenda con datos
 * de personas migrantes es una puerta que no hace falta abrir.
 */
export default function EntrarAlPanel() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-6 py-10">
      <span className="text-[20px] font-extrabold tracking-tight">ANDEX</span>
      <h1 className="mt-8 font-titulo text-[34px] font-semibold leading-[1.1]">
        La agenda
      </h1>
      <p className="mt-3 text-[17px] text-tinta-suave">
        Entra para ver tus citas y abrir o cerrar horas.
      </p>
      <Entrada />
    </main>
  );
}
