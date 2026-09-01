-- ═══════════════════════════════════════════════════════════════
-- LA CITA NO EXISTE HASTA QUE EL PAGO ESTÁ CONFIRMADO
--
-- Hasta ahora una cita nacía «reservada» y el pago se comprobaba a mano, o
-- no se comprobaba. La agenda se llenaba de horas que nadie iba a pagar y
-- Henry no podía distinguirlas de las buenas.
--
-- Ahora hay un estado más, y es el primero por el que pasa todo el mundo:
--
--   pendiente  → la hora está RETENIDA a nombre de alguien que aún no ha
--                pagado. Nadie más puede tomarla, pero para Henry todavía no
--                es una cita.
--   reservada  → el pago está confirmado. Esto sí es una cita.
--   cancelada  → libera la hora.
--   atendida   → ya ocurrió.
--
-- ── Por qué «pendiente» retiene la hora ──
--
-- Porque el orden es elegir hora → llenar datos → pagar, y entre lo segundo
-- y lo tercero esa persona se va a su banco. Si la hora no quedara retenida,
-- volvería del banco con el dinero enviado y sin hueco — y un Zelle no se
-- puede revertir.
--
-- No hace falta tocar ni el índice único ni `horas_ocupadas()`: los dos
-- filtran por `estado <> 'cancelada'`, así que una pendiente ya bloquea la
-- hora sin cambiar una línea. Eso NO es casualidad — es que aquella
-- definición se escribió sobre «lo que sigue vivo» y no sobre «lo pagado».
--
-- ── Y por qué caducan ──
--
-- Porque quien abandona a mitad del pago no puede quedarse la hora para
-- siempre. La caducidad NO va en el índice: el predicado de un índice tiene
-- que ser inmutable y `now()` no lo es. Va en una función que barre las
-- vencidas y las cancela, y que se llama antes de pintar la disponibilidad.
-- ═══════════════════════════════════════════════════════════════

-- ── El estado nuevo ──
alter table public.citas drop constraint if exists citas_estado_valido;
alter table public.citas
  add constraint citas_estado_valido
  check (estado in ('pendiente', 'reservada', 'cancelada', 'atendida'));

alter table public.citas
  add column if not exists codigo_pago char(4),
  add column if not exists metodo_pago text,
  add column if not exists pagado_en timestamptz,
  add column if not exists pago_fuente text,
  add column if not exists expira_en timestamptz,
  add column if not exists stripe_session_id text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'citas_codigo_pago_forma') then
    alter table public.citas
      add constraint citas_codigo_pago_forma
      check (codigo_pago is null or codigo_pago ~ '^[0-9]{4}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'citas_metodo_pago_valido') then
    alter table public.citas
      add constraint citas_metodo_pago_valido
      check (metodo_pago is null or metodo_pago in ('stripe', 'zelle'));
  end if;

  /* De dónde salió la confirmación. `banco_auto` es la conciliación que lee
     el correo de Chase; `manual` es Henry dándole al botón. No se sobrecarga
     un NULL para decir esto: dentro de un año nadie recordaría qué
     significaba el hueco. */
  if not exists (select 1 from pg_constraint where conname = 'citas_pago_fuente_valida') then
    alter table public.citas
      add constraint citas_pago_fuente_valida
      check (pago_fuente is null or pago_fuente in ('stripe', 'banco_auto', 'manual'));
  end if;
end $$;

/*
 * El código del memo: único ENTRE LAS QUE ESPERAN PAGO, no para siempre.
 *
 * Con cuatro dígitos sólo hay diez mil, así que reservarlos de por vida se
 * agotaría. Lo que tiene que ser cierto es más débil y basta: que en el
 * momento de leer un correo del banco no haya dos personas esperando con el
 * mismo código. Una vez confirmada la cita, el código puede reutilizarse.
 */
create unique index if not exists citas_codigo_pago_unico_pendiente
  on public.citas (codigo_pago)
  where estado = 'pendiente' and codigo_pago is not null;

-- El barrido de caducadas lo consulta en cada disponibilidad.
create index if not exists citas_pendientes_caducan
  on public.citas (expira_en)
  where estado = 'pendiente';

-- ═══════════════════════════════════════════════════════════════
-- EL PORTERO, ACTUALIZADO
-- ═══════════════════════════════════════════════════════════════

/*
 * Lo mismo que hacía, y tres cosas nuevas:
 *
 *   · la cita nace PENDIENTE, no reservada — el público no puede escribir el
 *     estado, así que esto es lo único que decide en qué estado nace;
 *   · se le asigna un código de cuatro dígitos que no esté en uso por otra
 *     pendiente, para que quien pague por Zelle pueda escribirlo en el memo;
 *   · se le pone caducidad.
 *
 * El código se sortea aquí y no en la aplicación a propósito: es la base
 * quien sabe cuáles están libres en este instante, y quien tiene el índice
 * único que hace de árbitro si dos personas caen en el mismo número a la vez.
 */
create or replace function privado.validar_cita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  intento int := 0;
  candidato char(4);
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

  /* Nace pendiente SIEMPRE. El pago es lo único que la asciende, y eso pasa
     por `public.confirmar_pago()`, nunca por un insert. */
  new.estado := 'pendiente';
  new.creado_en := now();
  new.pagado_en := null;
  new.pago_fuente := null;

  /* Media hora es lo que tarda alguien en abrir la app del banco, buscar
     Zelle y teclear un número, con margen para el que se distrae. Más tiempo
     retiene huecos de gente que ya no va a volver; menos, echa a quien sí. */
  new.expira_en := now() + interval '30 minutes';

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

  if new.servicio is null then
    raise exception 'Falta decir qué preparación es.'
      using errcode = 'check_violation';
  end if;

  /* El código. Se sortea hasta encontrar uno libre entre las pendientes; con
     diez mil posibles y una agenda de decenas, la primera suele valer. El
     tope evita un bucle infinito si algún día esto se llenara de verdad. */
  if new.codigo_pago is null then
    loop
      intento := intento + 1;
      candidato := lpad((floor(random() * 10000))::int::text, 4, '0');
      exit when not exists (
        select 1 from public.citas
        where codigo_pago = candidato and estado = 'pendiente'
      );
      if intento >= 40 then
        raise exception 'No se pudo asignar un código de pago. Inténtalo otra vez.'
          using errcode = 'check_violation';
      end if;
    end loop;
    new.codigo_pago := candidato;
  end if;

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════
-- LIBERAR LAS QUE CADUCARON
-- ═══════════════════════════════════════════════════════════════

/*
 * Cancela las pendientes vencidas y devuelve cuántas liberó.
 *
 * Se llama antes de calcular la disponibilidad, así que el barrido ocurre
 * por el mero hecho de que alguien mire la agenda — no hace falta un cron
 * para lo esencial. `SECURITY DEFINER` porque quien mira la agenda es el
 * público, que no puede escribir en `citas`.
 *
 * Se CANCELAN en vez de borrarse: una hora que estuvo retenida media hora y
 * se soltó es información, y borrarla dejaría a Henry sin saber por qué su
 * agenda parecía llena a las once y vacía a las doce.
 */
create or replace function public.liberar_pendientes_vencidas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  liberadas integer;
begin
  update public.citas
     set estado = 'cancelada'
   where estado = 'pendiente'
     and expira_en is not null
     and expira_en < now();
  get diagnostics liberadas = row_count;
  return liberadas;
end;
$$;

revoke execute on function public.liberar_pendientes_vencidas() from public;
grant execute on function public.liberar_pendientes_vencidas() to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- CONFIRMAR UN PAGO — la única puerta que asciende una cita
-- ═══════════════════════════════════════════════════════════════

/*
 * Marca una cita como pagada, y sólo si sigue estando en condiciones.
 *
 * Todo bajo `FOR UPDATE`: entre leer y escribir cabe otra confirmación —el
 * webhook de Stripe reintenta, y el barrido de correos puede leer dos veces
 * la misma alerta— y aplicar dos veces el mismo pago es exactamente lo que
 * no puede pasar. Si ya estaba confirmada, devuelve `ya_estaba` en vez de
 * fallar: un reintento no es un error.
 *
 * `SECURITY DEFINER` con `search_path` vacío, y NO se concede a `anon`: la
 * llaman el webhook de Stripe y el conciliador, los dos con sesión de
 * servicio. Que el público pudiera llamarla sería regalar las citas.
 */
create or replace function public.confirmar_pago(
  cita_id bigint,
  metodo text,
  fuente text,
  referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  fila public.citas%rowtype;
begin
  select * into fila from public.citas where id = cita_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'CITA_NO_EXISTE');
  end if;

  if fila.estado = 'reservada' then
    return jsonb_build_object('ok', true, 'ya_estaba', true, 'cita_id', fila.id);
  end if;

  if fila.estado <> 'pendiente' then
    return jsonb_build_object('ok', false, 'motivo', 'ESTADO_' || upper(fila.estado));
  end if;

  /* Una pendiente vencida NO se asciende sin mirar: su hora pudo haberla
     tomado otra persona mientras tanto. Se comprueba que siga libre. */
  if fila.expira_en is not null and fila.expira_en < now() then
    if exists (
      select 1 from public.citas o
      where o.inicia_en = fila.inicia_en
        and o.id <> fila.id
        and o.estado in ('pendiente', 'reservada', 'atendida')
    ) then
      return jsonb_build_object('ok', false, 'motivo', 'CADUCADA_Y_HORA_TOMADA');
    end if;
  end if;

  update public.citas
     set estado = 'reservada',
         pagado_en = now(),
         metodo_pago = coalesce(metodo, metodo_pago),
         pago_fuente = fuente,
         expira_en = null,
         stripe_session_id = coalesce(referencia, stripe_session_id)
   where id = fila.id;

  return jsonb_build_object('ok', true, 'ya_estaba', false, 'cita_id', fila.id);
end;
$$;

revoke execute on function public.confirmar_pago(bigint, text, text, text) from public, anon;

-- ═══════════════════════════════════════════════════════════════
-- LOS CORREOS DEL BANCO
--
-- Cada alerta de Chase que se lee queda aquí. Es a la vez la prueba de que
-- un pago llegó y el candado que impide aplicarlo dos veces: la clave es el
-- número de transacción, que sobrevive a los reenvíos del banco (el
-- Message-ID no).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.zelle_correos (
  id bigint generated always as identity primary key,

  /* La llave de idempotencia. Chase reenvía la misma alerta y el
     Message-ID cambia; este número no. */
  transaccion text not null unique,

  remitente text not null,
  monto_centavos integer not null,
  memo text,
  enviado_el date,

  /* Qué se decidió y contra qué cita. `null` cuando no se pudo identificar. */
  cita_id bigint references public.citas (id) on delete set null,
  decision text not null default 'sin_identificar',
  motivo text,

  /* El sello del servidor de correo, tal cual, para poder auditar después
     por qué se aceptó o se rechazó una alerta. */
  auth_ok boolean not null default false,
  auth_detalle jsonb,

  leido_en timestamptz not null default now(),

  constraint zelle_decision_valida
    check (decision in ('confirmado', 'sin_identificar', 'ambiguo', 'rechazado')),
  constraint zelle_monto_positivo check (monto_centavos > 0)
);

create index if not exists zelle_correos_cita on public.zelle_correos (cita_id);
create index if not exists zelle_correos_leidos on public.zelle_correos (leido_en desc);

alter table public.zelle_correos enable row level security;
alter table public.zelle_correos force row level security;

/* El público no tiene NADA que hacer aquí: son alertas bancarias con el
   nombre de quien paga. Henry las lee para auditar; escribir sólo escribe el
   conciliador, con clave de servicio, que se salta el RLS por diseño. */
revoke all on public.zelle_correos from anon, authenticated;
grant select on public.zelle_correos to authenticated;

create policy zelle_correos_admin_lee
  on public.zelle_correos for select
  to authenticated
  using ((select public.es_admin()));

-- El cursor del buzón: por dónde iba la última lectura.
create table if not exists public.zelle_cursor (
  id boolean primary key default true,
  uidvalidity bigint,
  ultimo_uid integer not null default 0,
  ultimo_exito_en timestamptz,
  ultimo_error text,
  constraint zelle_cursor_una_fila check (id)
);

insert into public.zelle_cursor (id) values (true) on conflict do nothing;

alter table public.zelle_cursor enable row level security;
alter table public.zelle_cursor force row level security;
revoke all on public.zelle_cursor from anon, authenticated;
grant select on public.zelle_cursor to authenticated;

create policy zelle_cursor_admin_lee
  on public.zelle_cursor for select
  to authenticated
  using ((select public.es_admin()));

-- ═══════════════════════════════════════════════════════════════
-- PERMISOS DE INSERCIÓN
--
-- Dos columnas más para el público, y ninguna peligrosa: el método que
-- eligió. El estado, el código, la caducidad y el pago los pone el trigger,
-- que es lo único que no se puede saltar.
-- ═══════════════════════════════════════════════════════════════

grant insert (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria,
              servicio, precio_usd, estado_usa, metodo_pago)
  on public.citas to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- APARTAR, Y RECIBIR DE VUELTA LO PROPIO
--
-- Quien reserva necesita saber DOS cosas que nacen en la base: el id de su
-- cita —para poder pagarla— y su código de cuatro dígitos —para escribirlo
-- en el memo del Zelle—.
--
-- Un `insert … returning` no sirve: para devolver columnas hace falta
-- permiso de lectura sobre ellas, y el público no tiene ni uno sobre
-- `citas`. Dárselo, aunque fuera de dos columnas, abriría la puerta a listar
-- los códigos de todo el mundo.
--
-- Así que la inserción pasa por aquí. Esta función devuelve exactamente la
-- fila que acaba de crear quien la llama, y ninguna otra: no hay parámetro
-- con el que pedir la de otra persona.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.apartar_cita(
  p_inicia_en timestamptz,
  p_nombre text,
  p_correo text,
  p_nacionalidad char(2),
  p_en_eeuu boolean,
  p_whatsapp text,
  p_zona_horaria text,
  p_estado_usa text,
  p_servicio text,
  p_precio_usd integer,
  p_metodo_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  nueva public.citas%rowtype;
begin
  insert into public.citas
    (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria,
     estado_usa, servicio, precio_usd, metodo_pago)
  values
    (p_inicia_en, p_nombre, p_correo, p_nacionalidad, p_en_eeuu, p_whatsapp, p_zona_horaria,
     p_estado_usa, p_servicio, p_precio_usd, p_metodo_pago)
  returning * into nueva;

  return jsonb_build_object(
    'id', nueva.id,
    'codigoPago', nueva.codigo_pago,
    'expiraEn', nueva.expira_en
  );
end;
$func$;

revoke execute on function public.apartar_cita(timestamptz, text, text, char, boolean, text, text, text, text, integer, text) from public;
grant execute on function public.apartar_cita(timestamptz, text, text, char, boolean, text, text, text, text, integer, text) to anon, authenticated;
