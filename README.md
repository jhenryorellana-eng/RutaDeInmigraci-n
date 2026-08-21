# La ruta del inmigrante · citas

Sitio de una sola idea: **una pregunta, la respuesta de Henry, y apartar la
hora**. Vive aparte de ANDEX —su propio repo, su propia base y su propio
despliegue— y se enlaza desde la comunidad.

```
/                  hoja 1 · la pregunta y la respuesta
/reservar          hoja 2 · día → hora → quién eres
/gracias           hoja 3 · listo

/panel             el calendario de la semana        ┐
/panel/horario     los tramos de cada día            ├ requiere sesión
/panel/personas    quién ha apartado                 ┘ y ser administrador
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

Las migraciones están en `supabase/migrations/` y hay que aplicarlas **en
orden**: `0001_citas.sql` y después `0002_horario.sql`.

`0001` deja montado:

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

`0002` saca el horario del código y lo mete en una tabla:

- `horario` — un **tramo** por rato abierto, con su día de la semana. Un día
  puede tener varios, y ésa es toda la gracia: «de 8 a 1 y de 3 a 5» son dos
  tramos con un agujero en medio. Con una hora de apertura y otra de cierre
  eso no se podía decir, y era justo lo que hacía falta.
- El tramo es `[desde, hasta)`: la hora de cierre **no se ofrece**, porque una
  sesión que empezara ahí acabaría 45 minutos después de cerrar.
- `dentro_del_horario()` deja de llevar los números escritos y los lee de esa
  tabla. La defensa sigue exactamente donde estaba —en el trigger, que es lo
  único que no se puede saltar—, sólo cambia de dónde saca las horas.
- El horario **lo lee cualquiera** (es lo que se pinta en la pantalla de
  reserva) y **lo escribe sólo Henry**.
- Se siembra con el mismo horario que estaba escrito en `0001`, así que
  aplicarla no cambia el comportamiento de nada hasta que él toque algo.

Y una regla que conviene tener clara antes de tocar nada: **cambiar el
horario no borra las citas ya apartadas.** El trigger sólo corre al insertar,
así que si alguien apartó las 16:00 de un jueves y Henry cierra las tardes,
esa cita sigue en pie. Lo contrario sería que alguien que ya pagó se quedara
sin su sesión sin enterarse.

### 2 · Las variables

```bash
cp .env.example .env.local
```

Las dos salen de **Project settings → API** en Supabase. Son las públicas: la
`service_role` **no se usa en este proyecto y no debe ponerse aquí** — se
salta el RLS entero, que es lo único que impide leer los datos de todas las
personas que han apartado una cita.

La clave pública admite sus **dos nombres**, y da igual cuál uses:

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la nueva, `sb_publishable_…` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la de siempre, un JWT que empieza por `eyJ` |

Se aceptan las dos a propósito. El panel de Supabase ya ofrece la nueva con
ese nombre, así que copiarla tal cual es lo que cualquiera haría al
desplegar — y si sólo valiera el nombre viejo, el fallo sería de los peores:
el sitio **arranca, se ve entero y no conecta con nada**, y eso no se
descubre hasta que alguien intenta apartar una hora.

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
3. Pon `NEXT_PUBLIC_SUPABASE_URL` y la clave pública en *Environment
   Variables* — con cualquiera de sus dos nombres, los dos valen.
4. Desplegar.

Sin variables el sitio **sigue en pie**: enseña el horario y avisa de que la
agenda no está conectada. Es preferible a una pantalla rota, y sobre todo a
un botón que parece funcionar y no guarda nada.

---

## Lo que hay que saber para tocarlo

### El horario vive en dos sitios, y es adrede

`lib/horario.ts` decide **qué se pinta**. `dentro_del_horario()` en la
migración decide **qué se acepta**. Las dos leen ahora los mismos tramos de
la tabla `horario`, así que ya no pueden discrepar; lo que sigue duplicado es
la lógica de decidir, y eso es a propósito: cualquiera con la clave pública
puede llamar a la API sin pasar por la pantalla.

Ninguna de las funciones de `lib/horario.ts` sabe leer la base. Reciben los
tramos como argumento —`lib/tramos.ts` es el único sitio que consulta la
tabla— y por eso se pueden probar enteras sin base. `HORARIO_POR_DEFECTO` es
la red de un despliegue sin variables, **no** la fuente de verdad.

Sesiones de 45 minutos que empiezan en punto, en **hora de Utah**. La zona es
`America/Denver`, nunca un desfase fijo: Utah cambia de hora dos veces al año
y un `-07` escrito a mano deja el horario corrido una hora durante ocho
meses. Hay una prueba de que el 1 de noviembre de 2026 dura veinticinco
horas, que es la razón de que «cerrar el resto de hoy» calcule el final del
día con la fecha siguiente en vez de sumando 24 horas.

### Dos formas de cerrar, y no son la misma

- **Desde el calendario**, tocando o arrastrando: mete **una fila por hora**.
  Por eso una hora cerrada así se reabre tocándola otra vez.
- **Desde «días que se caen»**: mete **una sola fila** para todo el rato. Es
  para un viaje o un día que no, y se reabre de una pieza.

Tocar una hora de un cierre largo **no** lo deshace: reabriría de golpe algo
que se cerró de golpe, y sin avisar. La pantalla lo dice y remite a la lista.

### La hora, siempre dos veces

Cada hueco dice qué hora es en Utah **y** qué hora es donde está quien mira.
Media audiencia no está en Utah, y «11:00» sin apellido es una cita perdida.
La zona sale del navegador, **nunca de la IP**: una IP puede ser la de una
VPN o la de la biblioteca del pueblo de al lado.

### El panel, en tres pantallas

**`/panel` · Calendario.** La semana en una rejilla de días por horas. Cada
celda dice qué pasa con esa hora, y cerrar una es **tocarla**; arrastrando se
cierra un rato entero. En el teléfono no cabe una rejilla de seis columnas,
así que ahí se enseña **un día en vertical** con la tira de días arriba: son
dos vistas del mismo dato, no una encogida.

Las horas que **ningún** día ofrece pero caen dentro de la franja se pintan
como una banda que cruza la semana: eso es el descanso, y no se toca desde
aquí. Vale para todas las semanas, así que se cambia donde se ve que vale
para todas las semanas — un toque de más en un martes no puede borrar el
descanso de todos los martes.

**`/panel/horario` · Mi horario.** Los tramos de cada día, que se quitan con
la ✕ y se añaden con dos desplegables. A la derecha, el otro nivel: los días
sueltos que se caen. Están separados a propósito; juntarlos sería la forma
más rápida de cerrar todos los viernes del año queriendo cerrar uno.

**`/panel/personas` · Personas.** El archivo, buscable y descargable en CSV.
Ni un botón de acción: es una lista para consultar. Buscar y filtrar se hacen
en el navegador y **no tocan la URL** — lo que se teclea ahí es el nombre o el
correo de una persona migrante.

El CSV escapa con comillas según el RFC 4180 y además prefija con un apóstrofo
todo campo que empiece por `=`, `+`, `-` o `@`: sin eso, Excel y Sheets tratan
ese campo como una **fórmula**, y un nombre escrito con mala idea en el
formulario público acabaría ejecutándose en el ordenador de Henry.

La semana viaja por la URL como `?s=1`, y eso **no** rompe la regla de abajo:
es navegación, no un dato de nadie. No lleva nombres, ni correos, ni ids.

### El pago, y por qué va después de apartar

Se cobra por **Zelle**, a mano. Los datos están en `lib/pago.ts` y en ningún
otro sitio.

Aquí **no se pide ni un dato financiero**: sólo se enseña a dónde mandar el
dinero. El pago ocurre entero dentro del banco de cada uno, así que no hace
falta pasarela para empezar a cobrar y el producto no entra en el alcance de
PCI DSS.

El orden es **apartar primero, pagar después**, y es deliberado: pagar a mano
tarda —abrir la app del banco, buscar Zelle, teclear un número— y si la hora
no estuviera ya guardada, alguien podría quedarse sin ella mientras paga por
ella.

Los datos de Zelle **hay que verificarlos con Henry antes de tocarlos**. Un
dígito mal manda el dinero de otra persona a un desconocido, y Zelle es de
los pagos que no se pueden revertir.

El mensaje de WhatsApp lleva el día y la hora **de Utah a secas**: la
pantalla enseña también la hora local porque a quien reserva le hace falta,
pero ese mensaje lo lee Henry, que no sabe dónde está esa persona.

### Nada del usuario viaja por la URL

Ni el correo, ni el nombre, ni la nacionalidad. Una dirección queda en el
historial, en el portapapeles de quien la copia y en los registros de
cualquier proxy por el que pase. Con este público eso es un riesgo real.

---

## Pendiente, y conviene tenerlo a la vista

- **El pago se comprueba a mano.** Se cobra por Zelle: la pantalla de gracias
  enseña los datos y un botón para mandarle la captura por WhatsApp. El sitio
  **no ve el banco de nadie**, así que no sabe si se ha pagado — lo confirma
  Henry, y la pantalla lo dice con esas palabras en vez de dar a entender que
  el sistema se entera. La hora queda apartada aunque no se pague.
- **No se manda ningún correo.** Ni la confirmación ni el recordatorio. La
  pantalla de gracias ya lo promete y el formulario dice que por ahí llega el
  enlace de la sesión, así que esto es lo primero que hay que resolver antes
  de publicar.
- **Por dónde se hace la sesión está sin decidir.** El panel no lanza ninguna
  llamada —es una agenda, no un centro de operaciones— pero en algún sitio
  tiene que salir el enlace o el teléfono, y hoy no sale en ninguno.
- **El panel no se ha visto contra datos reales.** Los tipos pasan, las 43
  pruebas del horario pasan y las rutas responden, pero la base todavía no
  existe: en cuanto esté creada hay que abrirlo y mirarlo, que es donde se
  cazaron los dos peores fallos de este proyecto.
- **Sin límite de peticiones.** Nada impide que alguien aparte veinte horas
  seguidas con correos inventados. Mientras el volumen sea bajo se ve a
  simple vista en el panel; con más tráfico hará falta un límite de verdad.
- **La biografía de Henry.** Todo lo que dice la portada sobre él tiene que
  ser cierto antes de publicarse.
