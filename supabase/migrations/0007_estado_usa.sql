-- ═══════════════════════════════════════════════════════════════
-- DÓNDE ESTÁ QUIEN RESERVA
--
-- Henry ve la hora de la persona en su panel desde `zona_horaria`, pero una
-- zona no es un sitio: `America/Chicago` va de Texas a Minnesota. Al llamar
-- para confirmar, saber que alguien está EN CAROLINA DEL SUR vale más que
-- saber que va dos horas por delante.
--
-- ── Por qué no se llama `estado` ──
--
-- Porque esa columna ya existe y significa otra cosa: el estado de la CITA
-- —reservada, cancelada, atendida—. Dos columnas llamadas igual en la misma
-- tabla es un error esperando a que alguien escriba la consulta equivocada
-- de madrugada.
--
-- ── Por qué es opcional ──
--
-- Porque las citas ya apartadas no lo tienen y no se puede inventar. Una
-- columna `not null` sobre una tabla con filas obliga a rellenarlas con algo,
-- y ese algo sería una suposición sobre dónde vive alguien.
--
-- ── Lo que sigue sin guardarse ──
--
-- Estatus migratorio. Ni aquí ni en ninguna parte del producto. Esto es una
-- ubicación declarada por la propia persona para poder decirle bien la hora.
-- ═══════════════════════════════════════════════════════════════

alter table public.citas
  add column if not exists estado_usa text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'citas_estado_usa_con_forma') then
    /* Sólo longitud, sin lista cerrada de los cincuenta: una lista en un
       CHECK obliga a una migración el día que entre Guam o Islas Vírgenes, y
       la validación de verdad ya la hace el selector, que sólo ofrece los
       que existen. Aquí se corta la basura, no se sustituye al formulario. */
    alter table public.citas
      add constraint citas_estado_usa_con_forma
      check (estado_usa is null or length(btrim(estado_usa)) between 2 and 40);
  end if;
end $$;

/*
 * El trigger normaliza y decide cuándo tiene sentido guardarlo.
 *
 * Se limpia igual que el resto: `btrim` y a nulo si queda vacío, para que no
 * convivan '' y NULL diciendo lo mismo.
 *
 * Y se BORRA cuando la persona dice que no está en Estados Unidos. El
 * formulario pregunta las dos cosas y nada impide que alguien elija «Texas»
 * y luego marque que está fuera del país: guardar las dos deja una fila que
 * se contradice a sí misma, y el panel tendría que elegir a cuál creer.
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

  new.estado_usa := nullif(btrim(coalesce(new.estado_usa, '')), '');
  if not new.en_eeuu then
    new.estado_usa := null;
  end if;

  /* El servicio se exige: sin él, ni Henry sabe para qué audiencia prepara
     ni hay forma de decir cuánto se cobra. */
  if new.servicio is null then
    raise exception 'Falta decir qué preparación es.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- El permiso sigue siendo POR COLUMNA: una más, y ninguna otra. El público
-- puede escribir estas y nada más; leer la tabla sigue sin poder nadie.
grant insert (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria, servicio, precio_usd, estado_usa)
  on public.citas to anon, authenticated;
