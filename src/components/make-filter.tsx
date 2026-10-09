"use client";
import { Search } from "lucide-react";
import { useRef, useState } from "react";

/** Filtert die Markenkacheln clientseitig (ohne Neuladen); leere Abschnitte werden mit ausgeblendet. */
export function MakeFilter({ children }: { children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [empty, setEmpty] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filter = (value: string) => {
    setQ(value);
    const term = value.trim().toLowerCase();
    let any = false;
    ref.current?.querySelectorAll<HTMLElement>("section").forEach((section) => {
      let visible = 0;
      section.querySelectorAll<HTMLElement>("[data-make]").forEach((el) => {
        const show = !term || el.dataset.make!.includes(term);
        el.style.display = show ? "" : "none";
        if (show) visible++;
      });
      section.style.display = visible ? "" : "none";
      if (visible) any = true;
    });
    setEmpty(!any);
  };

  return (
    <div ref={ref}>
      <div className="relative mt-8 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input className="input pl-10" placeholder="Marke suchen …" value={q} onChange={(e) => filter(e.target.value)} aria-label="Marke suchen" />
      </div>
      {children}
      {empty && (
        <p className="mt-10 text-sm text-muted" role="status">
          Keine Marke gefunden.
        </p>
      )}
    </div>
  );
}
