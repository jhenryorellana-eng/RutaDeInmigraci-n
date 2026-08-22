-- ═══════════════════════════════════════════════════════════════
-- QUE SUENE EL TELÉFONO CUANDO ALGUIEN APARTA UNA HORA
--
-- Un trigger que llama a la Edge Function `avisar-cita`, que es quien manda
-- la notificación. Aquí sólo se dispara.
--
-- ── ANTES DE APLICAR ESTO ──
--
-- Cambia SECRETO_DEL_AVISO por una cadena larga inventada, y pon ESA MISMA
-- cadena como secreto `AVISO_SECRETO` de la Edge Function, en el panel de
-- Supabase (Edge Functions → avisar-cita → Secrets).
--
-- Sin ese secreto compartido, cualquiera que descubra la dirección de la
-- función podría hacer sonar el teléfono de Henry a las tres de la mañana,
-- tantas veces como quisiera. Y el secreto NO se guarda en este repositorio:
-- vive en la base y en Supabase, que es donde hace falta.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pg_net;

create or replace function privado.avisar_cita_nueva()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  /*
   * Envuelto en su propio bloque a propósito.
   *
   * Esto corre DENTRO de la transacción que guarda la cita: si `http_post`
   * lanzara —la extensión caída, la cola llena, lo que sea— la inserción se
   * revertiría entera y esa persona se quedaría sin su hora por un fallo del
   * AVISO. Se traga el error: perder una notificación es molesto; perder una
   * reserva, no tiene arreglo.
   */
  begin
    perform net.http_post(
      url := 'https://TU-PROYECTO.supabase.co/functions/v1/avisar-cita',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-aviso-secreto', 'SECRETO_DEL_AVISO'
      ),
      /*
       * Sólo tres campos, y NO la fila entera.
       *
       * El aviso necesita saber quién y cuándo. El correo y el teléfono de
       * esa persona no pintan nada en una notificación que se lee en la
       * pantalla de bloqueo, así que ni siquiera salen de la base.
       */
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', new.id,
          'nombre', new.nombre,
          'inicia_en', new.inicia_en
        )
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    null;
  end;

  return new;
end;
$$;

drop trigger if exists citas_avisar on public.citas;
create trigger citas_avisar
  after insert on public.citas
  for each row execute function privado.avisar_cita_nueva();
