-- ═══════════════════════════════════════════════════════════════
-- NADA ENTRA EN LA AGENDA HASTA QUE EL DINERO ESTÁ
--
-- `0008` retenía la hora media hora mientras la persona pagaba. Protegía a
-- quien pagaba —nunca volvía del banco sin hueco— pero a costa de bloquear
-- una hora que quizá nadie iba a comprar, y de que Henry viera en su agenda
-- algo que podía evaporarse.
--
-- La decisión ahora es la contraria y es de negocio: la agenda es sagrada.
-- Mientras no haya pago no se ocupa NADA, y esa hora se le puede vender a
-- cualquier otro.
--
-- ── Dónde viven entonces los datos ──
--
-- Aquí. Una SOLICITUD no es una cita: guarda quién es, qué hora quiere y
-- cuánto cuesta, y no aparece en la agenda ni bloquea nada. Cuando el pago
-- llega, la solicitud se convierte en cita.
--
-- Sin esta tabla no habría forma de conciliar un Zelle: ese pago llega por
-- correo minutos después, y sin un apunte previo con importe y código no hay
-- contra qué casarlo.
--
-- ── El riesgo que se acepta, dicho en voz alta ──
--
-- Dos personas pueden pedir la misma hora y pagar las dos. La segunda en
-- llegar se queda sin hueco con el dinero ya enviado, y hay que devolvérselo.
--
-- No se puede evitar sin retener la hora, que es justo lo que se ha
-- descartado. Lo que sí se hace es que NO PASE EN SILENCIO: la solicitud
-- queda marcada `hora_tomada`, con su referencia de pago, para que Henry lo
-- vea y devuelva. Un cobro sin cita que nadie mira es lo único inaceptable.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.solicitudes_pago (
  id bigint generated always as identity primary key,

  /* Todo lo que hará falta para crear la cita cuando entre el dinero. */
  inicia_en timestamptz not null,
  nombre text not null,
  correo text not null,
  nacionalidad char(2) not null,
  en_eeuu boolean not null,
  whatsapp text not null,
  zona_horaria text,
  estado_usa text,
  servicio text not null,
  precio_usd integer not null,
  metodo_pago text,

  /* El código de cuatro dígitos que se escribe en el memo del Zelle. */
  codigo_pago char(4) not null,

  estado text not null default 'esperando',
  /* La cita que salió de aquí, si salió. */
  cita_id bigint references public.citas (id) on delete set null,
  /* Con qué se pagó: la sesión de Stripe o la transacción del banco. Es lo
     que hay que buscar para devolver el dinero cuando la hora ya no está. */
  referencia_pago text,
  motivo text,

  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '2 hours',

  constraint solicitud_estado_valido
    check (estado in ('esperando', 'usada', 'hora_tomada', 'caducada')),
  constraint solicitud_servicio_valido
    check (servicio in ('primera', 'segunda', 'tercera')),
  constraint solicitud_codigo_forma check (codigo_pago ~ '^[0-9]{4}$'),
  constraint solicitud_empieza_en_punto
    check (date_trunc('hour', inicia_en) = inicia_en)
);

/* Único entre las que ESPERAN, igual que antes: con cuatro dígitos no se
   pueden reservar de por vida, y basta con que no haya dos a la vez. */
create unique index if not exists solicitud_codigo_unico_esperando
  on public.solicitudes_pago (codigo_pago)
  where estado = 'esperando';

create index if not exists solicitud_esperando_por_precio
  on public.solicitudes_pago (precio_usd)
  where estado = 'esperando';

alter table public.solicitudes_pago enable row level security;
alter table public.solicitudes_pago force row level security;

/* El público no lee NADA de aquí: son nombres, correos y teléfonos de gente
   que ni siquiera ha llegado a ser cliente. Escribe sólo a través de la
   función de abajo, que no devuelve más que lo suyo. */
revoke all on public.solicitudes_pago from anon, authenticated;
grant select on public.solicitudes_pago to authenticated;

drop policy if exists solicitudes_admin_lee on public.solicitudes_pago;
create policy solicitudes_admin_lee
  on public.solicitudes_pago for select to authenticated
  using ((select public.es_admin()));

-- ═══════════════════════════════════════════════════════════════
-- PEDIR UNA HORA — sin ocuparla
-- ═══════════════════════════════════════════════════════════════

/*
 * Crea la solicitud y devuelve lo que quien pide necesita para pagar.
 *
 * Comprueba que la hora esté libre AHORA, no para reservarla sino para no
 * mandar a nadie a pagar por algo que ya está vendido. Entre esta
 * comprobación y el pago puede cambiar, y ese es el riesgo asumido.
 */
create or replace function public.pedir_hora(
  p_inicia_en timestamptz, p_nombre text, p_correo text, p_nacionalidad char(2),
  p_en_eeuu boolean, p_whatsapp text, p_zona_horaria text, p_estado_usa text,
  p_servicio text, p_precio_usd integer, p_metodo_pago text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  intento int := 0;
  candidato char(4);
  nueva public.solicitudes_pago%rowtype;
  numero text;
begin
  if p_inicia_en <= now() then
    raise exception 'La hora elegida ya pasó.' using errcode = 'check_violation';
  end if;
  if not public.dentro_del_horario(p_inicia_en) then
    raise exception 'Esa hora está fuera del horario de atención.' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.cierres c
    where p_inicia_en >= c.inicia_en and p_inicia_en < c.termina_en
  ) then
    raise exception 'Esa hora no está disponible.' using errcode = 'check_violation';
  end if;

  /* ¿Sigue libre? Sólo para avisar antes de cobrar. No la reserva. */
  if exists (
    select 1 from public.citas c
    where c.inicia_en = p_inicia_en and c.estado <> 'cancelada'
  ) then
    raise exception 'Esa hora ya está ocupada.' using errcode = 'check_violation';
  end if;

  numero := regexp_replace(coalesce(p_whatsapp, ''), '[^0-9]', '', 'g');
  if length(numero) < 8 then
    raise exception 'Hace falta un número de WhatsApp para poder escribirte.'
      using errcode = 'check_violation';
  end if;

  loop
    intento := intento + 1;
    candidato := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (
      select 1 from public.solicitudes_pago where codigo_pago = candidato and estado = 'esperando'
    );
    if intento >= 40 then
      raise exception 'No se pudo asignar un código de pago. Inténtalo otra vez.'
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into public.solicitudes_pago
    (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria,
     estado_usa, servicio, precio_usd, metodo_pago, codigo_pago)
  values
    (p_inicia_en, btrim(p_nombre), lower(btrim(p_correo)), upper(p_nacionalidad),
     p_en_eeuu, numero, nullif(btrim(coalesce(p_zona_horaria, '')), ''),
     case when p_en_eeuu then nullif(btrim(coalesce(p_estado_usa, '')), '') else null end,
     p_servicio, p_precio_usd, p_metodo_pago, candidato)
  returning * into nueva;

  return jsonb_build_object('id', nueva.id, 'codigoPago', nueva.codigo_pago);
end;
$func$;

revoke execute on function public.pedir_hora(timestamptz, text, text, char, boolean, text, text, text, text, integer, text) from public;
grant execute on function public.pedir_hora(timestamptz, text, text, char, boolean, text, text, text, text, integer, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- EL PAGO CREA LA CITA — no antes, no de otra forma
-- ═══════════════════════════════════════════════════════════════

/*
 * Convierte una solicitud pagada en cita.
 *
 * Es la ÚNICA puerta por la que entra algo a la agenda. Todo bajo cerrojo
 * sobre la solicitud, porque el webhook de Stripe reintenta y el barrido de
 * correos puede leer dos veces la misma alerta: cobrar una vez y crear dos
 * citas sería peor que no crear ninguna.
 *
 * Si la hora se la llevó otro mientras tanto, NO se crea nada y la solicitud
 * queda marcada `hora_tomada` con la referencia del pago. Eso es una
 * devolución pendiente, y tiene que verse.
 */
create or replace function public.cita_desde_solicitud(
  secreto text, p_solicitud_id bigint, p_metodo text, p_fuente text, p_referencia text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
  s public.solicitudes_pago%rowtype;
  nueva_id bigint;
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  select * into s from public.solicitudes_pago where id = p_solicitud_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'SOLICITUD_NO_EXISTE');
  end if;

  /* Ya se usó: un reintento del webhook, no un error. Se devuelve la cita
     que salió la primera vez. */
  if s.estado = 'usada' then
    return jsonb_build_object('ok', true, 'ya_estaba', true, 'cita_id', s.cita_id);
  end if;
  if s.estado = 'hora_tomada' then
    return jsonb_build_object('ok', false, 'motivo', 'HORA_TOMADA');
  end if;

  /* ¿La hora sigue libre? Es la pregunta que decide todo. */
  if exists (
    select 1 from public.citas c
    where c.inicia_en = s.inicia_en and c.estado <> 'cancelada'
  ) then
    update public.solicitudes_pago
       set estado = 'hora_tomada', referencia_pago = p_referencia,
           motivo = 'Pagó, pero otra persona tomó esa hora antes. Hay que devolver el dinero.'
     where id = s.id;
    return jsonb_build_object('ok', false, 'motivo', 'HORA_TOMADA', 'solicitud_id', s.id);
  end if;

  insert into public.citas
    (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria,
     estado_usa, servicio, precio_usd, metodo_pago)
  values
    (s.inicia_en, s.nombre, s.correo, s.nacionalidad, s.en_eeuu, s.whatsapp, s.zona_horaria,
     s.estado_usa, s.servicio, s.precio_usd, coalesce(p_metodo, s.metodo_pago))
  returning id into nueva_id;

  /* Nace pendiente por el trigger; el pago ya está, así que se asciende. */
  perform public.confirmar_pago(nueva_id, coalesce(p_metodo, s.metodo_pago), p_fuente, p_referencia);

  update public.solicitudes_pago
     set estado = 'usada', cita_id = nueva_id, referencia_pago = p_referencia
   where id = s.id;

  return jsonb_build_object('ok', true, 'ya_estaba', false, 'cita_id', nueva_id);
end;
$func$;

revoke execute on function public.cita_desde_solicitud(text, bigint, text, text, text) from public;
grant execute on function public.cita_desde_solicitud(text, bigint, text, text, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- LA CONCILIACIÓN, AHORA CONTRA SOLICITUDES
-- ═══════════════════════════════════════════════════════════════

create or replace function public.zelle_apuntar_y_candidatas(
  secreto text, p_transaccion text, p_remitente text, p_monto_centavos integer,
  p_memo text, p_enviado_el date, p_auth_ok boolean, p_auth_detalle jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
  nuevo_id bigint;
  candidatas jsonb;
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  insert into public.zelle_correos
    (transaccion, remitente, monto_centavos, memo, enviado_el, auth_ok, auth_detalle)
  values
    (p_transaccion, p_remitente, p_monto_centavos, p_memo, p_enviado_el, p_auth_ok, p_auth_detalle)
  on conflict (transaccion) do nothing
  returning id into nuevo_id;

  if nuevo_id is null then
    return jsonb_build_object('ya_visto', true);
  end if;

  update public.solicitudes_pago
     set estado = 'caducada'
   where estado = 'esperando' and expira_en < now();

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id, 'nombre', s.nombre, 'codigoPago', s.codigo_pago,
           'precioUsd', s.precio_usd,
           'creadoEnMs', (extract(epoch from s.creado_en) * 1000)::bigint
         )), '[]'::jsonb)
    into candidatas
    from public.solicitudes_pago s
   where s.estado = 'esperando' and s.precio_usd * 100 = p_monto_centavos;

  return jsonb_build_object('ya_visto', false, 'correo_id', nuevo_id, 'candidatas', candidatas);
end;
$func$;

/*
 * Aplicar, ahora creando la cita desde la solicitud.
 *
 * El `id` que trae la decisión es de una SOLICITUD, no de una cita: es lo
 * que devolvió la función de arriba.
 */
create or replace function public.zelle_aplicar(
  secreto text, p_transaccion text, p_decision text, p_cita_id bigint, p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
  resultado jsonb := jsonb_build_object('ok', true);
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  if p_decision = 'confirmado' and p_cita_id is not null then
    resultado := public.cita_desde_solicitud(secreto, p_cita_id, 'zelle', 'banco_auto', p_transaccion);
    if not coalesce((resultado->>'ok')::boolean, false) then
      update public.zelle_correos
         set decision = 'sin_identificar',
             motivo = 'Pago recibido pero no se pudo crear la cita: '
                      || coalesce(resultado->>'motivo', 'desconocido')
                      || '. Revisar y devolver si hace falta.'
       where transaccion = p_transaccion;
      return resultado;
    end if;
    update public.zelle_correos
       set decision = 'confirmado', cita_id = (resultado->>'cita_id')::bigint, motivo = p_motivo
     where transaccion = p_transaccion;
    return resultado;
  end if;

  update public.zelle_correos
     set decision = p_decision, motivo = p_motivo
   where transaccion = p_transaccion;

  return resultado;
end;
$func$;
