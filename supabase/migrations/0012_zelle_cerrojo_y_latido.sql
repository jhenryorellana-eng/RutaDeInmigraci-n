-- ═══════════════════════════════════════════════════════════════
-- LAS TRAMPAS DE OPERACIÓN DEL BARRIDO
--
-- Dos de las que el documento de traspaso de x-legal marca como «pagadas con
-- bugs reales». No son hipótesis: allí pasaron.
--
--   §6.5 · dos barridos solapados no deben leer el buzón a la vez
--   §6.3 · sin latido, un buzón muerto se descubre semanas después
-- ═══════════════════════════════════════════════════════════════

alter table public.zelle_cursor
  add column if not exists lease_hasta timestamptz;

/*
 * Toma el cerrojo del barrido, o dice que no.
 *
 * Un barrido lento y el siguiente disparo del cron encima dan dos conexiones
 * IMAP compitiendo por el mismo buzón y un cursor que puede retroceder.
 *
 * ── Por qué va en una fila y no en un advisory lock ──
 *
 * Porque los advisory locks de Postgres viven en la SESIÓN, y aquí las
 * sesiones las recicla un pool: un cerrojo que se suelta solo cuando el pool
 * devuelve la conexión no protege nada. En una fila, el cerrojo es del
 * trabajo y no de quien lo pide.
 *
 * Caduca solo. Si una función se muere a medias, el siguiente barrido entra
 * pasados los segundos pedidos en vez de quedarse bloqueado para siempre.
 */
create or replace function public.zelle_tomar_cerrojo(secreto text, segundos integer default 90)
returns boolean
language plpgsql
security definer
set search_path = ''
as $func$
declare
  esperado text := privado.secreto_aviso();
  tomado boolean;
begin
  if esperado is null or secreto is distinct from esperado then
    raise exception 'no autorizado' using errcode = 'insufficient_privilege';
  end if;

  update public.zelle_cursor
     set lease_hasta = now() + make_interval(secs => segundos)
   where id and (lease_hasta is null or lease_hasta < now());

  get diagnostics tomado = row_count;
  return tomado;
end;
$func$;

create or replace function public.zelle_soltar_cerrojo(secreto text)
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
  update public.zelle_cursor set lease_hasta = null where id;
end;
$func$;

/*
 * ¿Sigue vivo el barrido?
 *
 * La trampa que cubre es la más silenciosa de todas: una contraseña IMAP
 * revocada, un buzón renombrado o la alerta de Chase apagada NO se notan.
 * El cron sigue en verde porque el barrido corre; lo que no hay es correos
 * que leer, y eso se ve igual que un día tranquilo. Se descubre semanas
 * después, por un cliente diciendo «yo pagué».
 *
 * `horasDesdeElUltimo` en `null` significa que no ha habido NUNCA un barrido
 * con éxito — normal al arrancar, alarmante a los tres días.
 */
create or replace function public.zelle_latido(secreto text)
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
  return jsonb_build_object(
    'ultimoExitoEn', fila.ultimo_exito_en,
    'horasDesdeElUltimo',
      case when fila.ultimo_exito_en is null then null
           else round(extract(epoch from (now() - fila.ultimo_exito_en)) / 3600.0, 1)
      end,
    'ultimoError', fila.ultimo_error,
    'ultimoUid', fila.ultimo_uid
  );
end;
$func$;

revoke execute on function public.zelle_tomar_cerrojo(text, integer) from public;
revoke execute on function public.zelle_soltar_cerrojo(text) from public;
revoke execute on function public.zelle_latido(text) from public;
grant execute on function public.zelle_tomar_cerrojo(text, integer) to anon, authenticated;
grant execute on function public.zelle_soltar_cerrojo(text) to anon, authenticated;
grant execute on function public.zelle_latido(text) to anon, authenticated;
