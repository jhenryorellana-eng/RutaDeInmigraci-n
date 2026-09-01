import { redirect } from "next/navigation";

/**
 * «Mi horario» dejó de ser una pantalla.
 *
 * Lo que había aquí vive ahora dentro del calendario, plegado bajo «Mis
 * horas y mis ausencias»: era una pantalla que obligaba a cambiar de sitio
 * para responder preguntas que se hacen mirando la semana.
 *
 * No se borra el archivo, se redirige. Henry tiene la agenda instalada en el
 * teléfono y puede tener esta dirección guardada o abierta; un 404 ahí sería
 * pensar que se rompió algo.
 */
export default function HorarioMudado() {
  redirect("/panel");
}
