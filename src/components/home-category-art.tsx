import { clsx } from "clsx";

export type CategoryArtKind = "felge" | "komplettrad" | "winter" | "sommer" | "motorrad" | "stahl";

/**
 * Kleine Felgen-Illustrationen für die Kategorie-Kacheln der Startseite.
 * Reines SVG, Farben ausschließlich über Design-Tokens (funktioniert hell und dunkel).
 */
export function CategoryArt({ kind, className }: { kind: CategoryArtKind; className?: string }) {
  const tire = kind === "komplettrad" || kind === "winter" || kind === "sommer";
  return (
    <svg viewBox="0 0 120 120" className={clsx("overflow-visible", className)} aria-hidden="true">
      {tire && <Tire />}
      {kind === "stahl" ? (
        <SteelRim r={tire ? 34 : 50} />
      ) : kind === "motorrad" ? (
        <MotoWheel />
      ) : (
        <AlloyRim r={tire ? 34 : 50} />
      )}
      {kind === "winter" && <Badge icon="snow" />}
      {kind === "sommer" && <Badge icon="sun" />}
    </svg>
  );
}

/*
 * Gummi ist schwarz wie auf einem Produktfoto. Im dunklen Design wird er etwas aufgehellt,
 * sonst verschwindet der Reifen auf der dunklen Bühne (surface-2); die Kontur kommt aus den Tokens.
 */
const RUBBER = "fill-[#16191f] dark:fill-[#2c323e]";
const TREAD = "stroke-[#2a2f38] dark:stroke-[#4a5363]";
/** Außenkontur: hell nur fein, dunkel als Lichtkante, damit sich der Reifen von der Bühne löst */
const SIDEWALL = "stroke-line-strong dark:stroke-[#596276]";

/** Reifen mit Profilrillen */
function Tire() {
  return (
    <g>
      <circle cx="60" cy="60" r="54" className={clsx(RUBBER, SIDEWALL)} strokeWidth="1" />
      <circle cx="60" cy="60" r="50" fill="none" className={TREAD} strokeWidth="5" strokeDasharray="3 5" />
      <circle cx="60" cy="60" r="40" fill="none" className={TREAD} strokeWidth="1" />
    </g>
  );
}

/** 5-Doppelspeichen-Alufelge */
function AlloyRim({ r }: { r: number }) {
  const s = r / 50;
  const spokes = Array.from({ length: 5 }, (_, i) => i * 72);
  return (
    <g transform={`translate(60 60) scale(${s})`}>
      {/* Felgenhorn + Bett */}
      <circle r="50" className="fill-muted" />
      <circle r="46" className="fill-surface-3" />
      <circle r="44" className="fill-surface" />
      {/* Speichen */}
      {spokes.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M-5.5 -12 L-11 -43 Q0 -46 11 -43 L5.5 -12 Z" className="fill-brand" />
          <path d="M-0.8 -13 L-1.2 -43 L1.2 -43 L0.8 -13 Z" className="fill-surface" opacity="0.55" />
        </g>
      ))}
      {/* Nabe */}
      <circle r="14" className="fill-brand" />
      <circle r="9.5" className="fill-surface" />
      {Array.from({ length: 5 }, (_, i) => i * 72 + 36).map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6.2} cy={Math.sin((a * Math.PI) / 180) * 6.2} r="1.5" className="fill-muted" />
      ))}
      <circle r="2.6" className="fill-brand" />
    </g>
  );
}

/** Stahlfelge mit Lüftungslöchern */
function SteelRim({ r }: { r: number }) {
  const s = r / 50;
  return (
    <g transform={`translate(60 60) scale(${s})`}>
      <circle r="50" className="fill-muted" />
      <circle r="46" className="fill-surface-3" />
      <circle r="40" className="fill-faint" />
      <circle r="40" fill="none" className="stroke-surface" strokeOpacity="0.35" strokeWidth="1.5" />
      {Array.from({ length: 8 }, (_, i) => i * 45 + 22.5).map((a) => (
        <ellipse
          key={a}
          cx={Math.cos((a * Math.PI) / 180) * 29}
          cy={Math.sin((a * Math.PI) / 180) * 29}
          rx="6.5"
          ry="4.6"
          transform={`rotate(${a + 90} ${Math.cos((a * Math.PI) / 180) * 29} ${Math.sin((a * Math.PI) / 180) * 29})`}
          className="fill-surface"
        />
      ))}
      <circle r="18" className="fill-muted" />
      <circle r="18" fill="none" className="stroke-surface" strokeOpacity="0.4" strokeWidth="1.2" />
      {Array.from({ length: 5 }, (_, i) => i * 72).map((a) => (
        <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 11} cy={Math.sin((a * Math.PI) / 180) * 11} r="2.4" className="fill-surface" />
      ))}
      <circle r="5" className="fill-brand" />
    </g>
  );
}

/** Motorradrad: schmaler Reifen, Bremsscheibe, Y-Speichen */
function MotoWheel() {
  const spokes = Array.from({ length: 3 }, (_, i) => i * 120);
  return (
    <g transform="translate(60 60)">
      <circle r="54" className={clsx(RUBBER, SIDEWALL)} strokeWidth="1" />
      <circle r="50" fill="none" className={TREAD} strokeWidth="4" strokeDasharray="3 5" />
      <circle r="45" className="fill-muted" />
      <circle r="42.5" className="fill-surface" />
      {/* Bremsscheibe */}
      <circle r="24" fill="none" className="stroke-faint" strokeWidth="7" strokeDasharray="1.6 2.6" opacity="0.7" />
      {spokes.map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M-3 -9 L-3.5 -24 L-13 -40 L-8.5 -42 L0 -28 L8.5 -42 L13 -40 L3.5 -24 L3 -9 Z" className="fill-brand" />
        </g>
      ))}
      <circle r="10" className="fill-brand" />
      <circle r="4" className="fill-surface" />
    </g>
  );
}

function Badge({ icon }: { icon: "snow" | "sun" }) {
  return (
    <g transform="translate(98 22)">
      <circle r="17" className="fill-brand-fill stroke-surface" strokeWidth="3.5" />
      <g className="stroke-on-brand" strokeWidth="2.2" strokeLinecap="round" fill="none">
        {icon === "snow" ? (
          <>
            {[0, 60, 120].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <path d="M0 -8.5V8.5M-3 -6.5 0 -3.5 3 -6.5M-3 6.5 0 3.5 3 6.5" />
              </g>
            ))}
          </>
        ) : (
          <>
            <circle r="4" />
            {Array.from({ length: 8 }, (_, i) => i * 45).map((a) => (
              <path key={a} d="M0 -7.2V-9.4" transform={`rotate(${a})`} />
            ))}
          </>
        )}
      </g>
    </g>
  );
}
