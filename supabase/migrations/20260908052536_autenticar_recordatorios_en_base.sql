-- El cron y el worker validan contra la misma fuente. No se rota el secreto
-- compartido con los pagos ni se devuelve su valor a quien llama.
create function public.autorizar_recordatorios(p_secreto text)
returns boolean language sql stable security invoker set search_path='' as $$
  select coalesce(p_secreto <> '' and p_secreto = privado.secreto_aviso(), false);
$$;
revoke all on function public.autorizar_recordatorios(text) from public,anon,authenticated;
grant execute on function public.autorizar_recordatorios(text) to service_role;
