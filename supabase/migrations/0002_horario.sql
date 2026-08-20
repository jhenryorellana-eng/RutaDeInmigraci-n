-- ═══════════════════════════════════════════════════════════════
-- EL HORARIO DEJA DE SER CÓDIGO Y PASA A SER DATOS
--
-- En `0001` el horario estaba escrito a mano dentro de `dentro_del_horario()`:
-- «lunes a viernes de 8 a 17, sábado de 8 a 13», en SQL. Estaba bien puesto
-- —cualquiera con la clave pública puede llamar a la API sin pasar por la
-- pantalla, así que el horario tiene que defenderse en la base— pero tenía
-- una consecuencia: Henry no podía cambiarlo.
--
-- Aquí el horario se muda a una tabla de TRAMOS por día de la semana. La
-- defensa sigue exactamente donde estaba, en el trigger; lo único que cambia
-- es de dónde saca los números.
--
-- Lo que esto hace posible, y era el encargo: un día partido. «De 8 a 1 sí,
-- de 1 a 3 no, de 3 a 5 sí» son dos tramos del mismo día. Con una hora de
-- apertura y otra de cierre eso no se podía decir.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- LOS TRAMOS
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.horario (
  id bigint generated always as identity primary key,

  /* ISO: 1 = lunes … 7 = domingo. El mismo criterio que `extract(isodow)` de
     Postgres y que `lib/horario.ts`, para que no haya que traducir en la
     frontera. */
  dia_semana smallint not null,

  /* El tramo es [desde_hora, hasta_hora): la hora de cierre NO se ofrece.
     Un tramo 8–13 ofrece las 8, 9, 10, 11 y 12. Se define así porque una
     sesión dura 45 minutos y la de las 13:00 acabaría a las 13:45, o sea
     después de cerrar. Es la misma cuenta que hacía el `between 8 and 12`
     de la versión anterior, pero dicha de una forma que no hay que recordar. */
  desde_hora smallint not null,
  hasta_hora smallint not null,

  creado_en timestamptz not null default now(),

  constraint horario_dia_valido check (dia_semana between 1 and 7),
  constraint horario_horas_validas check (
    desde_hora >= 0 and hasta_hora <= 24 and hasta_hora > desde_hora
  )
);

/* Sin índice sobre `dia_semana` a propósito: la tabla entera son catorce
   filas como mucho y cabe en una página. Un índice aquí sería más lento que
   leerla, y además otra cosa que mantener. */

alter table public.horario enable row level security;

/*
 * Y aquí SIN `force row level security`, al revés que en `citas` y `cierres`.
 *
 * No es un descuido. `force` hace que ni el propietario de la tabla se salte
 * las políticas, y quien tiene que leer esta tabla es el trigger que valida
 * las citas — que corre como el propietario. Con `force`, ese trigger no
 * vería ni una fila y rechazaría TODAS las citas por «fuera de horario».
 *
 * Se puede permitir porque aquí no hay nada que proteger al leer: el horario
 * es justo lo que el sitio pinta en la pantalla de reserva. Lo que hay que
 * proteger es la escritura, y de eso se encargan los GRANT y las políticas
 * de abajo. En `citas` sí hay datos de personas, y allí `force` se queda.
 */

-- ═══════════════════════════════════════════════════════════════
-- EL HORARIO DE PARTIDA
--
-- Exactamente el mismo que estaba escrito en `0001`, para que aplicar esta
-- migración no cambie el comportamiento de nada. El sitio sigue ofreciendo
-- las mismas horas hasta que Henry toque algo.
-- ═══════════════════════════════════════════════════════════════

insert into public.horario (dia_semana, desde_hora, hasta_hora)
select d, 8, 17 from generate_series(1, 5) as d
where not exists (select 1 from public.horario);

insert into public.horario (dia_semana, desde_hora, hasta_hora)
select 6, 8, 13
where not exists (select 1 from public.horario where dia_semana = 6);

-- ═══════════════════════════════════════════════════════════════
-- QUE NO SE PISEN
-- ═══════════════════════════════════════════════════════════════

/*
 * Dos tramos del mismo día no pueden solaparse.
 *
 * En un trigger y no en una restricción EXCLUDE porque una EXCLUDE necesita
 * la extensión `btree_gist`, y una migración que puede fallar al instalar una
 * extensión es una migración que puede dejar a alguien sin base a medias. El
 * riesgo que cubriría —dos escrituras a la vez— no existe aquí: a esta tabla
 * escribe una persona, desde una pantalla, de una en una.
 *
 * Y si algún día se colara un solape igualmente, no rompe nada: las horas se
 * generan con `distinct`, así que una hora en dos tramos se ofrece una vez.
 */
create or replace function privado.validar_tramo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.horario h
    where h.dia_semana = new.dia_semana
      and h.id is distinct from new.id
      and new.desde_hora < h.hasta_hora
      and new.hasta_hora > h.desde_hora
  ) then
    raise exception 'Ese tramo se pisa con otro del mismo día.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists horario_validar on public.horario;
create trigger horario_validar
  before insert or update on public.horario
  for each row execute function privado.validar_tramo();

-- ═══════════════════════════════════════════════════════════════
-- EL PORTERO, AHORA LEYENDO DE LA TABLA
-- ═══════════════════════════════════════════════════════════════

/*
 * ¿Cae esta marca de tiempo dentro del horario de atención?
 *
 * Lo mismo que hacía antes, pero preguntándole a `horario` en vez de llevar
 * los números dentro. Sigue siendo la ÚNICA defensa que no se puede saltar:
 * la pantalla no ofrece las horas cerradas, pero la pantalla no es el único
 * que puede insertar.
 *
 * Deja de ser `immutable` y pasa a `stable`: lee una tabla, así que su
 * resultado ya no depende sólo de los argumentos. Es correcto y no cuesta
 * nada — no se usa en ningún índice ni en ninguna restricción CHECK, sólo
 * dentro del trigger de las citas.
 *
 * `America/Denver` y no un desfase fijo: Utah cambia de hora dos veces al
 * año, y un `-07` escrito a mano deja el horario corrido una hora durante
 * ocho meses.
 */
create or replace function public.dentro_del_horario(momento timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  with local as (
    select
      extract(isodow from momento at time zone 'America/Denver')::int as dia,
      extract(hour   from momento at time zone 'America/Denver')::int as hora
  )
  select exists (
    select 1
    from public.horario h, local l
    where h.dia_semana = l.dia
      and l.hora >= h.desde_hora
      and l.hora <  h.hasta_hora
  );
$$;

/*
 * Un detalle que NO se cambia, y conviene que se vea escrito:
 *
 * el trigger `citas_validar` sólo corre al INSERTAR. Así que cambiar el
 * horario NO toca las citas que ya están apartadas. Si alguien apartó las
 * 16:00 de un jueves y Henry cierra las tardes, esa cita sigue en pie.
 *
 * Es la decisión correcta y es deliberada: lo contrario sería que alguien
 * que ya pagó su sesión se quedara sin ella sin que nadie se enterara.
 */

-- ═══════════════════════════════════════════════════════════════
-- PERMISOS
-- ═══════════════════════════════════════════════════════════════

revoke all on public.horario from anon, authenticated;

/* Leerlo puede cualquiera: es lo que se pinta en la pantalla de reserva.
   Enseñar los huecos y esconder el horario que los genera no protegería
   nada — se deduce mirando la pantalla treinta segundos. */
grant select on public.horario to anon, authenticated;

create policy horario_cualquiera_lee
  on public.horario for select
  to anon, authenticated
  using (true);

/* Escribirlo, sólo Henry. Tres políticas separadas en vez de un `for all`
   para que se lea en el propio esquema quién puede hacer qué; y `with check`
   en el update, sin el cual se podría mover un tramo a un día ajeno. */
grant insert, update, delete on public.horario to authenticated;

create policy horario_admin_inserta
  on public.horario for insert
  to authenticated
  with check ((select public.es_admin()));

create policy horario_admin_actualiza
  on public.horario for update
  to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

create policy horario_admin_borra
  on public.horario for delete
  to authenticated
  using ((select public.es_admin()));
