"use client";
import { clsx } from "clsx";
import { Bell, BellRing } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { saveSearch } from "@/app/actions/saved-searches";
import { toast } from "./toaster";

function useUpdate() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  return {
    sp,
    pending,
    update: (patch: Record<string, string | null>) => {
      const p = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) p.delete(k);
        else p.set(k, v);
      }
      p.delete("seite");
      start(() => router.push(`${pathname}?${p}`, { scroll: false }));
    },
  };
}

export function SortSelect({ hasOrigin }: { hasOrigin: boolean }) {
  const { sp, update, pending } = useUpdate();
  return (
    <label className={clsx("flex min-w-0 items-center gap-2 text-sm", pending && "opacity-60")}>
      <span className="hidden whitespace-nowrap text-muted md:inline">Sortieren:</span>
      {/* min-w-0: darf am Handy schmaler werden, damit Filter-Knopf und Ansicht-Umschalter Platz haben */}
      <select
        aria-label="Sortierung"
        className="select h-10 w-auto min-w-0 max-w-full truncate rounded-full py-0 pl-3 pr-8 text-sm font-semibold bg-[position:right_0.625rem_center] sm:pl-3.5 sm:pr-10 sm:bg-[position:right_0.85rem_center]"
        value={sp.get("sort") ?? "neu"}
        onChange={(e) => update({ sort: e.target.value === "neu" ? null : e.target.value })}
      >
        <option value="neu">Neueste zuerst</option>
        <option value="preis_auf">Preis aufsteigend</option>
        <option value="preis_ab">Preis absteigend</option>
        {hasOrigin && <option value="entfernung">Entfernung</option>}
      </select>
    </label>
  );
}

export function FitModeToggle() {
  const { sp, update, pending } = useUpdate();
  const loose = sp.get("modus") === "locker";
  return (
    <div
      className={clsx("inline-flex w-full rounded-full border border-line bg-surface-2 p-1 text-sm sm:w-auto", pending && "opacity-60")}
      role="radiogroup"
      aria-label="Passungsmodus"
    >
      {[
        [false, "Nur passende"],
        [true, "Auch eventuell passende"],
      ].map(([v, l]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={loose === v}
          onClick={() => update({ modus: v ? "locker" : null })}
          className={clsx(
            "min-h-9 flex-1 whitespace-nowrap rounded-full px-3.5 py-2 font-semibold transition-colors sm:flex-none",
            loose === v ? "bg-brand-fill text-on-brand shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {l as string}
        </button>
      ))}
    </div>
  );
}

/** `compact`: am Handy nur Glocken-Symbol (Text für Screenreader bleibt), ab sm mit Beschriftung. */
export function SaveSearchButton({ className, compact = false }: { className?: string; compact?: boolean }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={clsx("btn btn-outline btn-sm", compact && "max-sm:w-10 max-sm:px-0", saved && "border-brand text-brand", className)}
      title={compact ? "Suche speichern" : undefined}
      disabled={pending || saved}
      onClick={() =>
        start(async () => {
          // Nur die Suche speichern – Darstellung und Seite gehören nicht zum Suchauftrag
          const q = new URLSearchParams(sp.toString());
          q.delete("ansicht");
          q.delete("seite");
          const r = await saveSearch(q.toString());
          if (r.error === "login") router.push(`/anmelden?weiter=${encodeURIComponent(`/suche?${sp}`)}`);
          else if (r.error) toast(r.error, "error");
          else {
            setSaved(true);
            toast("Suchauftrag gespeichert – wir benachrichtigen dich bei neuen Treffern");
          }
        })
      }
    >
      {saved ? <BellRing className="h-4 w-4 animate-pop" /> : <Bell className="h-4 w-4" />}
      <span className={clsx(compact && "max-sm:sr-only")}>{saved ? "Gespeichert" : "Suche speichern"}</span>
    </button>
  );
}
