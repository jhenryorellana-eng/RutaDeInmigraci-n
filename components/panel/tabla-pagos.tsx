"use client";

import { useState, useTransition } from "react";

import { asignarPago, descartarPago } from "@/app/panel/pagos-acciones";
import { codigoParaMostrar } from "@/lib/zelle/dominio";

/**
 * LOS PAGOS QUE EL SISTEMA NO SUPO COLOCAR.
 *
 * Casi todos los que aparezcan aquí NO son problema de nadie: el buzón lo
 * comparte x-legal, así que sus pagos también se leen y quedan sin
 * identificar. Eso está dicho en la pantalla, en vez de dejar a Henry
 * preguntándose por qué le llegan cobros de $500 que no reconoce.
 *
 * ── Por qué asignar pide confirmación y descartar no ──
 *
 * Porque asignar CREA una cita: compromete una hora de la agenda y le dice a
 * una persona que su sesión está confirmada. Descartar sólo quita algo de
 * esta lista, y si fue un error el correo sigue en la base con su motivo.
 * La fricción va donde están las consecuencias.
 */

export type CorreoPago = {
  id: number;
  remitente: string;
  montoUsd: number;
  memo: string | null;
  ambiguo: boolean;
  motivo: string | null;
  selloOk: boolean;
  transaccion: string;
  leidoEl: string;
};

export type SolicitudEsperando = {
  id: number;
  nombre: string;
  correo: string;
  whatsapp: string;
  cuando: string;
  servicio: string;
  precioUsd: number;
  codigoPago: string;
  pedidaEl: string;
};

export type Devolucion = SolicitudEsperando & {
  motivo: string | null;
  referenciaPago: string | null;
};

export function TablaPagos({
  pagos,
  esperando,
  devoluciones,
}: {
  pagos: CorreoPago[];
  esperando: SolicitudEsperando[];
  devoluciones: Devolucion[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [enCurso, empezar] = useTransition();
  /* Qué pago se está colocando. `null` = ninguno abierto. */
  const [colocando, setColocando] = useState<number | null>(null);

  function asignar(correoId: number, solicitudId: number) {
    setError(null);
    empezar(async () => {
      const r = await asignarPago(correoId, solicitudId);
      if (r.ok) setColocando(null);
      else setError(r.motivo);
    });
  }

  function descartar(correoId: number) {
    setError(null);
    empezar(async () => {
      const r = await descartarPago(correoId, "no es de este negocio");
      if (!r.ok) setError(r.motivo);
    });
  }

  return (
    <main className="pt-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-titulo text-[28px] font-semibold leading-[1.1] tracking-tight sm:text-[34px]">
          Pagos
        </h1>
        <p className="text-[16px] text-tinta-tenue">
          Lo que el sistema no pudo colocar solo
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-2xl border border-aviso/40 bg-aviso/10 px-5 py-3.5 text-[16px] text-aviso">
          {error}
        </p>
      ) : null}

      {/* ── 1 · Devoluciones. Lo único urgente de esta pantalla ── */}
      {devoluciones.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-aviso">
            Hay que devolver dinero · {devoluciones.length}
          </h2>
          <p className="mt-2 max-w-[62ch] text-[16px] leading-[1.5] text-tinta-suave">
            Pagaron y su hora ya la tenía otra persona. Ese dinero está en tu
            cuenta y no es tuyo.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {devoluciones.map((d) => (
              <div
                key={d.id}
                className="rounded-[20px] border border-aviso/40 bg-aviso/[0.08] px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                  <span className="text-[18px] font-bold">{d.nombre}</span>
                  <span className="text-[20px] font-extrabold tabular-nums text-aviso">
                    ${d.precioUsd}
                  </span>
                </div>
                <p className="mt-1.5 text-[15px] text-tinta-suave">
                  Quería {d.cuando} · {d.servicio}
                </p>
                <p className="mt-2.5 text-[15px] leading-[1.45] text-tinta-suave">
                  {d.motivo ?? "Su hora la tomó otra persona."}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px] text-tinta-tenue">
                  <span>{d.correo}</span>
                  <a
                    href={`https://wa.me/${d.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-acento underline underline-offset-4"
                  >
                    Escribirle
                  </a>
                  {d.referenciaPago ? (
                    <span className="tabular-nums">ref {d.referenciaPago}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 2 · Pagos sin colocar ── */}
      <section className="mt-9">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
          Pagos sin colocar · {pagos.length}
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-[1.5] text-tinta-suave">
          Llegó dinero y no se supo de quién.{" "}
          <strong className="font-bold text-tinta">
            La mayoría son de USALatino Prime
          </strong>{" "}
          — el buzón del banco es el mismo para los dos negocios, así que aquí
          se ven también sus pagos. Ésos se descartan sin miedo.
        </p>

        {pagos.length === 0 ? (
          <p className="mt-4 text-[16px] text-tinta-suave">
            Nada pendiente. Todo lo que llegó encontró su sitio.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {pagos.map((p) => (
              <div key={p.id} className="rounded-[20px] border border-white/12 px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
                  <span className="text-[18px] font-bold">{p.remitente}</span>
                  <span className="text-[20px] font-extrabold tabular-nums">
                    ${p.montoUsd.toFixed(2)}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-tinta-tenue">
                  <span>{p.leidoEl}</span>
                  {p.memo ? <span>memo: «{p.memo}»</span> : <span>sin memo</span>}
                  {p.ambiguo ? (
                    <span className="font-bold text-aviso">varias candidatas</span>
                  ) : null}
                  {/* Si el sello falla, el correo NO es de fiar y no debería
                      asignarse a nadie. Se dice en rojo, no en gris. */}
                  {!p.selloOk ? (
                    <span className="font-bold text-aviso">
                      el correo no se pudo verificar
                    </span>
                  ) : null}
                </div>

                {p.motivo ? (
                  <p className="mt-2.5 text-[15px] leading-[1.45] text-tinta-suave">{p.motivo}</p>
                ) : null}

                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    disabled={enCurso || esperando.length === 0}
                    onClick={() => setColocando(colocando === p.id ? null : p.id)}
                    className="min-h-11 rounded-full border border-acento/50 px-5 text-[15px] font-bold text-acento disabled:opacity-40"
                  >
                    {esperando.length === 0
                      ? "Nadie esperando"
                      : colocando === p.id
                        ? "Cancelar"
                        : "Es de alguien de aquí"}
                  </button>
                  <button
                    type="button"
                    disabled={enCurso}
                    onClick={() => descartar(p.id)}
                    className="min-h-11 rounded-full border border-white/25 px-5 text-[15px] disabled:opacity-40"
                  >
                    No es de este negocio
                  </button>
                </div>

                {/* Elegir a quién. Se enseñan sólo las que ESPERAN pago, y con
                    su importe delante: si no coincide, algo va mal y hay que
                    mirarlo dos veces antes de crear la cita. */}
                {colocando === p.id ? (
                  <div className="mt-3.5 rounded-2xl bg-fondo/60 p-4">
                    <p className="text-[15px] text-tinta-suave">
                      ¿De quién es este pago de ${p.montoUsd.toFixed(2)}?
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {esperando.map((s) => {
                        const cuadra = s.precioUsd === p.montoUsd;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={enCurso}
                            onClick={() => asignar(p.id, s.id)}
                            className={
                              cuadra
                                ? "flex min-h-[56px] items-center justify-between gap-4 rounded-2xl border border-acento/50 px-4 text-left disabled:opacity-40"
                                : "flex min-h-[56px] items-center justify-between gap-4 rounded-2xl border border-white/15 px-4 text-left disabled:opacity-40"
                            }
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[16px] font-bold">
                                {s.nombre}
                              </span>
                              <span className="block text-[14px] text-tinta-tenue">
                                {s.cuando} · {codigoParaMostrar(s.codigoPago)}
                              </span>
                            </span>
                            <span
                              className={
                                cuadra
                                  ? "shrink-0 text-[17px] font-extrabold tabular-nums text-acento"
                                  : "shrink-0 text-[17px] font-extrabold tabular-nums text-aviso"
                              }
                            >
                              ${s.precioUsd}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[14px] leading-[1.45] text-tinta-tenue">
                      Al elegir se crea su cita y esa hora queda ocupada. No se
                      puede deshacer desde aquí.
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 3 · Quién está pagando ahora mismo ── */}
      <section className="mt-9 pb-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.1em] text-tinta-tenue">
          Esperando su pago · {esperando.length}
        </h2>
        <p className="mt-2 max-w-[62ch] text-[16px] leading-[1.5] text-tinta-suave">
          Llenaron sus datos y todavía no han pagado.{" "}
          <strong className="font-bold text-tinta">Su hora sigue a la venta</strong>{" "}
          — no ocupan nada en tu agenda.
        </p>

        {esperando.length === 0 ? (
          <p className="mt-4 text-[16px] text-tinta-suave">Nadie a medias ahora mismo.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {esperando.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 rounded-2xl border border-white/12 px-5 py-3.5"
              >
                <span className="min-w-0">
                  <span className="block text-[17px] font-bold">{s.nombre}</span>
                  <span className="block text-[14px] text-tinta-tenue">
                    {s.cuando} · {s.servicio} · pidió {s.pedidaEl}
                  </span>
                </span>
                <span className="flex items-baseline gap-4">
                  <span className="text-[15px] font-bold tabular-nums text-acento">
                    {codigoParaMostrar(s.codigoPago)}
                  </span>
                  <span className="text-[18px] font-extrabold tabular-nums">
                    ${s.precioUsd}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
