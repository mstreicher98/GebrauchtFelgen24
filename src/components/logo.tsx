import { clsx } from "clsx";

export function RimMark({ className, spinning = false }: { className?: string; spinning?: boolean }) {
  const spokes = Array.from({ length: 5 }, (_, i) => i * 72);
  return (
    <svg viewBox="0 0 48 48" className={clsx(className, spinning && "animate-spin-loader")} aria-hidden="true">
      <defs>
        <linearGradient id="rimGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold-strong)" />
          <stop offset="1" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="none" stroke="url(#rimGold)" strokeWidth="3.5" />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="1" />
      {spokes.map((a) => (
        <path
          key={a}
          d="M22.6 19.5 L21 6.5 Q24 5.4 27 6.5 L25.4 19.5 Z"
          fill="url(#rimGold)"
          transform={`rotate(${a} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="5" fill="none" stroke="url(#rimGold)" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <RimMark className="h-8 w-8 text-fg transition-transform duration-700 group-hover:rotate-[72deg]" />
      <span className="font-display text-[1.2rem] font-semibold uppercase leading-none tracking-wide">
        Gebraucht<span className="text-gold">Felgen</span>
        <span className="ml-0.5 rounded bg-red-solid px-1 py-0.5 align-[2px] text-[0.7rem] font-bold text-white">24</span>
      </span>
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <RimMark spinning className={clsx("h-6 w-6 text-fg", className)} />;
}
