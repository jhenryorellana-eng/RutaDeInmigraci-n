-- ═══════════════════════════════════════════════════════════════
-- EL WHATSAPP, Y LA ZONA DE QUIEN RESERVA
--
-- Dos columnas que resuelven dos problemas distintos del panel.
--
-- ── `whatsapp` ──
--
-- La sesión se cierra por WhatsApp: ahí manda la persona su comprobante de
-- Zelle y por ahí le llega el enlace. Hasta ahora Henry tenía que buscar el
-- mensaje entre todos los que le entran y adivinar cuál era de quién.
-- Guardándolo, el panel puede abrir la conversación con esa persona de un
-- toque.
--
-- ── `zona_horaria` ──
--
-- El panel enseña la hora de Utah, que es la que Henry tiene en la cabeza.
-- Pero la mitad de esta gente no está en Utah, y cuando él escribe «nos vemos
-- a las 11» sin decir de dónde, alguien se conecta con dos horas de
-- diferencia. Con la zona guardada, el panel puede enseñar las DOS horas y
-- decir cuál es cuál.
--
-- La zona la manda el navegador, nunca se deduce de la IP: una IP puede ser
-- la de una VPN o la de la biblioteca del pueblo de al lado.
-- ═══════════════════════════════════════════════════════════════

alter table public.citas
  add column if not exists whatsapp text,
  add column if not exists zona_horaria text;

/*
 * El número se guarda en dígitos y nada más: sin «+», ni espacios, ni
 * paréntesis. Es lo que pide `wa.me`, y así dos personas que escriban el
 * mismo número de tres formas distintas quedan iguales en la tabla.
 *
 * De 8 a 15 dígitos, que es lo que permite el estándar E.164 contando el
 * código de país.
 */
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'citas_whatsapp_con_forma'
  ) then
    alter table public.citas
      add constraint citas_whatsapp_con_forma
      check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'citas_zona_con_forma'
  ) then
    alter table public.citas
      add constraint citas_zona_con_forma
      check (zona_horaria is null or length(zona_horaria) between 3 and 64);
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- EL PORTERO, ACTUALIZADO
-- ═══════════════════════════════════════════════════════════════

/*
 * Lo mismo que hacía, más dos cosas:
 *
 *   · normaliza el WhatsApp a dígitos ANTES de que el CHECK lo mire, para
 *     que quien escriba «+1 (801) 941-3479» no se lleve un error por poner
 *     el número como lo pone todo el mundo;
 *   · lo EXIGE. La sesión se cierra por ahí, así que una cita sin número es
 *     una persona a la que Henry no puede llegar. Se pide en la base y no
 *     sólo en el formulario porque cualquiera con la clave pública puede
 *     insertar sin pasar por la pantalla.
 *
 * Las citas que ya estaban no se tocan: este trigger sólo corre al INSERTAR.
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

  -- Dígitos y nada más, tal y como lo quiere `wa.me`.
  new.whatsapp := regexp_replace(coalesce(new.whatsapp, ''), '[^0-9]', '', 'g');
  if length(new.whatsapp) < 8 then
    raise exception 'Hace falta un número de WhatsApp para poder escribirte.'
      using errcode = 'check_violation';
  end if;

  new.zona_horaria := nullif(btrim(coalesce(new.zona_horaria, '')), '');

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PERMISOS
--
-- El permiso sigue siendo POR COLUMNA: el público puede escribir estas dos
-- nuevas y ninguna más. Sin esto, añadir la columna no bastaría —el insert
-- fallaría por falta de permiso— y con un `grant insert` a secas sobre la
-- tabla, quien reservara podría inventarse el estado.
-- ═══════════════════════════════════════════════════════════════

grant insert (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria)
  on public.citas to anon, authenticated;

/*
 * Y NINGÚN `select` nuevo para el público: el número de teléfono de quien
 * reserva es exactamente el tipo de dato que no puede salir de aquí. Sólo lo
 * lee quien esté en `administradores`, con las políticas que ya había.
 */
