"use client";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Toast = { id: number; type: "success" | "error" | "info"; text: string };

export function toast(text: string, type: Toast["type"] = "success") {
  window.dispatchEvent(new CustomEvent("gf:toast", { detail: { text, type } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as Omit<Toast, "id">;
      const id = Date.now() + Math.random();
      setItems((s) => [...s, { ...d, id }]);
      setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200);
    };
    window.addEventListener("gf:toast", on);
    return () => window.removeEventListener("gf:toast", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-8" aria-live="polite">
      {items.map((t) => {
        const Icon = t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
        return (
          <div
            key={t.id}
            className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm shadow-[var(--shadow)]"
          >
            <Icon className={t.type === "error" ? "h-4 w-4 text-red" : "h-4 w-4 text-gold"} />
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
