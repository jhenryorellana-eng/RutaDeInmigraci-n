#!/usr/bin/env node
/**
 * PRUEBA EL ACCESO AL BUZÓN, ANTES DE CONFIGURAR NADA.
 *
 * El documento de traspaso lo pide en ese orden y tiene razón: si la
 * contraseña está mal o la carpeta se llama de otra forma, más vale
 * descubrirlo aquí en diez segundos que dentro de un cron que falla en
 * silencio cada dos minutos.
 *
 *   node scripts/probar-imap.mjs
 *
 * Lee las mismas variables que usa el sitio. Se le puede pasar un `.env`
 * distinto con:  node --env-file=.env.local scripts/probar-imap.mjs
 *
 * ── Lo que hace, y lo que NO ──
 *
 * Se conecta, abre la carpeta, cuenta los mensajes y mira si hay alertas de
 * Chase. Y nada más: NO marca, NO borra, NO mueve y NO lee el contenido de
 * ningún correo. Este buzón lo comparte x-legal en producción, así que una
 * herramienta de diagnóstico que escriba es una herramienta peligrosa.
 */

import { ImapFlow } from "imapflow";

const cfg = {
  host: process.env.ZELLE_IMAP_HOST,
  port: Number(process.env.ZELLE_IMAP_PORT ?? 993),
  user: process.env.ZELLE_IMAP_USER,
  pass: process.env.ZELLE_IMAP_PASS,
  mailbox: process.env.ZELLE_IMAP_MAILBOX ?? "ZELLE",
};

const faltan = ["host", "user", "pass"].filter((k) => !cfg[k]);
if (faltan.length > 0) {
  console.error(`✗ Faltan variables: ${faltan.map((k) => `ZELLE_IMAP_${k.toUpperCase()}`).join(", ")}`);
  console.error("  Ponlas en .env.local y vuelve a ejecutar con:");
  console.error("  node --env-file=.env.local scripts/probar-imap.mjs");
  process.exit(1);
}

console.log(`Conectando a ${cfg.host}:${cfg.port} como ${cfg.user}…`);

const cliente = new ImapFlow({
  host: cfg.host,
  port: cfg.port,
  secure: true,
  auth: { user: cfg.user, pass: cfg.pass },
  logger: false,
  greetingTimeout: 15_000,
  connectionTimeout: 20_000,
});
cliente.on("error", () => {});

try {
  await cliente.connect();
  console.log("✓ Sesión iniciada.");

  const carpetas = await cliente.list();
  const nombres = carpetas.map((c) => c.path);
  console.log(`\nCarpetas visibles (${nombres.length}):`);
  for (const n of nombres) console.log(`  ${n === cfg.mailbox ? "→" : " "} ${n}`);

  if (!nombres.includes(cfg.mailbox)) {
    console.error(`\n✗ No existe la carpeta "${cfg.mailbox}".`);
    console.error("  Créala en el webmail, o corrige ZELLE_IMAP_MAILBOX.");
    process.exit(1);
  }

  const cerrojo = await cliente.getMailboxLock(cfg.mailbox);
  try {
    const buzon = cliente.mailbox;
    console.log(`\n✓ Carpeta "${cfg.mailbox}" abierta.`);
    console.log(`  Mensajes: ${buzon.exists}`);
    console.log(`  UIDVALIDITY: ${buzon.uidValidity}`);

    /* Que el servidor admita keywords personalizados es lo que hace posible
       convivir con x-legal: cada sistema lleva su marca. Si sólo aparecen
       las banderas del sistema, hay que revisarlo antes de encender nada. */
    const permanentes = buzon.permanentFlags ? [...buzon.permanentFlags] : [];
    const admiteKeywords = permanentes.includes("\\*");
    console.log(`  Admite marcas propias: ${admiteKeywords ? "sí" : "NO — revisar"}`);

    if (buzon.exists > 0) {
      let deChase = 0;
      let yaMarcados = 0;
      for await (const msg of cliente.fetch(
        { seen: undefined, all: true },
        { envelope: true, flags: true },
      )) {
        const de = msg.envelope?.from?.[0]?.address?.toLowerCase() ?? "";
        if (de.includes("chase.com")) deChase += 1;
        if (msg.flags?.has("$RutaProcesado")) yaMarcados += 1;
      }
      console.log(`\n  De Chase: ${deChase}`);
      console.log(`  Ya procesados por este sistema: ${yaMarcados}`);
      if (deChase === 0) {
        console.log("\n  ⚠ No hay ningún correo de Chase en esta carpeta.");
        console.log("    Revisa el filtro del servidor, o arrastra uno a mano para probar.");
      }
    } else {
      console.log("\n  ⚠ La carpeta está vacía. Arrastra un correo de Chase para probar.");
    }
  } finally {
    cerrojo.release();
  }

  console.log("\n✓ Todo correcto. Puedes poner estas variables en Vercel.");
} catch (e) {
  console.error(`\n✗ Falló: ${e.message}`);
  if (/auth/i.test(e.message)) {
    console.error("  Suele ser la contraseña. Usa la de la IDENTIDAD o una app password,");
    console.error("  nunca la contraseña principal del buzón.");
  }
  process.exit(1);
} finally {
  await cliente.logout().catch(() => {});
}
