-- ═══════════════════════════════════════════════════════════════
-- LA AGENDA PERSONAL DE HENRY, EN EL MISMO CALENDARIO
--
-- Quiere apuntar sus cosas —el dentista, un viaje, una comida— y verlas
-- junto a sus audiencias para poder organizarse. Lo que NO quiere es que se
-- mezclen con la lógica de las citas.
--
-- ── Por qué no es otro calendario ──
--
-- Porque acabaría mirando dos pantallas para responder una sola pregunta:
-- «¿qué tengo el jueves?». La respuesta estaría partida, que es justo lo que
-- se quería evitar. Es UN calendario con dos capas.
--
-- ── Qué se separa de verdad ──
--
-- Los datos. Una cita es dinero: se cobra, se concilia, sale en Personas,
-- cuenta como ingreso. Un «dentista a las 2» no es nada de eso, así que vive
-- en su propia tabla y NO aparece en Personas, ni en la conciliación de
-- Zelle, ni en Stripe, ni en el número de horas apartadas. No tiene precio,
-- ni pago, ni código.
--
-- ── Lo único que comparten, y tiene que ser así ──
--
-- La disponibilidad. Si Henry apunta el dentista a las dos y el sitio sigue
-- vendiendo las dos, alguien la compra y él tiene dos sitios donde estar.
-- Eso no es mezclar lógica: es que «¿esta hora se puede vender?» tiene que
-- tener UNA sola respuesta, y ya la da `horas_ocupadas()` mirando citas y
-- cierres. Ahora mira una fuente más.
--
-- `ocupa = false` es para lo que no le quita la hora: «llamar a Yenny»,
-- «preparar papeles». Se ve en su rejilla y el sitio la sigue ofreciendo.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  titulo text not null,
  inicia_en timestamptz not null,
  termina_en timestamptz not null,

  /* Si además le quita la hora al público. Por defecto sí, porque casi todo
     lo que uno apunta en un calendario es algo que va a estar haciendo. */
  ocupa boolean not null default true,

  nota text,
  creado_en timestamptz not null default now(),

  constraint eventos_orden check (termina_en > inicia_en),
  constraint eventos_titulo_con_forma check (length(btrim(titulo)) between 1 and 80),
  /* En punto, igual que todo lo demás de esta agenda: la rejilla del panel
     razona por horas, y media hora suelta no tendría dónde pintarse. */
  constraint eventos_empieza_en_punto check (date_trunc('hour', inicia_en) = inicia_en)
);

create index if not exists eventos_rango on public.eventos (inicia_en, termina_en);

alter table public.eventos enable row level security;
alter table public.eventos force row level security;

/* Esto es la agenda privada de una persona. El público no lee ni una fila:
   lo único que puede saber es que cierta hora no está libre, y eso ya se lo
   dice `horas_ocupadas()` sin decirle por qué. */
revoke all on public.eventos from anon, authenticated;
grant select, insert, update, delete on public.eventos to authenticated;

drop policy if exists eventos_admin_todo on public.eventos;
create policy eventos_admin_todo
  on public.eventos for all to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ═══════════════════════════════════════════════════════════════
-- LA DISPONIBILIDAD, CON UNA FUENTE MÁS
--
-- Lo mismo que hacía, más los eventos que ocupan. Sigue devolviendo
-- INSTANTES Y NADA MÁS: quien pregunta desde fuera no puede saber si esa
-- hora está tomada por una cita, por un cierre o porque Henry va al
-- dentista. Eso importa — el título de un evento es asunto suyo.
-- ═══════════════════════════════════════════════════════════════

create or replace function public.horas_ocupadas(desde timestamptz, hasta timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $func$
  with rango as (
    select
      greatest(desde, now() - interval '1 day') as d,
      least(hasta, desde + interval '60 days')  as h
  )
  select c.inicia_en
  from public.citas c, rango r
  where c.estado <> 'cancelada'
    and c.inicia_en >= r.d
    and c.inicia_en <  r.h

  union

  select generate_series(
           date_trunc('hour', greatest(x.inicia_en, r.d)),
           x.termina_en - interval '1 second',
           interval '1 hour'
         )
  from public.cierres x, rango r
  where x.inicia_en < r.h
    and x.termina_en > r.d

  union

  select generate_series(
           date_trunc('hour', greatest(e.inicia_en, r.d)),
           e.termina_en - interval '1 second',
           interval '1 hour'
         )
  from public.eventos e, rango r
  where e.ocupa
    and e.inicia_en < r.h
    and e.termina_en > r.d;
$func$;

revoke execute on function public.horas_ocupadas(timestamptz, timestamptz) from public;
grant execute on function public.horas_ocupadas(timestamptz, timestamptz) to anon, authenticated;
