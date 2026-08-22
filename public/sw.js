/*
 * EL SERVICE WORKER.
 *
 * Hace dos cosas y a propósito ninguna más:
 *
 *   1. existir, que es lo que el navegador exige para dejar instalar la app;
 *   2. recibir las notificaciones cuando estén encendidas.
 *
 * ── Lo que NO hace: cachear páginas ──
 *
 * Y es deliberado. Un service worker que guarda páginas puede servir una
 * versión vieja durante días, y aquí las pantallas dicen QUIÉN VIENE HOY y
 * A QUÉ HORA. Una agenda de ayer servida con confianza es peor que una
 * pantalla que tarda dos segundos en cargar: Henry se presentaría a una cita
 * que ya se canceló, o no se presentaría a una nueva.
 *
 * Cuando haga falta que funcione sin cobertura, se cachea el armazón —los
 * estilos, la tipografía— y NUNCA los datos.
 */

self.addEventListener("install", () => {
  // Sin espera: la versión nueva manda desde el primer momento.
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});

/*
 * Un aviso que llega del servidor.
 *
 * El cuerpo viene en JSON. Si viniera roto o vacío se enseña algo genérico
 * en vez de tragarse el error: una notificación muda es peor que una vaga,
 * porque el teléfono ya vibró y quien lo mira no encuentra nada.
 */
self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = {};
  }

  const titulo = datos.titulo || "Tienes una cita nueva";
  const opciones = {
    body: datos.cuerpo || "Alguien acaba de apartar una hora.",
    icon: "/icono-192.png",
    badge: "/icono-192.png",
    lang: "es",
    /* Con la misma etiqueta, dos avisos seguidos se apilan en uno en vez de
       llenar la pantalla de bloqueo. */
    tag: datos.etiqueta || "cita",
    data: { url: datos.url || "/panel" },
  };

  evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

/*
 * Al tocar el aviso: si la agenda ya está abierta en alguna ventana, se trae
 * esa al frente en vez de abrir otra. Abrir una segunda copia de la misma
 * app es de las cosas que hacen que una PWA se sienta rota.
 */
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/panel";

  evento.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((ventanas) => {
        for (const v of ventanas) {
          if (v.url.includes(destino) && "focus" in v) return v.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(destino);
      }),
  );
});
