import { clsx } from "clsx";
import { LOGO_COMPACT, LOGO_STACKED, RIM } from "./brand/logo-data";

type LogoProps = {
  /** „stacked“ = Original-Aufbau (Gebraucht/Felgen + große 24), „compact“ = einzeilig */
  variant?: "stacked" | "compact";
  className?: string;
  /** Eindeutiges Präfix für die Verlaufs-IDs, wenn das Logo mehrfach auf einer Seite steht */
  id?: string;
};

/**
 * GebrauchtFelgen24-Logo als Inline-SVG.
 * Farben kommen aus CSS-Variablen (--logo-*), dadurch wechselt es automatisch zwischen
 * Chrom/Hellblau (dunkles Design) und Schwarz/Königsblau (helles Design).
 */
export function Logo({ variant = "stacked", className, id = "gf24" }: LogoProps) {
  const d = variant === "stacked" ? LOGO_STACKED : LOGO_COMPACT;
  return (
    <svg
      viewBox={d.viewBox}
      width={d.width}
      height={d.height}
      overflow="visible"
      role="img"
      aria-label="GebrauchtFelgen24"
      className={clsx("block h-10 w-auto", className)}
    >
      <defs>
        {d.wordGradients.map((g, i) => (
          <linearGradient key={i} id={`${id}-w${i}`} gradientUnits="userSpaceOnUse" x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}>
            <stop offset="0" style={{ stopColor: "var(--logo-word-0)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--logo-word-1)" }} />
            <stop offset="1" style={{ stopColor: "var(--logo-word-2)" }} />
          </linearGradient>
        ))}
        <linearGradient
          id={`${id}-a`}
          gradientUnits="userSpaceOnUse"
          x1={d.accentGradient.x1}
          y1={d.accentGradient.y1}
          x2={d.accentGradient.x2}
          y2={d.accentGradient.y2}
        >
          <stop offset="0" style={{ stopColor: "var(--logo-acc-0)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-acc-1)" }} />
        </linearGradient>
      </defs>
      {d.word.map((p, i) => (
        <path key={i} d={p} fill={`url(#${id}-w${i})`} />
      ))}
      {d.accent.map((p, i) => (
        <path key={i} d={p} fill={`url(#${id}-a)`} />
      ))}
    </svg>
  );
}

/** 5-Speichen-Felge – zweites Markenmotiv (Platzhalter, Leerzustände, Ladeanimation). */
export function RimMark({ className, spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox={RIM.viewBox} className={clsx(className, spinning && "animate-spin-loader")} aria-hidden="true" fill="currentColor">
      <path fillRule="evenodd" d={RIM.d} />
    </svg>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <RimMark spinning className={clsx("h-6 w-6 text-brand", className)} />;
}
