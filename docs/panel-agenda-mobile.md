# Agenda móvil y recordatorios

La interfaz del panel permite abrir un formulario desde **Agendar**, consultar
los siete días de la semana y tocar una cita o evento para editarlo. Los eventos
que coinciden con una cita y las citas fuera del horario público siguen visibles.

Las citas existentes sólo permiten corregir nombre, WhatsApp y fecha/hora.
El servicio, importe, referencia, método y estado del pago permanecen intactos.
Las reservas pendientes de pago mantienen su hora hasta confirmar el pago.
Los registros manuales siguen en `eventos`, como antes. Eliminar un evento requiere
una confirmación expresa; tocarlo abre el editor. Las fechas siempre usan Utah.

## Estado de activación

Las dos migraciones se aplicaron en producción el 8 de septiembre de 2026,
con autorización del propietario. El editor está activo y se comprobó un alta
real desde el formulario móvil. La interfaz consulta `version_editor_agenda()`
para mostrar un aviso claro en entornos que todavía no tengan la actualización.

La migración `supabase/migrations/20260908044501_agenda_editor_recordatorios.sql`:

- Añade versiones de edición para detectar cambios desde otro dispositivo.
- Valida solapamientos de citas y eventos dentro de una transacción.
- Mantiene `HORA_TOMADA` en la conciliación si se ocupa una hora mientras se paga.
- Añade preferencias por dispositivo, cola de entregas y cron cada minuto.
- No elimina ni reemplaza citas, eventos, cierres o pagos existentes.

La migración `supabase/migrations/20260908052536_autenticar_recordatorios_en_base.sql`
permite validar el secreto del cron contra su fuente en la base, sin rotar
credenciales compartidas con pagos. La función sólo devuelve un booleano, usa
`security invoker` y sólo puede ejecutarla `service_role`, que ya tenía acceso a
esa fuente. Se verificó que `anon` y `authenticated` no pueden ejecutarla.

Antes y después de aplicar las migraciones se compararon las huellas de todos
los campos originales: las **14 citas, 9 eventos y 9 cierres** permanecieron
idénticos. El único registro añadido fue una cita manual solicitada expresamente.

La función Edge está desplegada y el cron corre cada minuto. La autenticación
y las tres variables VAPID quedaron configuradas el 8 de septiembre de 2026.
La ejecución automática de las 05:59 UTC respondió **HTTP 200, sin errores**.
La clave pública se sincronizó en la copia local y en los dos despliegues de
producción de este repositorio, incluido `links.usalatinoprime.com`.
No había dispositivos registrados al configurar el par de claves.
**Falta comprobar la recepción en el teléfono de Henry:** el funcionamiento
del worker no equivale a una confirmación de entrega en un dispositivo.

## Recordatorios PWA

Cada dispositivo elige cinco minutos antes, al empezar o sin recordatorio.
Los avisos de nuevas reservas se conservan. Los recordatorios incluyen reservas
confirmadas y eventos manuales; los nombres y notas no aparecen en la pantalla
bloqueada. Los enlaces abren `/panel` y requieren la sesión del administrador.

El servidor reclama las entregas con un arrendamiento y vuelve a verificar que
la cita siga vigente antes de enviarlas. La clave única evita volver a reclamar
entregas confirmadas; las etiquetas estables agrupan una repetición si falla el
acuse del proveedor. Los errores temporales se reintentan hasta tres veces,
los dispositivos expirados se retiran y los avisos caducan dos minutos después
de la hora. Una reprogramación invalida el aviso anterior.

Se usan las variables Edge `VAPID_PUBLICA`, `VAPID_PRIVADA` y `VAPID_CONTACTO`.
El contacto VAPID usa la URL HTTPS del sitio, un formato admitido por Web Push.
La pública debe coincidir con `NEXT_PUBLIC_VAPID_PUBLICA` del frontend. Hay que
configurar el par original si está disponible; no sustituir unilateralmente
claves de dispositivos registrados. Ninguna clave privada se incluye en el
cliente. El nuevo worker valida `x-aviso-secreto` mediante el RPC exclusivo del
servidor; no altera el `AVISO_SECRETO` utilizado por servicios anteriores.
El botón **Probar notificación** solicita una prueba al dispositivo actual y
tiene un límite de una por minuto. No confirma entrega hasta que el usuario
compruebe el aviso en su teléfono.

En iPhone se necesita iOS 16.4 o posterior, instalar desde Safari en la pantalla
de inicio y activar los permisos desde la app instalada. La entrega depende del
proveedor, conexión y ajustes del sistema; no se promete puntualidad al segundo.
La entrega en un teléfono físico sigue pendiente de comprobar.

## Permisos revisados

El asesor de Supabase señala dos decisiones intencionadas de esta mejora:
la [cola privada sin políticas de cliente](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
queda cerrada por RLS, y la [función de prueba con privilegios elevados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
verifica administrador, propiedad del dispositivo y límite de frecuencia dentro
de la base. El rol anónimo no puede invocarla. La corrección de autenticación
del cron no añadió advertencias del asesor.

## Verificación reproducible sin producción

```powershell
npm test
npm run typecheck
npm run build
npm install --prefix tmp/agenda-verificacion --no-save --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.8
node scripts/verificar-agenda-local.mjs
```

El script abre PostgreSQL en memoria, aplica todas las migraciones y verifica
creación, edición, reprogramación, RLS, conflictos, protección de pagos, la cola,
reprogramación de avisos y preferencias. Sólo reemplaza el transporte HTTP y cron
por dobles locales; un reloj controlado permite probar ventanas de envío exactas.
No se conecta a Supabase ni usa datos de clientes. El SQL transaccional está en
`supabase/tests/agenda_editor.sql` y revierte todos sus registros sintéticos.

Para comprobar el teléfono, abrir `https://links.usalatinoprime.com/panel`,
instalar la PWA si corresponde y activar **Que no se te pase una cita**. Elegir
cinco minutos antes o al empezar, y pulsar **Probar notificación**. Comprobar
también un recordatorio a cinco minutos y otro al comienzo en un entorno de
prueba, sin modificar las citas de clientes. Los secretos privados permanecen
en Supabase y fuera de Git; Vercel recibe únicamente la clave pública VAPID.
