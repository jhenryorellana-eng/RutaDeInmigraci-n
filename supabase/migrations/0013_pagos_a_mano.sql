-- ═══════════════════════════════════════════════════════════════
-- CUANDO LA CONCILIACIÓN NO PUDO DECIDIR
--
-- El caso normal se resuelve solo: una persona, un importe, una hora. Esto
-- es para el resto — dos personas con el mismo importe, un nombre que no se
-- parece en nada, o un pago que resultó ser de aquí aunque no lo pareciera.
--
-- Existe por una frase que Henry va a oír algún día: «yo pagué y no me
-- aparece». Sin estas dos funciones esa frase no tiene respuesta.
-- ═══════════════════════════════════════════════════════════════

/*
 * Asigna un pago a una solicitud, a mano.
 *
 * ── Por qué NO usa el secreto compartido ──
 *
 * Porque esto lo llama una PERSONA con sesión iniciada, no un proceso. El
 * secreto es para el conciliador, que corre sin sesión; aquí hay un
 * `auth.uid()` de verdad y la pregunta correcta es si esa persona es
 * administradora. Mezclar las dos llaves daría una función que dos caminos
 * distintos pueden abrir, que es como se pierden las auditorías.
 */
create or replace function public.zelle_asignar_a_mano(
  p_correo_id bigint,
  p_solicitud_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  c public.zelle_correos%rowtype;
  s public.solicitudes_pago%rowtype;
  nueva_id bigint;
begin
  if not public.es_admin() then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  select * into c from public.zelle_correos where id = p_correo_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'Ese pago no existe.');
  end if;
  if c.decision = 'confirmado' then
    return jsonb_build_object('ok', false, 'motivo', 'Ese pago ya está asignado a una cita.');
  end if;

  select * into s from public.solicitudes_pago where id = p_solicitud_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'Esa solicitud no existe.');
  end if;
  if s.estado <> 'esperando' then
    return jsonb_build_object('ok', false, 'motivo', 'Esa solicitud ya no está esperando pago.');
  end if;

  /* La hora sigue siendo la pregunta que decide. Aunque Henry lo asigne a
     mano, si otra persona ya compró ese hueco NO se crea la cita: dos
     personas a la misma hora es peor que un pago sin apuntar. */
  if exists (
    select 1 from public.citas x
    where x.inicia_en = s.inicia_en and x.estado <> 'cancelada'
  ) then
    update public.solicitudes_pago
       set estado = 'hora_tomada', referencia_pago = c.transaccion,
           motivo = 'Pagó, pero otra persona tomó esa hora antes. Hay que devolver el dinero.'
     where id = s.id;
    return jsonb_build_object('ok', false, 'motivo', 'Esa hora ya la tiene otra persona.');
  end if;

  insert into public.citas
    (inicia_en, nombre, correo, nacionalidad, en_eeuu, whatsapp, zona_horaria,
     estado_usa, servicio, precio_usd, metodo_pago)
  values
    (s.inicia_en, s.nombre, s.correo, s.nacionalidad, s.en_eeuu, s.whatsapp, s.zona_horaria,
     s.estado_usa, s.servicio, s.precio_usd, 'zelle')
  returning id into nueva_id;

  /* `manual` y no `banco_auto`: dentro de un año, quien lea esta fila tiene
     que poder distinguir lo que decidió el sistema de lo que decidió Henry. */
  perform public.confirmar_pago(nueva_id, 'zelle', 'manual', c.transaccion);

  update public.solicitudes_pago
     set estado = 'usada', cita_id = nueva_id, referencia_pago = c.transaccion
   where id = s.id;

  update public.zelle_correos
     set decision = 'confirmado', cita_id = nueva_id,
         motivo = 'Asignado a mano por Henry.'
   where id = c.id;

  return jsonb_build_object('ok', true, 'cita_id', nueva_id);
end;
$func$;

/*
 * Descartar un pago que no es de aquí.
 *
 * Casi siempre será de x-legal: el buzón es compartido y sus pagos también
 * se leen. Se marca `rechazado` con el motivo en vez de borrarse, porque la
 * fila es la prueba de que ese dinero se vio y se decidió que no era nuestro.
 */
create or replace function public.zelle_descartar(p_correo_id bigint, p_motivo text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
begin
  if not public.es_admin() then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  update public.zelle_correos
     set decision = 'rechazado',
         motivo = 'Descartado por Henry: ' || coalesce(nullif(btrim(p_motivo), ''), 'no es de este negocio')
   where id = p_correo_id and decision <> 'confirmado';
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'No se pudo descartar.');
  end if;
  return jsonb_build_object('ok', true);
end;
$func$;

revoke execute on function public.zelle_asignar_a_mano(bigint, bigint) from public, anon;
revoke execute on function public.zelle_descartar(bigint, text) from public, anon;
grant execute on function public.zelle_asignar_a_mano(bigint, bigint) to authenticated;
grant execute on function public.zelle_descartar(bigint, text) to authenticated;
