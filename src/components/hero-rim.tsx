/** Große, langsam rotierende Felge für den Hero-Bereich (reines SVG + CSS – kein JS nötig). */
export function HeroRim({ className }: { className?: string }) {
  const spokes = Array.from({ length: 5 }, (_, i) => i * 72);
  const bolts = Array.from({ length: 5 }, (_, i) => i * 72 + 36);
  return (
    <div className={className} aria-hidden="true">
      <div className="relative aspect-square w-full">
        {/* Glow */}
        <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,var(--gold-soft)_0%,transparent_70%)] blur-2xl" />
        <svg viewBox="-200 -200 400 400" className="animate-spin-slow relative h-full w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]">
          <defs>
            <radialGradient id="hr-tire" r="1">
              <stop offset="0.82" stopColor="#0d0d10" />
              <stop offset="0.9" stopColor="#1c1c21" />
              <stop offset="1" stopColor="#09090b" />
            </radialGradient>
            <linearGradient id="hr-lip" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f7f3e8" />
              <stop offset="0.35" stopColor="var(--gold-strong)" />
              <stop offset="0.6" stopColor="#6d5222" />
              <stop offset="1" stopColor="var(--gold)" />
            </linearGradient>
            <linearGradient id="hr-spoke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2c2c33" />
              <stop offset="0.45" stopColor="#5b5b66" />
              <stop offset="0.55" stopColor="#9a9aa6" />
              <stop offset="1" stopColor="#2a2a31" />
            </linearGradient>
            <radialGradient id="hr-barrel" r="1">
              <stop offset="0.3" stopColor="#050506" />
              <stop offset="1" stopColor="#1a1a1f" />
            </radialGradient>
            <linearGradient id="hr-shine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Reifen mit Profil */}
          <circle r="196" fill="url(#hr-tire)" />
          <circle r="186" fill="none" stroke="#24242a" strokeWidth="10" strokeDasharray="5 9" />
          {/* Felgenhorn */}
          <circle r="150" fill="url(#hr-lip)" />
          <circle r="141" fill="url(#hr-barrel)" />
          {/* Bremsscheibe */}
          <circle r="104" fill="none" stroke="#3a3a42" strokeWidth="26" strokeDasharray="2 6" opacity="0.7" />
          <path d="M -40 -118 A 124 124 0 0 1 60 -108 L 52 -88 A 100 100 0 0 0 -34 -96 Z" fill="var(--red-solid)" opacity="0.9" />
          {/* Speichen */}
          {spokes.map((a) => (
            <g key={a} transform={`rotate(${a})`}>
              <path d="M -13 -36 L -31 -134 Q 0 -146 31 -134 L 13 -36 Q 0 -40 -13 -36 Z" fill="url(#hr-spoke)" stroke="var(--gold)" strokeOpacity="0.45" strokeWidth="1.2" />
              <path d="M -1.5 -40 L -3 -138 L 3 -138 L 1.5 -40 Z" fill="#0b0b0e" opacity="0.65" />
            </g>
          ))}
          {/* Nabe */}
          <circle r="40" fill="#141418" stroke="url(#hr-lip)" strokeWidth="4" />
          {bolts.map((a) => (
            <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 24} cy={Math.sin((a * Math.PI) / 180) * 24} r="4.5" fill="#0a0a0c" stroke="#7a7a85" />
          ))}
          <circle r="11" fill="var(--gold)" />
          <circle r="5" fill="#0a0a0c" />
          {/* Glanz */}
          <circle r="150" fill="url(#hr-shine)" />
        </svg>
      </div>
    </div>
  );
}
