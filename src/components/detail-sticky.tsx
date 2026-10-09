"use client";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";

/** Abstand unter der festen Kopfzeile (64 px + 16 px) bzw. zum unteren Fensterrand */
const TOP = 80;
const BOTTOM_GAP = 16;

/**
 * Seitenspalte, die ab lg beim Scrollen stehen bleibt (Kaufbox).
 * Passt sie ganz ins Fenster, bleibt sie unter der Kopfzeile stehen; ist sie höher als das Fenster
 * (niedrige Laptop-Fenster, Eigentümer-Ansicht), wird der Versatz negativ, sodass ihr unteres Ende
 * am Fensterrand stehen bleibt – nichts wird dauerhaft abgeschnitten.
 */
export function DetailSticky({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTop(Math.round(Math.min(TOP, window.innerHeight - el.offsetHeight - BOTTOM_GAP)));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    update();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={ref} className={clsx("lg:sticky lg:top-20", className)} style={top == null ? undefined : { top }}>
      {children}
    </div>
  );
}
