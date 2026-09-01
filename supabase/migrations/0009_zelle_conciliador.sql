-- ═══════════════════════════════════════════════════════════════
-- LAS PUERTAS DEL CONCILIADOR
--
-- El conciliador vive en el sitio, porque tiene que hablar IMAP y eso no se
-- hace desde SQL. Pero NO puede llevar la `service_role`: la regla de este
-- proyecto es que esa llave no entra aquí, porque se salta el RLS entero y
-- el RLS es lo único que impide leer el nombre, el correo, el teléfono y la
-- nacionalidad de todas las personas que han reservado.
--
-- Así que en vez de la llave maestra, cuatro funciones estrechas con el
-- mismo secreto compartido que ya usa el aviso al teléfono (`0005`). Lo que
-- el sitio puede hacer con ese secreto es exactamente esto y nada más:
--
--   · apuntar un correo del banco y preguntar qué citas esperan ESE importe
--   · aplicar la decisión sobre UNA cita
--   · leer y guardar por dónde iba la lectura del buzón
--
-- Aunque el secreto se filtrara, quien lo tuviera no podría listar la agenda
-- ni sacar los datos de nadie: sólo preguntar «¿quién espera $70 ahora
-- mismo?». Es una superficie pequeña y acotada, no un acceso general — y esa
-- diferencia es justo la que la `service_role` borra.
-- ═══════════════════════════════════════════════════════════════

/*
 * Apunta el correo y devuelve las candidatas.
 *
 * El insert va con `on conflict do nothing` sobre el número de transacción,
 * que es la llave de idempotencia: Chase reenvía la misma alerta y el
 * Message-ID cambia, pero ese número nunca. Si ya estaba, devuelve
 * `ya_visto` y quien llama no vuelve a aplicar nada. Sin eso, un reenvío del
 * banco confirmaría una segunda cita con el mismo dinero.
 *
 * Antes de mirar candidatas se barren las pendientes vencidas: una que
 * caducó hace media hora no debería aparecer como candidata a nada.
 */
create or replace function public.zelle_apuntar_y_candidatas(
  secreto text,
  p_transaccion text,
  p_remitente text,
  p_monto_centavos integer,
  p_memo text,
  p_enviado_el date,
  p_auth_ok boolean,
  p_auth_detalle jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := current_setting('app.aviso_secreto', true);
  nuevo_id bigint;
  candidatas jsonb;
begin
  if esperado is null or esperado = '' or secreto is distinct from esperado then
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

  perform public.liberar_pendientes_vencidas();

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id,
           'nombre', c.nombre,
           'codigoPago', c.codigo_pago,
           'precioUsd', c.precio_usd,
           'creadoEnMs', (extract(epoch from c.creado_en) * 1000)::bigint
         )), '[]'::jsonb)
    into candidatas
    from public.citas c
   where c.estado = 'pendiente'
     and c.precio_usd * 100 = p_monto_centavos;

  return jsonb_build_object('ya_visto', false, 'correo_id', nuevo_id, 'candidatas', candidatas);
end;
$func$;

/*
 * Aplica lo que se decidió sobre ese correo.
 *
 * Confirmar pasa por `confirmar_pago()`, que es la única puerta que asciende
 * una cita y la que toma el cerrojo. Si esa puerta se niega —la pendiente
 * caducó y otra persona se llevó la hora—, el correo NO se marca como
 * confirmado: queda con el motivo real escrito, que es lo que Henry va a
 * leer el día que alguien le diga «yo sí pagué».
 */
create or replace function public.zelle_aplicar(
  secreto text,
  p_transaccion text,
  p_decision text,
  p_cita_id bigint,
  p_motivo text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := current_setting('app.aviso_secreto', true);
  resultado jsonb := jsonb_build_object('ok', true);
begin
  if esperado is null or esperado = '' or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  if p_decision = 'confirmado' and p_cita_id is not null then
    resultado := public.confirmar_pago(p_cita_id, 'zelle', 'banco_auto', p_transaccion);
    if not coalesce((resultado->>'ok')::boolean, false) then
      update public.zelle_correos
         set decision = 'sin_identificar',
             cita_id = p_cita_id,
             motivo = 'No se pudo aplicar: ' || coalesce(resultado->>'motivo', 'desconocido')
       where transaccion = p_transaccion;
      return resultado;
    end if;
  end if;

  update public.zelle_correos
     set decision = p_decision,
         cita_id = p_cita_id,
         motivo = p_motivo
   where transaccion = p_transaccion;

  return resultado;
end;
$func$;

/*
 * El cursor del buzón.
 *
 * Va por función y no por política de RLS porque quien lo usa es el
 * conciliador, que no tiene sesión: darle una política a `anon` sobre la
 * tabla abriría su lectura a cualquiera con la clave pública.
 */
create or replace function public.zelle_cursor_leer(secreto text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := current_setting('app.aviso_secreto', true);
  fila public.zelle_cursor%rowtype;
begin
  if esperado is null or esperado = '' or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  select * into fila from public.zelle_cursor where id;
  return jsonb_build_object(
    'uidvalidity', fila.uidvalidity,
    'ultimoUid', coalesce(fila.ultimo_uid, 0)
  );
end;
$func$;

create or replace function public.zelle_cursor_guardar(
  secreto text,
  p_uidvalidity bigint,
  p_ultimo_uid integer,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := current_setting('app.aviso_secreto', true);
begin
  if esperado is null or esperado = '' or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  update public.zelle_cursor
     set uidvalidity = p_uidvalidity,
         ultimo_uid = p_ultimo_uid,
         ultimo_exito_en = case when p_error is null then now() else ultimo_exito_en end,
         ultimo_error = p_error
   where id;
end;
$func$;

/*
 * La misma puerta, para Stripe.
 *
 * El webhook de Stripe también confirma pagos y también corre sin sesión,
 * así que necesita entrar por algún sitio. Podría haber reusado
 * `zelle_aplicar`, y sería mentir en el nombre: lo que llega de Stripe no es
 * un correo del banco y no se apunta en `zelle_correos`.
 *
 * Que la fuente venga por parámetro y no fija tiene una razón: el día que
 * Henry confirme un pago a mano desde el panel, esa fila tiene que poder
 * decir `manual` — y quien lea la tabla dentro de un año tiene que poder
 * distinguir las tres cosas sin adivinar.
 */
create or replace function public.confirmar_pago_con_secreto(
  secreto text,
  p_cita_id bigint,
  p_metodo text,
  p_fuente text,
  p_referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := current_setting('app.aviso_secreto', true);
begin
  if esperado is null or esperado = '' or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  return public.confirmar_pago(p_cita_id, p_metodo, p_fuente, p_referencia);
end;
$func$;

revoke execute on function public.confirmar_pago_con_secreto(text, bigint, text, text, text) from public;
grant execute on function public.confirmar_pago_con_secreto(text, bigint, text, text, text) to anon, authenticated;

-- ── Permisos: las cuatro se llaman sin sesión, con el secreto por delante ──
revoke execute on function public.zelle_apuntar_y_candidatas(text, text, text, integer, text, date, boolean, jsonb) from public;
revoke execute on function public.zelle_aplicar(text, text, text, bigint, text) from public;
revoke execute on function public.zelle_cursor_leer(text) from public;
revoke execute on function public.zelle_cursor_guardar(text, bigint, integer, text) from public;

grant execute on function public.zelle_apuntar_y_candidatas(text, text, text, integer, text, date, boolean, jsonb) to anon, authenticated;
grant execute on function public.zelle_aplicar(text, text, text, bigint, text) to anon, authenticated;
grant execute on function public.zelle_cursor_leer(text) to anon, authenticated;
grant execute on function public.zelle_cursor_guardar(text, bigint, integer, text) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════
-- EL SECRETO NO VIVE EN ESTE REPOSITORIO
--
-- Hay que ejecutar esto A MANO una vez, con una cadena larga inventada, y
-- poner ESE MISMO valor en la variable `AVISO_SECRETO` de Vercel:
--
--   alter database postgres set app.aviso_secreto = 'una-cadena-larga-inventada';
--
-- Mientras no se haga, las cuatro funciones de arriba rechazan todo. Ése es
-- el fallo correcto: sin secreto configurado, nadie concilia nada.
-- ═══════════════════════════════════════════════════════════════
