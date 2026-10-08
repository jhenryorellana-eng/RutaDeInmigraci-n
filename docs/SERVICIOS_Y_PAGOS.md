# Preparaciones de audiencia

Sólo se ofrecen y se cobran dos servicios, y sus precios viven en `lib/servicios.ts`. Ninguna pantalla escribe una cifra a mano: todas leen el catálogo, y «desde» sale de `PRECIO_DESDE`.

| Servicio | Identificador | Precio USD |
| --- | --- | --- |
| Segunda audiencia · Preliminar | segunda | 150 |
| Tercera audiencia · Mérito | tercera | 350 |

`/links` enseña tres tarjetas: la preparación de audiencia (abre la hoja con las dos opciones), La ruta del inmigrante (la landing `/`) y Servicio Migratorio (Contygo). Comunidad Andex y el bootcamp de Starbiz se quitaron por ahora; el historial de git los conserva. Cada audiencia entra por `/reservar?servicio=…`; `/reservar` sin parámetro enseña primero las dos preparaciones para elegir. Los identificadores desconocidos producen un 404.

La reserva y el checkout resuelven el precio desde el catálogo del servidor. Se conserva `pedir_hora`, el código de solicitud para Zelle, Stripe, sus webhooks, la conciliación y la agenda compartida. No se generan pagos ni reservas reales en las pruebas.

## Servicios retirados

La primera audiencia ($70) y la asesoría personalizada ($70) ya no se ofrecen: `/reservar?servicio=primera` y `/reservar?servicio=asesoria` dan 404 y no se pueden cobrar. El panel sigue nombrando las reservas antiguas con esos identificadores («Primera audiencia», «Asesoría personalizada») mediante `nombreDeServicio`, y conserva el precio con el que se apartaron.

No hizo falta tocar la base: las restricciones de `citas` y `solicitudes_pago` (migración `0015_asesoria_independiente.sql`) siguen admitiendo los cuatro identificadores para que los registros históricos sigan siendo válidos.

Las pruebas cubren los importes de checkout de las dos preparaciones, la creación de solicitudes con el código para pago, el rechazo de identificadores desconocidos y retirados, y los enlaces de `/links`.
