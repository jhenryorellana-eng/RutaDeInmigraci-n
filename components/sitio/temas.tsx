"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Flecha } from "./estructura";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useMovimiento } from "./experiencia";
import { useMobile } from "./use-mobile";

const TEMAS = [
  {
    titulo: "No sé por dónde empezar.",
    etiqueta: "PONER ORDEN",
    frase: "No hace falta tener todas las respuestas.",
    texto:
      "Podemos empezar por lo que hoy te preocupa. Un espacio para poner tus preguntas sobre la mesa y entender qué necesitas aclarar primero.",
    nota: "Tu punto de partida también merece tiempo.",
  },
  {
    titulo: "Quiero mirar mis opciones.",
    etiqueta: "GANAR PERSPECTIVA",
    frase: "Dale espacio a lo que viene.",
    texto:
      "Conversa sobre tu situación y tus prioridades. Ordena tus ideas con Henry y habla de los próximos pasos que quieres explorar.",
    nota: "Una conversación centrada en tu momento.",
  },
  {
    titulo: "Tengo preguntas concretas.",
    etiqueta: "CONVERSARLO CONTIGO",
    frase: "Trae eso que te da vueltas.",
    texto:
      "Anota tus dudas y dedica la sesión a lo que más te importa. Si tu situación necesita atención especializada, conversa sobre a quién acudir.",
    nota: "Tus preguntas marcan la conversación.",
  },
];
export function TemasAsesoria() {
  const movimiento = useMovimiento();
  const movil = useMobile();
  const arrastre = useDragControls();
  const [activo, setActivo] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);
  const tema = TEMAS[activo];
  function cambiar(indice: number) {
    const siguiente = Math.max(0, Math.min(TEMAS.length - 1, indice));
    setDireccion(siguiente > activo ? 1 : -1);
    setActivo(siguiente);
  }
  return (
    <div className="topics-explorer">
      <div
        className="topic-tabs"
        role="tablist"
        aria-label="¿Qué te trae por aquí?"
        aria-orientation={movil ? "horizontal" : "vertical"}
      >
        {TEMAS.map((t, i) => (
          <button
            ref={(el) => {
              botones.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tema-${i}`}
            aria-controls="tema-contenido"
            aria-selected={activo === i}
            aria-label={`0${i + 1} ${t.titulo}`}
            tabIndex={activo === i ? 0 : -1}
            key={t.titulo}
            onClick={() => cambiar(i)}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              let next = i;
              if (e.key === (movil ? "ArrowRight" : "ArrowDown"))
                next = (i + 1) % TEMAS.length;
              else if (e.key === (movil ? "ArrowLeft" : "ArrowUp"))
                next = (i + TEMAS.length - 1) % TEMAS.length;
              else if (e.key === "Home") next = 0;
              else if (e.key === "End") next = TEMAS.length - 1;
              else return;
              e.preventDefault();
              cambiar(next);
              botones.current[next]?.focus();
            }}
          >
            <span>0{i + 1}</span>
            <strong>{t.titulo}</strong>
            <strong className="topic-short-label">
              {["Empezar", "Mis opciones", "Mis dudas"][i]}
            </strong>
            <Flecha diagonal />
          </button>
        ))}
      </div>
      <motion.div
        id="tema-contenido"
        className="topic-detail"
        role="tabpanel"
        aria-labelledby={`tema-${activo}`}
        tabIndex={0}
        drag={movil ? "x" : false}
        dragControls={arrastre}
        dragListener={false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        onPointerDown={(event) => {
          if (movil && !(event.target as HTMLElement).closest("a, button"))
            arrastre.start(event);
        }}
        onDragEnd={(_, info) => {
          if (
            Math.abs(info.offset.x) > 50 &&
            Math.abs(info.offset.x) > Math.abs(info.offset.y) * 1.3
          )
            cambiar(activo + (info.offset.x < 0 ? 1 : -1));
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            className="topic-detail-inner"
            key={activo}
            initial={
              movimiento
                ? {
                    opacity: 0,
                    x: movil ? 24 * direccion : 0,
                    y: movil ? 0 : 22,
                  }
                : false
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: movimiento && !movil ? -12 : 0 }}
            transition={{
              duration: movimiento ? (movil ? 0.18 : 0.26) : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span className="eyebrow">{tema.etiqueta}</span>
            <h3>{tema.frase}</h3>
            <p>{tema.texto}</p>
            <span className="topic-note">{tema.nota}</span>
            <Link href="/reservar" className="text-link">
              Hablemos de esto <Flecha />
            </Link>
          </motion.div>
        </AnimatePresence>
        <motion.span
          className="topic-watermark"
          aria-hidden="true"
          key={`numero-${activo}`}
          initial={movimiento ? { opacity: 0, y: 30, rotate: -8 } : false}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: movimiento ? 0.65 : 0 }}
        >
          0{activo + 1}
        </motion.span>
      </motion.div>
      <div className="topic-mobile-controls">
        <span>
          <strong>0{activo + 1}</strong> / 03{" "}
          <small>Desliza para explorar</small>
        </span>
        <div>
          <button
            type="button"
            aria-label="Tema anterior"
            disabled={activo === 0}
            onClick={() => cambiar(activo - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label="Tema siguiente"
            disabled={activo === TEMAS.length - 1}
            onClick={() => cambiar(activo + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <span className="sr-only" role="status">
        {tema.titulo}
      </span>
    </div>
  );
}
