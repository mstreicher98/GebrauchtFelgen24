/* ------------------------------------------------------------------ */
/* Fach-Icons für die Inserat-Detailseite (Linienstil wie lucide)      */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Durchmesser (Zoll) */
export function DetailIconDiameter({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10M9.5 9.5 7 12l2.5 2.5M14.5 9.5 17 12l-2.5 2.5" />
    </svg>
  );
}

/** Maulweite (J) */
export function DetailIconWidth({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5v14M20 5v14M7.5 12h9M10 9.5 7.5 12l2.5 2.5M14 9.5l2.5 2.5-2.5 2.5" />
    </svg>
  );
}

/** Einpresstiefe (ET) */
export function DetailIconOffset({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 3v18" strokeDasharray="2 2.5" />
      <path d="M16 5v14M8 12h8M13.5 9.5 16 12l-2.5 2.5" />
    </svg>
  );
}

/** Lochkreis */
export function DetailIconPcd({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="7" r="1.4" />
        <circle cx="16.76" cy="10.45" r="1.4" />
        <circle cx="14.94" cy="16.05" r="1.4" />
        <circle cx="9.06" cy="16.05" r="1.4" />
        <circle cx="7.24" cy="10.45" r="1.4" />
      </g>
    </svg>
  );
}

/** Mittenloch (Nabenbohrung) */
export function DetailIconBore({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M8.5 12h7" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

/** Reifen */
export function DetailIconTire({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
    </svg>
  );
}

/** Profiltiefe */
export function DetailIconTread({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7h18M3 17h18" />
      <path d="M6 7v4M10 7v6M14 7v4M18 7v6" />
    </svg>
  );
}
