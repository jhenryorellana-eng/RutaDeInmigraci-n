import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  /*
   * Next 16 escribe por su cuenta un `AGENTS.md` y un `CLAUDE.md` en la raíz
   * cada vez que arranca, con instrucciones para asistentes de código. El
   * contenido es inofensivo —avisa de que esta versión rompe APIs respecto a
   * la anterior— pero es una herramienta metiendo en el repo instrucciones
   * que no ha escrito nadie del equipo, y recreándolas en cada arranque.
   *
   * Aquí las reglas las pone quien escribe el código, así que se apaga.
   */
  agentRules: false,
};

export default nextConfig;
