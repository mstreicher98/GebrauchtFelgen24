import { clsx } from "clsx";
import Link from "next/link";
import { formatCount } from "@/lib/format";

/** Seitenkopf innerhalb des Admin-Bereichs. */
export function AdminPageHeader({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Filter-Chips in einer Zeile (wischbar am Handy). */
export function FilterTabs({ items }: { items: { href: string; label: string; active: boolean; count?: number }[] }) {
  return (
    <nav aria-label="Filter" className="scrollbar-none -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="chip shrink-0" data-active={i.active} aria-current={i.active ? "page" : undefined}>
          {i.label}
          {i.count != null && <span className="ml-1 text-faint">{formatCount(i.count)}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** Suchfeld, das die übrigen Filter (als versteckte Felder) beibehält. */
export function AdminSearch({ q, placeholder, keep = {} }: { q?: string; placeholder: string; keep?: Record<string, string | undefined> }) {
  return (
    <form className="mb-4 flex max-w-lg gap-2" role="search">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <input name="q" defaultValue={q} className="input" placeholder={placeholder} aria-label={placeholder} />
      <button className="btn btn-outline shrink-0">Suchen</button>
    </form>
  );
}

export function StatTile({ label, value, href, alert, hint }: { label: string; value: number; href?: string; alert?: boolean; hint?: string }) {
  const inner = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className={clsx("font-display mt-1 text-3xl font-bold tabular-nums", alert && "text-red")}>{formatCount(value)}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card block p-4 transition-colors hover:border-brand sm:p-5">
      {inner}
    </Link>
  ) : (
    <div className="card p-4 sm:p-5">{inner}</div>
  );
}

const DAY = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit" });

/**
 * Tageswerte als schmale Balken (eine Reihe, Markenfarbe). Hover zeigt Datum und Wert,
 * für Screenreader gibt es dieselben Daten als Tabelle.
 */
export function DailyBars({ title, data }: { title: string; data: { day: Date; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const W = 300;
  const H = 72;
  const gap = 2;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <figure className="card p-4 sm:p-5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">{title}</span>
        <span className="font-display text-xl font-bold tabular-nums">{formatCount(total)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = d.value === 0 ? 0 : Math.max(2, (d.value / max) * (H - 4));
          const x = i * (bw + gap);
          return (
            <g key={i} className="group">
              <title>{`${DAY.format(d.day)}: ${formatCount(d.value)}`}</title>
              {/* Trefferfläche über die volle Höhe */}
              <rect x={x} y={0} width={bw} height={H} fill="transparent" />
              {h > 0 && <rect x={x} y={H - h} width={bw} height={h} rx={Math.min(2, bw / 2)} className="fill-[var(--brand)] opacity-80 group-hover:opacity-100" />}
            </g>
          );
        })}
      </svg>
      <div className="mt-1.5 flex justify-between text-[11px] text-faint">
        <span>{data.length ? DAY.format(data[0].day) : ""}</span>
        <span>heute</span>
      </div>
      <table className="sr-only">
        <caption>{title} pro Tag</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th scope="row">{DAY.format(d.day)}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Kleine Kennzeichnung für Ziel-Typen in Meldungen und Protokoll. */
export const TARGET_LABEL: Record<string, string> = {
  listing: "Inserat",
  user: "Nutzer",
  message: "Nachricht",
  conversation: "Unterhaltung",
  report: "Meldung",
  setting: "Einstellung",
  vehicle_make: "Marke",
  vehicle_model: "Modell",
  vehicle_generation: "Baureihe",
  hsn_tsn: "HSN/TSN",
  legal: "Rechtstext",
};
