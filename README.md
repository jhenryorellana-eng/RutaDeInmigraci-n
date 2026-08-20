# La ruta del inmigrante · citas

Sitio de una sola idea: **una pregunta, la respuesta de Henry, y apartar la
hora**. Vive aparte de ANDEX —su propio repo, su propia base y su propio
despliegue— y se enlaza desde la comunidad.

```
/            hoja 1 · la pregunta y la respuesta
/reservar    hoja 2 · día → hora → quién eres
/gracias     hoja 3 · listo
/panel       la agenda de Henry (requiere sesión + ser administrador)
```

---

## Por qué es un proyecto aparte

Esta base guarda **nacionalidad y ubicación de personas migrantes**. Metida
en la base de ANDEX —que ya tiene datos de familias en producción— un fallo
en este sitio nuevo alcanzaría a los datos del viejo. Separados, cada uno
responde de lo suyo.

**Aquí no se pregunta el estatus migratorio.** Ni en un campo, ni en una
nota, ni en un desplegable. «¿Ya estás en Estados Unidos?» es una pregunta de
ubicación y sirve para preparar la sesión; el estatus no se pregunta nunca.

---

## Poner en marcha

### 1 · La base

Crea un proyecto **nuevo** en [supabase.com](https://supabase.com) — nuevo, no
el de ANDEX — y corre la migración:

```bash
# Con el SQL Editor del panel de Supabase, o con la CLI:
supabase db push
```

La migración está en `supabase/migrations/0001_citas.sql` y deja montado:

- `citas` — con un **índice único parcial** en la hora, que es la defensa real
  contra la doble reserva. Dos personas pulsando a la vez sólo ganan una, y
  decide la base: comprobarlo en la aplicación no sirve, porque entre la
  comprobación y la escritura cabe la otra reserva.
- `cierres` — los tramos que Henry cierra a mano.
- Un **trigger** que rechaza citas fuera del horario, en horas cerradas o en
  el pasado. El horario está en la base y no sólo en la pantalla porque
  cualquiera con la clave pública puede llamar a la API sin pasar por aquí.
- **RLS en todo**, con esta forma:
  - el público **no puede leer `citas`**, ni una columna;
  - el público sólo puede **insertar cinco columnas** (`inicia_en`, `nombre`,
    `correo`, `nacionalidad`, `en_eeuu`) — permiso por columna, así que no
    puede inventarse el estado ni la fecha de creación;
  - para saber qué horas están ocupadas está `horas_ocupadas()`, que devuelve
    **instantes y nada más**: no puede filtrar los datos de nadie porque no
    los devuelve;
  - leer, cambiar o borrar citas es sólo de quien esté en `administradores`.

### 2 · Las variables

```bash
cp .env.example .env.local
```

Las dos salen de **Project settings → API** en Supabase. Son las públicas: la
`service_role` **no se usa en este proyecto y no debe ponerse aquí** — se
salta el RLS entero, que es lo único que impide leer los datos de todas las
personas que han apartado una cita.

### 3 · La cuenta de Henry

No hay registro público, y es a propósito: un alta abierta en una agenda con
estos datos es una puerta que no hace falta abrir.

1. En Supabase → **Authentication → Users → Add user**, con correo y
   contraseña.
2. Copia su `id` y márcalo como administrador:

```sql
insert into public.administradores (user_id)
values ('el-uuid-del-usuario');
```

Sin ese `insert`, la cuenta entra pero no ve nada — y así debe ser.

### 4 · Correr

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # el horario, que es lo que falla en silencio
npm run typecheck
```

---

## Desplegar en Vercel

1. Sube el repo a GitHub.
2. En Vercel, **Add New → Project**, elige el repo.
3. Pon `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en
   *Environment Variables*.
4. Desplegar.

Sin variables el sitio **sigue en pie**: enseña el horario y avisa de que la
agenda no está conectada. Es preferible a una pantalla rota, y sobre todo a
un botón que parece funcionar y no guarda nada.

---

## Lo que hay que saber para tocarlo

### El horario vive en dos sitios, y es adrede

`lib/horario.ts` decide **qué se pinta**. `dentro_del_horario()` en la
migración decide **qué se acepta**. Si cambias uno, cambia el otro — hay
pruebas de los dos lados y el cambio de hora de Utah está cubierto.

Lunes a viernes de 8:00 a 17:00 y sábados de 8:00 a 13:00, **hora de Utah**.
Sesiones de 45 minutos que empiezan en punto, así que la última entre semana
empieza a las 16:00 y el sábado a las 12:00.

La zona es `America/Denver`, nunca un desfase fijo: Utah cambia de hora dos
veces al año y un `-07` escrito a mano deja el horario corrido una hora
durante ocho meses.

### La hora, siempre dos veces

Cada hueco dice qué hora es en Utah **y** qué hora es donde está quien mira.
Media audiencia no está en Utah, y «11:00» sin apellido es una cita perdida.
La zona sale del navegador, **nunca de la IP**: una IP puede ser la de una
VPN o la de la biblioteca del pueblo de al lado.

### Nada del usuario viaja por la URL

Ni el correo, ni el nombre, ni la nacionalidad. Una dirección queda en el
historial, en el portapapeles de quien la copia y en los registros de
cualquier proxy por el que pase. Con este público eso es un riesgo real.

---

## Pendiente, y conviene tenerlo a la vista

- **El cobro de los $150 no está conectado.** La reserva funciona y no cobra.
  Cuando existan las credenciales de Stripe se enciende el paso de pago antes
  de confirmar; el hueco está previsto en `lib/citas.ts`.
- **No se manda ningún correo.** Ni la confirmación con el enlace de la
  videollamada ni el recordatorio. La pantalla de gracias ya lo promete, así
  que esto es lo primero que hay que resolver antes de publicar.
- **Sin límite de peticiones.** Nada impide que alguien aparte veinte horas
  seguidas con correos inventados. Mientras el volumen sea bajo se ve a
  simple vista en el panel; con más tráfico hará falta un límite de verdad.
- **La biografía de Henry.** Todo lo que dice la portada sobre él tiene que
  ser cierto antes de publicarse.
