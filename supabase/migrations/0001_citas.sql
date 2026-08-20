-- ═══════════════════════════════════════════════════════════════
-- LA RUTA DEL INMIGRANTE · CITAS
--
-- Esta base guarda nacionalidad y ubicación de personas migrantes. Todo lo
-- que sigue parte de ahí: el público NO puede leer la tabla de citas, ni una
-- columna. Lo único que puede saber es QUÉ HORAS ESTÁN OCUPADAS, y eso se
-- responde con una función que devuelve marcas de tiempo y nada más.
--
-- Lo que NO se guarda, y es deliberado: estatus migratorio. Ni aquí ni en
-- ninguna parte del producto.
-- ═══════════════════════════════════════════════════════════════

-- ── Esquema privado: nada de aquí se expone por la API ──
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- QUIÉN MANDA
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.administradores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  creado_en timestamptz not null default now()
);

alter table public.administradores enable row level security;
alter table public.administradores force row level security;

-- Nadie la lee por la API. Sólo la consulta la función de abajo, que corre
-- con privilegios del creador.
revoke all on public.administradores from anon, authenticated;

/*
 * ¿Quién pregunta es administrador?
 *
 * SECURITY DEFINER porque tiene que leer una tabla que nadie puede leer. Con
 * `search_path` vacío —si no, alguien con permiso de crear objetos podría
 * anteponer un esquema propio y suplantar `administradores`— y comprobando
 * SIEMPRE la identidad de quien llama dentro del cuerpo. Un auditor anterior
 * de este equipo encontró justo lo contrario: una función SECURITY DEFINER
 * invocable por cualquiera que escribía en `users`.
 */
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administradores
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- LAS CITAS
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.citas (
  id bigint generated always as identity primary key,

  /* `timestamptz`, nunca `timestamp`. El horario se define en la hora de
     Utah pero quien reserva puede estar en cualquier parte, y una marca de
     tiempo sin zona es una cita a la hora equivocada esperando a ocurrir. */
  inicia_en timestamptz not null,

  nombre text not null,
  correo text not null,
  /* Código ISO-3166-1 alfa-2. Dos letras, no el nombre del país: así el
     panel puede agrupar sin que «México», «Mexico» y «MX» cuenten aparte. */
  nacionalidad char(2) not null,
  /* Dentro o fuera de EE. UU. Es UBICACIÓN, no estatus: la diferencia
     importa y es la única pregunta de este tipo que se hace. */
  en_eeuu boolean not null,

  estado text not null default 'reservada',
  creado_en timestamptz not null default now(),

  constraint citas_estado_valido
    check (estado in ('reservada', 'cancelada', 'atendida')),
  constraint citas_correo_con_forma
    check (position('@' in correo) > 1 and length(correo) between 6 and 254),
  constraint citas_nombre_no_vacio
    check (length(btrim(nombre)) between 2 and 120),
  constraint citas_nacionalidad_mayusculas
    check (nacionalidad = upper(nacionalidad)),
  /* Las sesiones empiezan en punto. Sin esto, un cliente malicioso podría
     apartar las 11:37 y romper la rejilla de huecos para todos los demás. */
  constraint citas_empieza_en_punto
    check (date_trunc('hour', inicia_en) = inicia_en)
);

/*
 * UNA cita por hueco — y sólo cuenta lo que sigue vivo.
 *
 * Índice único PARCIAL: una cita cancelada libera su hora, así que no debe
 * bloquear a la siguiente persona. Con un unique normal, cancelar dejaría el
 * hueco muerto para siempre.
 *
 * Es también la defensa real contra la doble reserva: dos personas pulsando
 * a la vez ganan la carrera una sola vez, y la base decide cuál. Comprobarlo
 * en la aplicación antes de insertar no sirve — entre la comprobación y el
 * insert cabe la otra reserva.
 */
create unique index if not exists citas_hueco_unico
  on public.citas (inicia_en)
  where estado <> 'cancelada';

-- El panel siempre pregunta «qué tengo de hoy en adelante», en orden.
create index if not exists citas_inicia_en_idx on public.citas (inicia_en);

alter table public.citas enable row level security;
alter table public.citas force row level security;

-- ═══════════════════════════════════════════════════════════════
-- LOS CIERRES — cuando Henry no está
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.cierres (
  id bigint generated always as identity primary key,
  inicia_en timestamptz not null,
  termina_en timestamptz not null,
  nota text,
  creado_en timestamptz not null default now(),

  constraint cierres_orden check (termina_en > inicia_en)
);

create index if not exists cierres_rango_idx on public.cierres (inicia_en, termina_en);

alter table public.cierres enable row level security;
alter table public.cierres force row level security;

-- ═══════════════════════════════════════════════════════════════
-- EL HORARIO, EN LA BASE
--
-- Está aquí y no sólo en la aplicación porque la aplicación no es el único
-- que puede insertar: cualquiera con la clave pública puede llamar a la API.
-- Si el horario viviera sólo en el navegador, apartar una cita el domingo a
-- las 3 de la mañana sería cuestión de una petición a mano.
-- ═══════════════════════════════════════════════════════════════

/*
 * ¿Cae esta marca de tiempo dentro del horario de atención?
 *
 * Lunes a viernes de 8:00 a 17:00 y sábados de 8:00 a 13:00, HORA DE UTAH.
 * Como las sesiones duran 45 minutos y empiezan en punto, la última entre
 * semana empieza a las 16:00 y el sábado a las 12:00.
 *
 * `America/Denver` y no un desfase fijo: Utah cambia de hora dos veces al
 * año, y un `-07` escrito a mano deja el horario corrido una hora durante
 * ocho meses.
 */
create or replace function public.dentro_del_horario(momento timestamptz)
returns boolean
language sql
immutable
set search_path = ''
as $$
  with local as (
    select
      extract(isodow from momento at time zone 'America/Denver') as dia,
      extract(hour   from momento at time zone 'America/Denver') as hora
  )
  select case
    when dia between 1 and 5 then hora between 8 and 16   -- lun–vie
    when dia = 6             then hora between 8 and 12   -- sábado
    else false                                            -- domingo, cerrado
  end
  from local;
$$;

/*
 * Portero de las citas. Rechaza en la BASE lo que la pantalla ya no ofrece:
 * horas fuera del horario, horas ya cerradas a mano, y citas en el pasado.
 *
 * Va en un trigger y no en un CHECK porque un CHECK no puede consultar otra
 * tabla, y los cierres viven en otra tabla.
 */
create or replace function privado.validar_cita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.inicia_en <= now() then
    raise exception 'La hora elegida ya pasó.'
      using errcode = 'check_violation';
  end if;

  if not public.dentro_del_horario(new.inicia_en) then
    raise exception 'Esa hora está fuera del horario de atención.'
      using errcode = 'check_violation';
  end if;

  if exists (
    select 1 from public.cierres c
    where new.inicia_en >= c.inicia_en
      and new.inicia_en <  c.termina_en
  ) then
    raise exception 'Esa hora no está disponible.'
      using errcode = 'check_violation';
  end if;

  -- El público no elige el estado ni la fecha de creación.
  new.estado := 'reservada';
  new.creado_en := now();
  new.nacionalidad := upper(new.nacionalidad);
  new.correo := lower(btrim(new.correo));
  new.nombre := btrim(new.nombre);

  return new;
end;
$$;

drop trigger if exists citas_validar on public.citas;
create trigger citas_validar
  before insert on public.citas
  for each row execute function privado.validar_cita();

-- ═══════════════════════════════════════════════════════════════
-- QUÉ PUEDE VER EL PÚBLICO: las horas ocupadas, y nada más
-- ═══════════════════════════════════════════════════════════════

/*
 * Devuelve las marcas de tiempo que NO se pueden apartar en un rango: las ya
 * reservadas y las que Henry cerró.
 *
 * SECURITY DEFINER a propósito, y es seguro por construcción: no devuelve
 * ninguna columna de la cita, sólo el instante. Aunque alguien la llame con
 * un rango de diez años, lo único que obtiene es una lista de horas — que es
 * exactamente lo que ya ve en la pantalla.
 *
 * El rango se acota a 60 días dentro de la propia función para que no se
 * pueda usar como un barrido del calendario entero.
 */
create or replace function public.horas_ocupadas(desde timestamptz, hasta timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  with rango as (
    select
      greatest(desde, now() - interval '1 day') as d,
      least(hasta, desde + interval '60 days')  as h
  )
  select c.inicia_en
  from public.citas c, rango r
  where c.estado <> 'cancelada'
    and c.inicia_en >= r.d
    and c.inicia_en <  r.h

  union

  select generate_series(
           date_trunc('hour', greatest(x.inicia_en, r.d)),
           x.termina_en - interval '1 second',
           interval '1 hour'
         )
  from public.cierres x, rango r
  where x.inicia_en < r.h
    and x.termina_en > r.d;
$$;

revoke execute on function public.horas_ocupadas(timestamptz, timestamptz) from public;
grant execute on function public.horas_ocupadas(timestamptz, timestamptz) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- PERMISOS Y POLÍTICAS
-- ═══════════════════════════════════════════════════════════════

-- Punto de partida: el público no tiene NADA sobre estas tablas.
revoke all on public.citas from anon, authenticated;
revoke all on public.cierres from anon, authenticated;

/*
 * El público sólo puede INSERTAR, y sólo estas cinco columnas.
 *
 * Permiso por columna, no por tabla: sin esto, quien apartara una cita
 * podría mandar `estado = 'atendida'` o inventarse `creado_en`. El trigger
 * también los pisa, pero dos cerraduras en la misma puerta cuestan una línea.
 */
grant insert (inicia_en, nombre, correo, nacionalidad, en_eeuu)
  on public.citas to anon, authenticated;

/*
 * Y NINGÚN `select`. Ni siquiera de `inicia_en`: para saber qué está ocupado
 * está `horas_ocupadas()`, que no puede filtrar datos de nadie porque no
 * devuelve más que instantes.
 */

create policy citas_cualquiera_reserva
  on public.citas
  for insert
  to anon, authenticated
  with check (true);

/* El administrador ve y gestiona todo. `(select public.es_admin())` entre
   paréntesis a propósito: así se evalúa UNA vez por consulta y no una vez
   por fila. */
grant select, update, delete on public.citas to authenticated;

create policy citas_admin_lee
  on public.citas for select to authenticated
  using ((select public.es_admin()));

create policy citas_admin_actualiza
  on public.citas for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy citas_admin_borra
  on public.citas for delete to authenticated
  using ((select public.es_admin()));

-- Los cierres son cosa exclusiva del administrador.
grant select, insert, update, delete on public.cierres to authenticated;

create policy cierres_admin_todo
  on public.cierres for all to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));
