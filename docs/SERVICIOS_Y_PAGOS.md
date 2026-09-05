# Audiencias y asesoría personalizada

La landing de Henry añade una asesoría; no sustituye las preparaciones de audiencia.

| Servicio | Identificador | Precio USD |
| --- | --- | --- |
| Primera audiencia · Preliminar | primera | 70 |
| Segunda audiencia · Preliminar | segunda | 150 |
| Tercera audiencia · Mérito | tercera | 250 |
| Asesoría personalizada con Henry | asesoria | 70 |

`/links` conserva el selector de tres audiencias y los proyectos externos. La tarjeta adicional de asesoría abre la landing `/`. Cada audiencia entra por `/reservar?servicio=…`; `/reservar` sin parámetro abre la asesoría. Los identificadores desconocidos producen un 404.

La reserva y el checkout resuelven el precio desde el catálogo del servidor. Se conserva `pedir_hora`, el código de solicitud para Zelle, Stripe, sus webhooks, la conciliación y la agenda compartida. No se generan pagos ni reservas reales en las pruebas.

La migración `0015_asesoria_independiente.sql` amplía únicamente las restricciones de servicio de `citas` y `solicitudes_pago`. Se aplicó y se verificó en AgendaRutadeInmigrante el 5 de septiembre de 2026. No modifica registros históricos ni permisos. Las reservas anteriores identificadas como `primera` se mantienen como primera audiencia; no se puede inferir si una solicitud creada mientras estuvo publicada la versión incorrecta pertenecía a la asesoría sin revisar su contexto.

Las pruebas cubren los cuatro importes de checkout, la creación de solicitudes de cada servicio con el código para pago, el rechazo de identificadores desconocidos y la conservación de los enlaces originales.
