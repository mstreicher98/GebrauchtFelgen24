"use client";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Filtert die Markenkacheln clientseitig (ohne Neuladen). */
export function MakeFilter({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const term = q.trim().toLowerCase();
    ref.current?.querySelectorAll<HTMLElement>("[data-make]").forEach((el) => {
      el.style.display = !term || el.dataset.make!.includes(term) ? "" : "none";
    });
  }, [q]);
  return (
    <div ref={ref}>
      <div className="relative mt-8 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input className="input pl-10" placeholder="Marke suchen …" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Marke suchen" />
      </div>
      {children}
    </div>
  );
}
