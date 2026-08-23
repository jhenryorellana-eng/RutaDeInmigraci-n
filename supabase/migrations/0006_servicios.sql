-- ═══════════════════════════════════════════════════════════════
-- TRES PREPARACIONES, UNA SOLA AGENDA
--
-- La sesión deja de ser una cosa con un precio y pasa a ser tres:
--
--   primera · audiencia preliminar ·  $50
--   segunda · audiencia preliminar · $100
--   tercera · audiencia de mérito  · $150
--
-- ── Lo que NO hace falta hacer para que no se crucen ──
--
-- Nada. El índice único parcial de `0001` está sobre `inicia_en` a secas,
-- sin mirar el servicio: dos citas no pueden compartir hora, sea cual sea la
-- preparación. Si se hubiera puesto sobre (inicia_en, servicio) —que es la
-- tentación al añadir esta columna— tres personas podrían apartar las 14:00
-- del mismo día, una por cada preparación, y Henry tendría tres audiencias a
-- la vez.
-- ═══════════════════════════════════════════════════════════════

alter table public.citas
  add column if not exists servicio text,
  add column if not exists precio_usd integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'citas_servicio_valido') then
    alter table public.citas
      add constraint citas_servicio_valido
      check (servicio is null or servicio in ('primera', 'segunda', 'tercera'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'citas_precio_valido') then
    alter table public.citas
      add constraint citas_precio_valido
      check (precio_usd is null or precio_usd between 0 and 10000);
  end if;
end $$;

/*
 * El precio se GUARDA con la cita, no se calcula al leerla.
 *
 * Si mañana la tercera audiencia sube a $180, las citas ya apartadas tienen
 * que seguir diciendo $150: es lo que esa persona vio y lo que va a pagar.
 * Un precio derivado del servicio al vuelo reescribiría el pasado cada vez
 * que se toca la lista de precios.
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

  new.estado := 'reservada';
  new.creado_en := now();
  new.nacionalidad := upper(new.nacionalidad);
  new.correo := lower(btrim(new.correo));
  new.nombre := btrim(new.nombre);

  new.whatsapp := regexp_replace(coalesce(new.whatsapp, ''), '[^0-9]', '', 'g');
  if length(new.whatsapp) < 8 then
    raise exception 'Hace falta un número de WhatsApp para poder escribirte.'
      using errcode = 'check_violation';
  end if;

  new.zona_horaria := nullif(btrim(coalesce(new.zona_horaria, '')), '');

  /* El servicio se exige: sin él, ni Henry sabe para qué audiencia prepara
     ni hay forma de decir cuánto se cobra. */
  if new.servicio is null then
    raise exception 'Falta decir qué preparación es.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- El permiso sigue siendo POR COLUMNA: dos más, y ninguna otra.
grant insert (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria, servicio, precio_usd)
  on public.citas to anon, authenticated;
