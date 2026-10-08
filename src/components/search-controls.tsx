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
  const { sp, update } = useUpdate();
  return (
    <select
      aria-label="Sortierung"
      className="select w-auto py-2 text-sm"
      value={sp.get("sort") ?? "neu"}
      onChange={(e) => update({ sort: e.target.value === "neu" ? null : e.target.value })}
    >
      <option value="neu">Neueste zuerst</option>
      <option value="preis_auf">Preis aufsteigend</option>
      <option value="preis_ab">Preis absteigend</option>
      {hasOrigin && <option value="entfernung">Entfernung</option>}
    </select>
  );
}

export function FitModeToggle() {
  const { sp, update, pending } = useUpdate();
  const loose = sp.get("modus") === "locker";
  return (
    <div className={clsx("inline-flex rounded-full border border-line p-1 text-sm", pending && "opacity-60")} role="radiogroup" aria-label="Passungsmodus">
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
          className={clsx("rounded-full px-3.5 py-1.5 font-semibold transition-all", loose === v ? "bg-gold text-on-gold" : "text-muted hover:text-fg")}
        >
          {l as string}
        </button>
      ))}
    </div>
  );
}

export function SaveSearchButton() {
  const sp = useSearchParams();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={clsx("btn btn-outline btn-sm", saved && "border-gold text-gold")}
      disabled={pending || saved}
      onClick={() =>
        start(async () => {
          const r = await saveSearch(sp.toString());
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
      {saved ? "Gespeichert" : "Suche speichern"}
    </button>
  );
}
