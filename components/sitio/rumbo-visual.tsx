import { ControlMovimiento } from "./experiencia";

export function RumboVisual() {
  return (
    <div className="route-art" aria-hidden="true">
      <svg viewBox="0 0 1000 850" fill="none">
        <circle cx="640" cy="370" r="310" className="route-orbit" />
        <circle cx="640" cy="370" r="235" className="route-orbit" />
        <circle cx="640" cy="370" r="160" className="route-orbit" />
        <path
          d="M60 760C120 700 165 740 245 650S270 470 350 405 495 490 555 390 490 170 620 130 800 220 930 60"
          className="route-art-path"
        />
        <path d="m895 67 35-7-5 36" className="route-art-path" />
        <circle cx="350" cy="405" r="8" className="route-point" />
        <circle cx="620" cy="130" r="8" className="route-point" />
        <path
          d="M330 405h40m-20-20v40M600 130h40m-20-20v40"
          className="route-cross"
        />
      </svg>
    </div>
  );
}

export function BandaTipografica() {
  return (
    <div className="kinetic-band">
      <div className="site-container kinetic-caption">
        <span>DE PERSONA A PERSONA.</span>
        <ControlMovimiento />
      </div>
      <div className="kinetic-track" aria-hidden="true">
        {[0, 1].map((n) => (
          <div className="kinetic-copy" key={n}>
            <span>Tu historia.</span>
            <i>✳</i>
            <span className="outline-type">Tu momento.</span>
            <i>✳</i>
            <span>Tu próximo paso.</span>
            <i>↗</i>
          </div>
        ))}
      </div>
    </div>
  );
}
