"use client";
import { clsx } from "clsx";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "system" | "dark" | "light";

/** Wird im <head> ausgeführt, bevor die Seite gerendert wird – verhindert Flackern. */
export const themeScript = `(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme')||'system';var d=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;document.documentElement.dataset.theme=d;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

function apply(t: Theme) {
  const d = t === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.dataset.theme = d;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", d === "light" ? "#ffffff" : "#0f131a");
}

export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    let stored: Theme = "system";
    try {
      const v = localStorage.getItem("theme");
      if (v === "dark" || v === "light") stored = v;
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Wert existiert erst im Browser
    setTheme(stored);
    // Browser-Leiste (theme-color) gleich beim Laden an die Kopfzeile anpassen, nicht erst beim Umschalten
    apply(stored);
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      try {
        if ((localStorage.getItem("theme") || "system") !== "system") return;
      } catch {}
      apply("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Record<Theme, Theme> = { system: "dark", dark: "light", light: "system" };
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Dunkel" : theme === "light" ? "Hell" : "System";

  return (
    <button
      type="button"
      className={clsx(compact ? "btn btn-ghost btn-icon" : "btn btn-ghost btn-sm", className)}
      onClick={() => {
        const t = next[theme];
        setTheme(t);
        try {
          localStorage.setItem("theme", t);
        } catch {}
        apply(t);
      }}
      aria-label={`Farbschema: ${label} (wechseln)`}
      title={`Farbschema: ${label}`}
    >
      <Icon className="h-[1.15rem] w-[1.15rem]" />
      {!compact && <span>{label}</span>}
    </button>
  );
}
