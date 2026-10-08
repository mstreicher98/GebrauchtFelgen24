"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "system" | "dark" | "light";

/** Wird im <head> ausgeführt, bevor die Seite gerendert wird – verhindert Flackern. */
export const themeScript = `(function(){document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme')||'system';var d=t==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;document.documentElement.dataset.theme=d;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

function apply(t: Theme) {
  const d = t === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.dataset.theme = d;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", d === "light" ? "#f5f3ef" : "#0a0a0c");
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Wert existiert erst im Browser
    setTheme(((localStorage.getItem("theme") as Theme) || "system") as Theme);
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if ((localStorage.getItem("theme") || "system") === "system") apply("system");
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
      className={compact ? "btn btn-ghost btn-icon" : "btn btn-ghost btn-sm"}
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
