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

  /*
   * Para probar en un teléfono de la misma red mientras se desarrolla. Sin
   * esto, Next 16 bloquea los scripts de desarrollo a cualquier origen que no
   * sea `localhost`: la página se ve en el teléfono, pero no responde — ni el
   * menú, ni la reserva. `*.local` es el nombre de la Mac en la red (Bonjour),
   * que no cambia cuando el router reparte otra IP. Sólo afecta a `next dev`.
   */
  allowedDevOrigins: ["*.local", "192.168.*.*"],
};

export default nextConfig;
