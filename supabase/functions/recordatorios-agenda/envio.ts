export type Entrega = {
  id: number;
  token: string;
  tipo: "cita" | "evento";
  registro_id: number;
  inicia_en: string;
  minutos: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function contenidoRecordatorio(e: Entrega, ahora = Date.now()) {
  const restante = Date.parse(e.inicia_en) - ahora;
  const minutos = Math.max(0, Math.ceil(restante / 60000));
  const hora = new Intl.DateTimeFormat("es", {
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(e.inicia_en));
  return {
    // No se muestran nombres, notas ni teléfonos en la pantalla bloqueada.
    titulo:
      minutos > 0 ? `Tu cita comienza en ${minutos} min` : "Es hora de tu cita",
    cuerpo: `${hora} · hora de Utah. Abre tu agenda para ver los detalles.`,
    etiqueta: `agenda-${e.tipo}-${e.registro_id}-${Date.parse(e.inicia_en)}`,
    url: "/panel",
  };
}

type Dependencias = {
  vigente: (e: Entrega) => Promise<boolean>;
  enviar: (
    e: Entrega,
    contenido: ReturnType<typeof contenidoRecordatorio>,
    ttl: number,
  ) => Promise<void>;
  finalizar: (
    e: Entrega,
    resultado: "enviado" | "expirado" | "reintentar" | "omitido",
  ) => Promise<void>;
  ahora?: () => number;
};

export async function entregarRecordatorio(e: Entrega, d: Dependencias) {
  const ahora = d.ahora?.() ?? Date.now();
  if (Date.parse(e.inicia_en) + 120000 <= ahora || !(await d.vigente(e))) {
    await d.finalizar(e, "omitido");
    return "omitido";
  }
  let resultado: "enviado" | "expirado" | "reintentar" = "enviado";
  try {
    await d.enviar(
      e,
      contenidoRecordatorio(e, ahora),
      Math.max(1, Math.ceil((Date.parse(e.inicia_en) + 120000 - ahora) / 1000)),
    );
  } catch (error) {
    const estado = (error as { statusCode?: number }).statusCode;
    resultado = estado === 404 || estado === 410 ? "expirado" : "reintentar";
  }
  // Un fallo del acuse queda visible y permite recuperar el arrendamiento.
  // La etiqueta estable agrupa una posible repetición tras un fallo de red.
  await d.finalizar(e, resultado);
  return resultado;
}
