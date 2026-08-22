-- ═══════════════════════════════════════════════════════════════
-- LOS AVISOS AL TELÉFONO
--
-- Una tabla con los teléfonos de Henry —el suyo, el de casa, el que use—
-- a los que mandar el aviso cuando alguien aparta una hora.
--
-- ── Qué es una «suscripción» ──
--
-- No es un número ni un dispositivo: es una dirección que da el navegador
-- (`endpoint`) más dos claves con las que se cifra el mensaje. Quien tenga
-- esa dirección puede hacer sonar ese teléfono, así que se guarda con el
-- mismo cuidado que un dato personal — de hecho, con más: el público no
-- puede leerla NI ESCRIBIRLA.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.suscripciones_push (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,

  /* La dirección que da el navegador. Única: si el mismo teléfono se vuelve
     a suscribir, se actualiza en vez de duplicarse, o cada aviso llegaría
     dos veces. */
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,

  /* Para saber cuál es cuál cuando haya varios y quiera quitar uno. */
  descripcion text,
  creado_en timestamptz not null default now(),

  constraint suscripciones_endpoint_con_forma
    check (endpoint like 'https://%' and length(endpoint) between 20 and 1000)
);

create index if not exists suscripciones_por_usuario
  on public.suscripciones_push (user_id);

alter table public.suscripciones_push enable row level security;
alter table public.suscripciones_push force row level security;

-- ═══════════════════════════════════════════════════════════════
-- PERMISOS
-- ═══════════════════════════════════════════════════════════════

-- El público no tiene nada que hacer aquí. Ni leer ni escribir.
revoke all on public.suscripciones_push from anon, authenticated;

grant select, insert, update, delete on public.suscripciones_push to authenticated;

/*
 * Cada quien sólo ve y toca LAS SUYAS.
 *
 * `user_id = auth.uid()` y no `es_admin()`: si mañana hay dos personas
 * administrando, que una pueda borrar los avisos de la otra —o peor, leer su
 * dirección y hacerle sonar el teléfono— no tiene ningún sentido.
 *
 * El `with check` del update es lo que impide reasignar una suscripción a
 * otra persona. Sin él, se podría cambiar el `user_id` y desviar los avisos.
 */
create policy suscripciones_propias_lee
  on public.suscripciones_push for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy suscripciones_propias_inserta
  on public.suscripciones_push for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy suscripciones_propias_actualiza
  on public.suscripciones_push for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy suscripciones_propias_borra
  on public.suscripciones_push for delete
  to authenticated
  using ((select auth.uid()) = user_id);

/*
 * ── Quién manda el aviso, y por qué no lo manda este sitio ──
 *
 * Para avisar hay que leer las suscripciones SIN sesión: la cita la aparta
 * alguien que no ha iniciado sesión, y en ese momento no hay ningún
 * `auth.uid()` con el que pasar las políticas de arriba.
 *
 * La salida fácil sería la `service_role`, y en este proyecto no se usa: se
 * salta el RLS entero y es lo único que impide leer los datos de todas las
 * personas que han apartado una cita.
 *
 * Así que el aviso lo manda una Edge Function de Supabase, disparada por un
 * webhook al insertar en `citas`. Esa función corre DENTRO de Supabase, con
 * su propia clave inyectada por el entorno: la llave no pasa por este repo,
 * ni por Vercel, ni por el navegador de nadie. Está explicado en el README.
 */
