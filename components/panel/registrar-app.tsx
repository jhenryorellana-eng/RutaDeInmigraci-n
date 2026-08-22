"use client";

import { useEffect } from "react";

/**
 * REGISTRA EL SERVICE WORKER.
 *
 * Sin esto, el navegador no ofrece instalar la app: el manifiesto dice cómo
 * se llama y qué icono lleva, pero hasta que no hay un service worker activo
 * no aparece el «añadir a pantalla de inicio».
 *
 * Va montado sólo dentro del panel y no en el sitio público, que es donde
 * tiene sentido: quien reserva llega por un enlace, aparta su hora y no
 * vuelve — no tiene nada que instalar. La app es la herramienta de Henry.
 *
 * Los fallos se tragan a propósito. En una ventana privada, con el
 * almacenamiento bloqueado o sobre HTTP sin cifrar, `register` lanza; y que
 * el panel no se pueda instalar no es motivo para que reviente la pantalla
 * que enseña las citas de hoy.
 */
export function RegistrarApp() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const alCargar = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Sin app instalable, pero el panel sigue funcionando. */
      });
    };

    /* Después de `load` y no durante el render: registrarlo mientras la
       página aún está pintando compite por el mismo hilo con lo que Henry
       ha venido a ver. */
    if (document.readyState === "complete") alCargar();
    else window.addEventListener("load", alCargar, { once: true });

    return () => window.removeEventListener("load", alCargar);
  }, []);

  return null;
}
