-- Prueba transaccional: sólo registros sintéticos. El bloque interior SIEMPRE
-- revierte, incluida la cola HTTP de sus triggers. No toca citas existentes.
do $$
declare
  administrador uuid;
  t1 timestamptz;
  t2 timestamptz;
  eid bigint;
  cid bigint;
  version1 timestamptz;
  version2 timestamptz;
  datos jsonb;
  antes jsonb;
  despues jsonb;
begin
  select user_id into administrador from public.administradores limit 1;
  if administrador is null then raise exception 'Se necesita un administrador de prueba.'; end if;
  begin
    perform set_config('request.jwt.claims',jsonb_build_object('sub',administrador,'role','authenticated')::text,true);
    datos := jsonb_build_object('tipo','evento','titulo','PRUEBA TRANSACCIONAL','inicio','2088-07-14T16:00:00Z','fin','2088-07-14T17:00:00Z','ocupa',true,'nota','Sólo prueba');
    eid := public.guardar_agenda(datos);
    select actualizado_en into version1 from public.eventos where id=eid;
    perform public.guardar_agenda(datos || jsonb_build_object('id',eid,'version',version1,'titulo','PRUEBA EDITADA'));
    select actualizado_en into version2 from public.eventos where id=eid;
    if not exists(select 1 from public.eventos where id=eid and titulo='PRUEBA EDITADA') then raise exception 'Falló edición de evento.'; end if;
    begin
      perform public.guardar_agenda(datos || jsonb_build_object('id',eid,'version',version1));
      raise exception 'Se aceptó una versión obsoleta.';
    exception when serialization_failure then null; end;
    begin
      perform public.guardar_agenda(datos);
      raise exception 'Se aceptó un solapamiento.';
    exception when exclusion_violation then null; end;
    perform public.eliminar_evento_agenda(eid,version2);
    if exists(select 1 from public.eventos where id=eid) then raise exception 'Falló eliminación del evento sintético.'; end if;

    select h into t1 from generate_series('2088-07-14 00:00:00Z'::timestamptz,'2088-07-28 00:00:00Z'::timestamptz,interval '1 hour') h
      where public.dentro_del_horario(h) and not exists(select 1 from public.cierres x where h>=x.inicia_en and h<x.termina_en) order by h limit 1;
    select h into t2 from generate_series(t1+interval '1 hour',t1+interval '14 days',interval '1 hour') h
      where public.dentro_del_horario(h) and not exists(select 1 from public.cierres x where h>=x.inicia_en and h<x.termina_en) order by h limit 1;
    if t1 is null or t2 is null then raise exception 'No hay horario abierto para verificar la reprogramación.'; end if;
    insert into public.citas(inicia_en,nombre,correo,nacionalidad,en_eeuu,whatsapp,servicio,precio_usd,metodo_pago)
      values(t1,'PRUEBA TRANSACCIONAL','agenda@example.invalid','PE',false,'12025550100','asesoria',70,'zelle') returning id into cid;
    update public.citas set estado='reservada',pagado_en=now(),pago_fuente='manual' where id=cid;
    select to_jsonb(c)-'actualizado_en'-'nombre'-'inicia_en'-'whatsapp',actualizado_en into antes,version1 from public.citas c where id=cid;
    perform public.guardar_agenda(jsonb_build_object('tipo','cita','id',cid,'version',version1,'titulo','PRUEBA CORREGIDA','inicio',t2,'whatsapp','12025550101'));
    select to_jsonb(c)-'actualizado_en'-'nombre'-'inicia_en'-'whatsapp' into despues from public.citas c where id=cid;
    if antes is distinct from despues then raise exception 'La edición alteró campos de pago u otros datos.'; end if;
    if not exists(select 1 from public.citas where id=cid and inicia_en=t2 and nombre='PRUEBA CORREGIDA') then raise exception 'Falló reprogramación de cita.'; end if;
    begin
      perform public.guardar_agenda(datos || jsonb_build_object('inicio',t2,'fin',t2+interval '1 hour'));
      raise exception 'Se aceptó evento sobre cita.';
    exception when exclusion_violation then null; end;
    perform set_config('request.jwt.claims','{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000000"}',true);
    begin
      perform public.guardar_agenda(datos);
      raise exception 'Se aceptó edición sin administrador.';
    exception when insufficient_privilege then null; end;
    if has_function_privilege('anon','public.guardar_agenda(jsonb)','EXECUTE')
      or has_function_privilege('authenticated','public.reclamar_recordatorios()','EXECUTE')
      or has_table_privilege('authenticated','privado.entregas_recordatorio','SELECT') then raise exception 'Privilegios demasiado amplios.'; end if;
    raise exception 'Revertir los registros de prueba.' using errcode='ZX001';
  exception when sqlstate 'ZX001' then null;
  end;
end;
$$;
