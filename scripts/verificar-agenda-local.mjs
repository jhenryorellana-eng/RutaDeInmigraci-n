import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "../tmp/agenda-verificacion/node_modules/@electric-sql/pglite/dist/index.js";
import assert from "node:assert/strict";

// PostgreSQL WASM en memoria. Nunca abre una conexión al proyecto Supabase.
// Instalar el runtime: npm install --prefix tmp/agenda-verificacion --no-save
// --package-lock=false --ignore-scripts @electric-sql/pglite@0.5.8
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
  `);
  await db.exec(`
    create or replace function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;
    create schema net;
    create table net.pruebas_http(id bigint generated always as identity, cuerpo jsonb);
    create function net.http_post(url text, body jsonb default '{}', params jsonb default '{}', headers jsonb default '{}', timeout_milliseconds integer default 1000)
      returns bigint language plpgsql as $$declare n bigint; begin insert into net.pruebas_http(cuerpo) values(body) returning id into n; return n; end;$$;
    create schema cron;
    create table cron.job(jobname text primary key,schedule text,command text);
    create function cron.schedule(p_name text,p_schedule text,p_command text) returns bigint language plpgsql as $$begin insert into cron.job values(p_name,p_schedule,p_command); return 1; end;$$;
  `);
  const ruta = new URL("../supabase/migrations/", import.meta.url);
  const nombres = (await readdir(ruta))
    .filter((n) => n.endsWith(".sql"))
    .sort();
  for (const nombre of nombres) {
    let sql = await readFile(new URL(nombre, ruta), "utf8");
    // Sólo se sustituyen extensiones de transporte y scheduler por dobles
    // locales; tablas, políticas, transacciones, triggers y RPC son PostgreSQL.
    sql = sql.replace(/create extension if not exists (pg_net|pg_cron);/gi, "");
    await db.exec(sql);
    console.log(`Migración válida: ${nombre}`);
  }
  await db.exec(`
    insert into auth.users values('00000000-0000-0000-0000-000000000001');
    insert into public.administradores(user_id) values('00000000-0000-0000-0000-000000000001');
    insert into privado.secretos(nombre,valor) values('aviso','solo-local');
  `);
  const pruebas = await readFile(
    new URL("../supabase/tests/agenda_editor.sql", import.meta.url),
    "utf8",
  );
  assert.equal((await db.query("select public.autorizar_recordatorios('incorrecto') valido")).rows[0].valido, false);
  assert.equal((await db.query("select public.autorizar_recordatorios('solo-local') valido")).rows[0].valido, true);
  assert.equal((await db.query("select has_function_privilege('authenticated','public.autorizar_recordatorios(text)','execute') permitido")).rows[0].permitido, false);
  await db.exec(pruebas);
  const datos = await db.query(
    "select (select count(*) from public.citas) citas, (select count(*) from public.eventos) eventos, (select count(*) from net.pruebas_http) avisos",
  );
  assert.deepEqual(datos.rows[0], { citas: 0, eventos: 0, avisos: 0 });
  // Comprueba también los permisos de una llamada real con RLS (sin bypass).
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',false);`,
  );
  await db.query("select public.guardar_agenda($1::jsonb)", [
    JSON.stringify({
      tipo: "evento",
      titulo: "PRUEBA LOCAL RLS",
      inicio: "2088-07-14T16:00:00Z",
      fin: "2088-07-14T17:00:00Z",
      ocupa: true,
    }),
  ]);
  await db.exec("reset role");
  const resultado = await db.query("select count(*) total from public.eventos");
  assert.equal(resultado.rows[0].total, 1);
  // Reloj controlado sólo en esta base en memoria. No forma parte de la
  // migración: permite ejecutar las consultas reales en el minuto exacto.
  await db.exec(`
    create or replace function pg_catalog.now() returns timestamptz language sql stable as $$select current_setting('agenda.test_now')::timestamptz$$;
    select set_config('agenda.test_now','2088-07-14T15:54:00Z',false);
    insert into public.suscripciones_push(user_id,endpoint,p256dh,auth) values('00000000-0000-0000-0000-000000000001','https://push.example.invalid/test','clave-local','auth-local');
  `);
  const reclamar = async () =>
    (await db.query("select public.reclamar_recordatorios() entregas")).rows[0]
      .entregas;
  assert.equal(
    (await reclamar()).length,
    0,
    "No debe avisar seis minutos antes",
  );
  await db.exec(
    "select set_config('agenda.test_now','2088-07-14T15:55:00Z',false)",
  );
  const [primera] = await reclamar();
  assert.ok(primera, "Debe reclamar a cinco minutos");
  assert.equal(
    (await reclamar()).length,
    0,
    "Dos workers no deben reclamar la misma entrega",
  );
  await db.query("select public.finalizar_recordatorio($1,$2,'enviado')", [
    primera.id,
    primera.token,
  ]);
  assert.equal(
    (await reclamar()).length,
    0,
    "Una entrega confirmada no se repite",
  );
  await db.exec(
    "update public.eventos set inicia_en='2088-07-14T17:00:00Z',termina_en='2088-07-14T18:00:00Z'; select set_config('agenda.test_now','2088-07-14T16:55:00Z',false)",
  );
  const [reprogramada] = await reclamar();
  assert.ok(
    reprogramada && reprogramada.id !== primera.id,
    "Reprogramar produce una nueva entrega",
  );
  await db.exec(
    "update public.eventos set inicia_en='2088-07-14T18:00:00Z',termina_en='2088-07-14T19:00:00Z'",
  );
  const vigente = await db.query(
    "select public.recordatorio_vigente($1,$2) vigente",
    [reprogramada.id, reprogramada.token],
  );
  assert.equal(
    vigente.rows[0].vigente,
    false,
    "El aviso anterior se invalida antes de enviarlo",
  );
  await db.exec(
    "update public.suscripciones_push set recordatorio_minutos=0; select set_config('agenda.test_now','2088-07-14T17:55:00Z',false)",
  );
  assert.equal(
    (await reclamar()).length,
    0,
    "Con preferencia al empezar, no avisa antes",
  );
  await db.exec(
    "select set_config('agenda.test_now','2088-07-14T18:00:00Z',false)",
  );
  assert.equal((await reclamar()).length, 1, "Avisa al comenzar");
  await db.exec(
    "update public.suscripciones_push set recordatorio_minutos=null",
  );
  assert.equal(
    (await reclamar()).length,
    0,
    "Respeta la desactivación del dispositivo",
  );
  console.log(
    "OK: cola real SQL, ventana de cinco minutos, deduplicación, arrendamientos, reprogramación y preferencias por dispositivo.",
  );
  const solicitud = async (inicio, codigo) =>
    (
      await db.query(
        `insert into public.solicitudes_pago(inicia_en,nombre,correo,nacionalidad,en_eeuu,whatsapp,servicio,precio_usd,metodo_pago,codigo_pago) values($1,'Prueba local de pago','prueba@example.invalid','PE',false,'12025550100','asesoria',70,'zelle',$2) returning id`,
        [inicio, codigo],
      )
    ).rows[0].id;
  const ocupada = await solicitud("2088-07-14T18:00:00Z", "1101");
  const conflictoPago = await db.query(
    "select public.cita_desde_solicitud('solo-local',$1,'zelle','manual','referencia-local-1') resultado",
    [ocupada],
  );
  assert.equal(conflictoPago.rows[0].resultado.motivo, "HORA_TOMADA");
  const horaLibre = (
    await db.query(
      "select h from generate_series(now()+interval '1 day',now()+interval '14 days',interval '1 hour') h where public.dentro_del_horario(h) order by h limit 1",
    )
  ).rows[0].h;
  const libre = await solicitud(horaLibre, "1102");
  const pago = await db.query(
    "select public.cita_desde_solicitud('solo-local',$1,'zelle','manual','referencia-local-2') resultado",
    [libre],
  );
  assert.equal(pago.rows[0].resultado.ok, true);
  const repetido = await db.query(
    "select public.cita_desde_solicitud('solo-local',$1,'zelle','manual','referencia-local-2') resultado",
    [libre],
  );
  assert.equal(
    repetido.rows[0].resultado.cita_id,
    pago.rows[0].resultado.cita_id,
  );
  assert.equal(repetido.rows[0].resultado.ya_estaba, true);
  console.log(
    "OK: un evento que ocupa la hora mantiene HORA_TOMADA; una hora libre conserva la creación de cita pagada y su idempotencia.",
  );
  console.log(
    "OK: crear, editar, reprogramar, conflictos, versión obsoleta, permisos RLS y conservación del pago. Datos y avisos de la prueba transaccional revertidos.",
  );
} catch (error) {
  console.error({
    codigo: error.code,
    mensaje: error.message,
    detalle: error.detail,
    contexto: error.where,
  });
  process.exitCode = 1;
} finally {
  await db.close();
}
