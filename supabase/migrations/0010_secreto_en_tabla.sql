-- ═══════════════════════════════════════════════════════════════
-- EL SECRETO COMPARTIDO SE MUDA A UNA TABLA
--
-- `0009` lo leía de `current_setting('app.aviso_secreto')`, que se pone con
-- `alter database … set`. En una base gestionada de Supabase eso NO se puede
-- hacer: la base la posee `supabase_admin` y ni el rol `postgres` del panel
-- tiene permiso para cambiar ese parámetro. Comprobado, no supuesto.
--
-- Así que el secreto pasa a una tabla del esquema privado. Es igual de
-- seguro y además tiene dos ventajas que no teníamos:
--
--   · se puede rotar con un `update`, sin reiniciar nada;
--   · el valor NO viaja en esta migración, así que no entra en el
--     repositorio. La tabla se crea vacía y el valor se pone aparte.
--
-- ── Por qué el esquema `privado` y no `public` ──
--
-- Porque `privado` está fuera de la API: `0001` le revoca todo a `public`,
-- `anon` y `authenticated`, así que nadie puede consultarlo con la clave
-- pública. Las funciones de abajo lo leen porque corren como su creador.
-- ═══════════════════════════════════════════════════════════════

create table if not exists privado.secretos (
  nombre text primary key,
  valor text not null,
  cambiado_en timestamptz not null default now()
);

revoke all on privado.secretos from public, anon, authenticated;

/*
 * El secreto, resuelto una vez por llamada.
 *
 * Devuelve `null` si no está puesto, y quien la use tiene que tratar ese
 * `null` como «rechaza todo». Que la falta de configuración FALLE CERRADO no
 * es un detalle: lo contrario sería que una base recién creada aceptara
 * confirmaciones de pago de cualquiera.
 */
create or replace function privado.secreto_aviso()
returns text
language sql
stable
security definer
set search_path = ''
as $func$
  select nullif(valor, '') from privado.secretos where nombre = 'aviso';
$func$;

-- ═══════════════════════════════════════════════════════════════
-- LAS CINCO PUERTAS, LEYENDO DE LA TABLA
--
-- Lo único que cambia en las cinco es de dónde sale `esperado`. La
-- comprobación es la misma y sigue siendo `is distinct from`, que trata el
-- nulo como lo que es: nada coincide con un secreto sin configurar.
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

  perform public.liberar_pendientes_vencidas();

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'nombre', c.nombre, 'codigoPago', c.codigo_pago,
           'precioUsd', c.precio_usd,
           'creadoEnMs', (extract(epoch from c.creado_en) * 1000)::bigint
         )), '[]'::jsonb)
    into candidatas
    from public.citas c
   where c.estado = 'pendiente' and c.precio_usd * 100 = p_monto_centavos;

  return jsonb_build_object('ya_visto', false, 'correo_id', nuevo_id, 'candidatas', candidatas);
end;
$func$;

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
    resultado := public.confirmar_pago(p_cita_id, 'zelle', 'banco_auto', p_transaccion);
    if not coalesce((resultado->>'ok')::boolean, false) then
      update public.zelle_correos
         set decision = 'sin_identificar', cita_id = p_cita_id,
             motivo = 'No se pudo aplicar: ' || coalesce(resultado->>'motivo', 'desconocido')
       where transaccion = p_transaccion;
      return resultado;
    end if;
  end if;

  update public.zelle_correos
     set decision = p_decision, cita_id = p_cita_id, motivo = p_motivo
   where transaccion = p_transaccion;

  return resultado;
end;
$func$;

create or replace function public.confirmar_pago_con_secreto(
  secreto text, p_cita_id bigint, p_metodo text, p_fuente text, p_referencia text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  return public.confirmar_pago(p_cita_id, p_metodo, p_fuente, p_referencia);
end;
$func$;

create or replace function public.zelle_cursor_leer(secreto text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
  fila public.zelle_cursor%rowtype;
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  select * into fila from public.zelle_cursor where id;
  return jsonb_build_object('uidvalidity', fila.uidvalidity, 'ultimoUid', coalesce(fila.ultimo_uid, 0));
end;
$func$;

create or replace function public.zelle_cursor_guardar(
  secreto text, p_uidvalidity bigint, p_ultimo_uid integer, p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;
  update public.zelle_cursor
     set uidvalidity = p_uidvalidity, ultimo_uid = p_ultimo_uid,
         ultimo_exito_en = case when p_error is null then now() else ultimo_exito_en end,
         ultimo_error = p_error
   where id;
end;
$func$;

-- ═══════════════════════════════════════════════════════════════
-- EL VALOR NO ESTÁ AQUÍ, Y NO DEBE ESTARLO
--
-- Se pone con una sentencia suelta que NO entra en el repositorio, y ese
-- mismo valor va a la variable `AVISO_SECRETO` de Vercel:
--
--   insert into privado.secretos (nombre, valor) values ('aviso', '…')
--   on conflict (nombre) do update set valor = excluded.valor, cambiado_en = now();
--
-- Rotarlo es volver a ejecutar eso con otro valor y cambiar la variable.
-- Mientras la tabla esté vacía, las cinco funciones rechazan todo.
-- ═══════════════════════════════════════════════════════════════
