-- Edición administrativa: no modifica servicios, importes ni conciliación.
alter table public.citas add column actualizado_en timestamptz not null default now();
alter table public.eventos add column actualizado_en timestamptz not null default now();
create function public.version_editor_agenda() returns integer language sql stable security invoker set search_path='' as $$select case when public.es_admin() then 1 else 0 end;$$;
revoke all on function public.version_editor_agenda() from public,anon;
grant execute on function public.version_editor_agenda() to authenticated;

create or replace function privado.marcar_actualizacion_agenda()
returns trigger language plpgsql set search_path = '' as $$
begin new.actualizado_en := clock_timestamp(); return new; end;
$$;
revoke all on function privado.marcar_actualizacion_agenda() from public, anon, authenticated;
create trigger agenda_version before update on public.citas for each row execute function privado.marcar_actualizacion_agenda();
create trigger agenda_version before update on public.eventos for each row execute function privado.marcar_actualizacion_agenda();

-- Un mismo cerrojo serializa reservas públicas y eventos manuales. La comprobación
-- debe ver las dos tablas incluso cuando quien reserva tiene el rol anon.
create or replace function privado.comprobar_solape_agenda()
returns trigger language plpgsql security definer set search_path = '' as $$
declare hasta timestamptz;
begin
  if tg_table_name = 'citas' then
    if new.estado = 'cancelada' then return new; end if;
    if tg_op = 'UPDATE' and new.inicia_en = old.inicia_en and old.estado <> 'cancelada' then return new; end if;
    hasta := new.inicia_en + interval '1 hour';
  else
    if not new.ocupa then return new; end if;
    if tg_op = 'UPDATE' and new.inicia_en = old.inicia_en and new.termina_en = old.termina_en and old.ocupa then return new; end if;
    hasta := new.termina_en;
  end if;
  perform pg_advisory_xact_lock(7241202609);
  if exists (
    select 1 from public.citas c where c.estado <> 'cancelada'
      and (tg_table_name <> 'citas' or c.id <> new.id)
      and c.inicia_en < hasta and c.inicia_en + interval '1 hour' > new.inicia_en
  ) or exists (
    select 1 from public.eventos e where e.ocupa
      and (tg_table_name <> 'eventos' or e.id <> new.id)
      and e.inicia_en < hasta and e.termina_en > new.inicia_en
  ) then raise exception 'La hora ya está ocupada.' using errcode = '23P01'; end if;
  return new;
end;
$$;
revoke all on function privado.comprobar_solape_agenda() from public, anon, authenticated;
create trigger agenda_comprobar_solape before insert or update of inicia_en, estado on public.citas for each row execute function privado.comprobar_solape_agenda();
create trigger agenda_comprobar_solape before insert or update of inicia_en, termina_en, ocupa on public.eventos for each row execute function privado.comprobar_solape_agenda();

-- Conserva la conciliación y su respuesta HORA_TOMADA si un evento manual
-- ocupa la hora durante el pago. El cerrojo es el mismo de los dos calendarios.
create or replace function public.cita_desde_solicitud(secreto text, p_solicitud_id bigint, p_metodo text, p_fuente text, p_referencia text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare esperado text := privado.secreto_aviso(); s public.solicitudes_pago%rowtype; nueva_id bigint;
begin
  if esperado is null or secreto is distinct from esperado then raise exception 'no autorizado' using errcode='insufficient_privilege'; end if;
  perform pg_advisory_xact_lock(7241202609);
  select * into s from public.solicitudes_pago where id=p_solicitud_id for update;
  if not found then return jsonb_build_object('ok',false,'motivo','SOLICITUD_NO_EXISTE'); end if;
  if s.estado='usada' then return jsonb_build_object('ok',true,'ya_estaba',true,'cita_id',s.cita_id); end if;
  if s.estado='hora_tomada' then return jsonb_build_object('ok',false,'motivo','HORA_TOMADA'); end if;
  if exists(select 1 from public.citas c where c.inicia_en=s.inicia_en and c.estado<>'cancelada')
    or exists(select 1 from public.eventos e where e.ocupa and e.inicia_en<s.inicia_en+interval '1 hour' and e.termina_en>s.inicia_en) then
    update public.solicitudes_pago set estado='hora_tomada', referencia_pago=p_referencia,
      motivo='Pagó, pero esa hora se ocupó antes. Hay que devolver el dinero.' where id=s.id;
    return jsonb_build_object('ok',false,'motivo','HORA_TOMADA','solicitud_id',s.id);
  end if;
  insert into public.citas(inicia_en,nombre,correo,nacionalidad,en_eeuu,whatsapp,zona_horaria,estado_usa,servicio,precio_usd,metodo_pago)
    values(s.inicia_en,s.nombre,s.correo,s.nacionalidad,s.en_eeuu,s.whatsapp,s.zona_horaria,s.estado_usa,s.servicio,s.precio_usd,coalesce(p_metodo,s.metodo_pago)) returning id into nueva_id;
  perform public.confirmar_pago(nueva_id,coalesce(p_metodo,s.metodo_pago),p_fuente,p_referencia);
  update public.solicitudes_pago set estado='usada',cita_id=nueva_id,referencia_pago=p_referencia where id=s.id;
  return jsonb_build_object('ok',true,'ya_estaba',false,'cita_id',nueva_id);
end;
$$;

create or replace function public.guardar_agenda(p jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare
  v_id bigint := (p->>'id')::bigint;
  inicio timestamptz := (p->>'inicio')::timestamptz;
  fin timestamptz := (p->>'fin')::timestamptz;
  v_titulo text := btrim(p->>'titulo');
  c public.citas%rowtype;
  e public.eventos%rowtype;
begin
  if not (select public.es_admin()) then raise exception 'Sólo administradores.' using errcode='42501'; end if;
  if p->>'tipo' is null or p->>'tipo' not in ('cita','evento') or inicio is null
    or date_trunc('hour', inicio) <> inicio or v_titulo is null or length(v_titulo) < 1 then
    raise exception 'AGENDA: Revisa el título, la fecha y la hora.' using errcode='23514';
  end if;
  perform pg_advisory_xact_lock(7241202609);
  if p->>'tipo' = 'cita' then
    select * into c from public.citas where id=v_id for update;
    if not found or c.estado='cancelada' then raise exception 'No existe.' using errcode='P0002'; end if;
    if c.actualizado_en is distinct from (p->>'version')::timestamptz then raise exception 'Cambió.' using errcode='40001'; end if;
    if inicio <> c.inicia_en then
      if c.estado='pendiente' then raise exception 'AGENDA: Espera a que se confirme el pago para reprogramar.' using errcode='23514'; end if;
      if inicio <= now() then raise exception 'AGENDA: Elige una hora futura.' using errcode='23514'; end if;
      if not public.dentro_del_horario(inicio) or exists (select 1 from public.cierres x where inicio >= x.inicia_en and inicio < x.termina_en) then
        raise exception 'AGENDA: Esa hora está cerrada o fuera del horario de atención.' using errcode='23514';
      end if;
    end if;
    update public.citas set inicia_en=inicio, nombre=v_titulo, whatsapp=nullif(p->>'whatsapp','') where id=v_id;
  else
    if length(v_titulo)>80 or fin is null or fin<=inicio or fin>inicio+interval '24 hours'
      or date_trunc('hour',fin)<>fin or length(coalesce(p->>'nota',''))>2000 or jsonb_typeof(p->'ocupa') is distinct from 'boolean' then
      raise exception 'AGENDA: Revisa el título, las notas y la duración (1 a 24 horas).' using errcode='23514';
    end if;
    if v_id is not null then
      select * into e from public.eventos where id=v_id for update;
      if not found then raise exception 'No existe.' using errcode='P0002'; end if;
      if e.actualizado_en is distinct from (p->>'version')::timestamptz then raise exception 'Cambió.' using errcode='40001'; end if;
    end if;
    if (v_id is null or inicio is distinct from e.inicia_en) and inicio <= now() then raise exception 'AGENDA: Elige una hora futura.' using errcode='23514'; end if;
    if v_id is null then
      insert into public.eventos(titulo,inicia_en,termina_en,ocupa,nota) values(v_titulo,inicio,fin,(p->>'ocupa')::boolean,nullif(p->>'nota','')) returning id into v_id;
    else
      update public.eventos set titulo=v_titulo, inicia_en=inicio, termina_en=fin, ocupa=(p->>'ocupa')::boolean, nota=nullif(p->>'nota','') where id=v_id;
    end if;
  end if;
  return v_id;
end;
$$;
revoke all on function public.guardar_agenda(jsonb) from public, anon;
grant execute on function public.guardar_agenda(jsonb) to authenticated;

create or replace function public.eliminar_evento_agenda(p_id bigint, p_version timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare version_actual timestamptz;
begin
  if not (select public.es_admin()) then raise exception 'Sólo administradores.' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(7241202609);
  select actualizado_en into version_actual from public.eventos where id=p_id for update;
  if not found then raise exception 'No existe.' using errcode='P0002'; end if;
  if version_actual is distinct from p_version then raise exception 'Cambió.' using errcode='40001'; end if;
  delete from public.eventos where id=p_id;
end;
$$;
revoke all on function public.eliminar_evento_agenda(bigint,timestamptz) from public, anon;
grant execute on function public.eliminar_evento_agenda(bigint,timestamptz) to authenticated;

-- Preferencia de cada teléfono. NULL desactiva sólo los recordatorios;
-- los avisos existentes de nuevas reservas se conservan.
alter table public.suscripciones_push add column recordatorio_minutos smallint default 5
  check (recordatorio_minutos in (0,5));

create table privado.entregas_recordatorio (
  id bigint generated always as identity primary key,
  tipo text not null check(tipo in ('cita','evento')),
  registro_id bigint not null,
  inicia_en timestamptz not null,
  suscripcion_id bigint not null references public.suscripciones_push(id) on delete cascade,
  minutos smallint not null,
  intentos smallint not null default 0,
  token uuid,
  arrendado_hasta timestamptz,
  enviado_en timestamptz,
  resultado text,
  unique(tipo,registro_id,inicia_en,suscripcion_id,minutos)
);
revoke all on privado.entregas_recordatorio from public, anon, authenticated;
alter table privado.entregas_recordatorio enable row level security;

create view privado.recordatorios_vigentes with (security_invoker=true) as
select a.tipo, a.registro_id, a.inicia_en, s.id suscripcion_id, s.recordatorio_minutos minutos
from (
  select 'cita'::text tipo, id registro_id, inicia_en from public.citas where estado='reservada'
  union all
  select 'evento'::text, id, inicia_en from public.eventos
) a
join public.suscripciones_push s on s.recordatorio_minutos is not null
join public.administradores adm on adm.user_id=s.user_id
where a.inicia_en - make_interval(mins => s.recordatorio_minutos) <= now()
  and a.inicia_en > now() - interval '2 minutes';
revoke all on privado.recordatorios_vigentes from public, anon, authenticated;

-- Definers permanecen en privado. Sólo el worker con service_role puede invocar
-- los wrappers: nunca se entregan endpoints ni claves push al navegador.
create function privado.reclamar_recordatorios()
returns jsonb language plpgsql security definer set search_path='' as $$
declare salida jsonb;
begin
  delete from privado.entregas_recordatorio where inicia_en < now()-interval '30 days';
  insert into privado.entregas_recordatorio(tipo,registro_id,inicia_en,suscripcion_id,minutos)
    select * from privado.recordatorios_vigentes on conflict do nothing;
  with candidatos as (
    select e.id from privado.entregas_recordatorio e
    join privado.recordatorios_vigentes v using(tipo,registro_id,inicia_en,suscripcion_id,minutos)
    where e.enviado_en is null and e.intentos<3 and (e.arrendado_hasta is null or e.arrendado_hasta<now())
    order by e.inicia_en limit 100 for update of e skip locked
  ), tomados as (
    update privado.entregas_recordatorio e set token=gen_random_uuid(), arrendado_hasta=now()+interval '90 seconds', intentos=intentos+1
    where e.id in (select id from candidatos) returning e.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'token',t.token,'tipo',t.tipo,'registro_id',t.registro_id,
      'inicia_en',t.inicia_en,'minutos',t.minutos,'endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth)), '[]'::jsonb)
    into salida from tomados t join public.suscripciones_push s on s.id=t.suscripcion_id;
  return salida;
end;
$$;
create function privado.recordatorio_vigente(p_id bigint,p_token uuid)
returns boolean language sql security definer set search_path='' as $$
  select exists(select 1 from privado.entregas_recordatorio e
    join privado.recordatorios_vigentes v using(tipo,registro_id,inicia_en,suscripcion_id,minutos)
    where e.id=p_id and e.token=p_token and e.enviado_en is null and e.arrendado_hasta>now());
$$;
create function privado.finalizar_recordatorio(p_id bigint,p_token uuid,p_resultado text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if p_resultado='expirado' then
    delete from public.suscripciones_push where id in (select suscripcion_id from privado.entregas_recordatorio where id=p_id and token=p_token);
  else
    update privado.entregas_recordatorio set
      enviado_en=case when p_resultado='enviado' then now() else null end,
      resultado=p_resultado, arrendado_hasta=now()+interval '30 seconds'
      where id=p_id and token=p_token and p_resultado in ('enviado','reintentar','omitido');
  end if;
end;
$$;
create function public.reclamar_recordatorios() returns jsonb language sql security invoker set search_path='' as $$select privado.reclamar_recordatorios();$$;
create function public.recordatorio_vigente(p_id bigint,p_token uuid) returns boolean language sql security invoker set search_path='' as $$select privado.recordatorio_vigente(p_id,p_token);$$;
create function public.finalizar_recordatorio(p_id bigint,p_token uuid,p_resultado text) returns void language sql security invoker set search_path='' as $$select privado.finalizar_recordatorio(p_id,p_token,p_resultado);$$;
revoke all on function privado.reclamar_recordatorios(),privado.recordatorio_vigente(bigint,uuid),privado.finalizar_recordatorio(bigint,uuid,text) from public,anon,authenticated;
revoke all on function public.reclamar_recordatorios(),public.recordatorio_vigente(bigint,uuid),public.finalizar_recordatorio(bigint,uuid,text) from public,anon,authenticated;
grant usage on schema privado to service_role;
grant execute on function privado.reclamar_recordatorios(),privado.recordatorio_vigente(bigint,uuid),privado.finalizar_recordatorio(bigint,uuid,text) to service_role;
grant execute on function public.reclamar_recordatorios(),public.recordatorio_vigente(bigint,uuid),public.finalizar_recordatorio(bigint,uuid,text) to service_role;

create extension if not exists pg_cron;
create or replace function privado.solicitar_recordatorios()
returns void language plpgsql security definer set search_path='' as $$
begin
  if privado.secreto_aviso() is null then raise exception 'Falta configurar el secreto de avisos.'; end if;
  perform net.http_post(
    url := 'https://ygrrvrhgqpwwcwfwpxqm.supabase.co/functions/v1/recordatorios-agenda',
    headers := jsonb_build_object('Content-Type','application/json','x-aviso-secreto',privado.secreto_aviso()),
    body := '{}'::jsonb, timeout_milliseconds := 15000
  );
end;
$$;
revoke all on function privado.solicitar_recordatorios() from public,anon,authenticated;
select cron.schedule('recordatorios-agenda','* * * * *','select privado.solicitar_recordatorios();');

alter table public.suscripciones_push add column ultima_prueba_en timestamptz;
create function privado.probar_recordatorio(p_endpoint text)
returns void language plpgsql security definer set search_path='' as $$
declare s public.suscripciones_push%rowtype;
begin
  if not (select public.es_admin()) then raise exception 'Sólo administradores.' using errcode='42501'; end if;
  select * into s from public.suscripciones_push where endpoint=p_endpoint and user_id=(select auth.uid()) for update;
  if not found then raise exception 'Dispositivo no registrado.' using errcode='P0002'; end if;
  if s.ultima_prueba_en > now()-interval '1 minute' then raise exception 'Espera un minuto.' using errcode='23514'; end if;
  if privado.secreto_aviso() is null then raise exception 'Falta configuración.'; end if;
  update public.suscripciones_push set ultima_prueba_en=now() where id=s.id;
  perform net.http_post(url := 'https://ygrrvrhgqpwwcwfwpxqm.supabase.co/functions/v1/recordatorios-agenda',
    headers := jsonb_build_object('Content-Type','application/json','x-aviso-secreto',privado.secreto_aviso()),
    body := jsonb_build_object('prueba_id',s.id), timeout_milliseconds := 15000);
end;
$$;
-- Este wrapper estrecho eleva sólo para llamar al helper privado que comprueba
-- administrador, propietario y frecuencia. No concede acceso al esquema privado.
create function public.probar_recordatorio(p_endpoint text) returns void language sql security definer set search_path='' as $$select privado.probar_recordatorio(p_endpoint);$$;
revoke all on function privado.probar_recordatorio(text),public.probar_recordatorio(text) from public,anon;
revoke all on function privado.probar_recordatorio(text) from authenticated;
grant execute on function public.probar_recordatorio(text) to authenticated;
