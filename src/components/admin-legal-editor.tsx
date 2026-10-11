"use client";
import { clsx } from "clsx";
import { Bold, Heading2, Heading3, Link2, List, ListOrdered, SquareDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
import { adminSaveLegal } from "@/app/actions/admin";
import { findPlaceholders, parseLegal } from "@/lib/legal-markdown";
import { LegalContent } from "./legal-content";
import { toast } from "./toaster";

type Tool = { label: string; icon: React.ComponentType<{ className?: string }>; line?: string; wrap?: [string, string, string] };

const TOOLS: Tool[] = [
  { label: "Überschrift", icon: Heading2, line: "## " },
  { label: "Unterüberschrift", icon: Heading3, line: "### " },
  { label: "Fett", icon: Bold, wrap: ["**", "**", "fetter Text"] },
  { label: "Aufzählung", icon: List, line: "- " },
  { label: "Nummerierte Liste", icon: ListOrdered, line: "1. " },
  { label: "Link", icon: Link2, wrap: ["[", "](https://)", "Linktext"] },
  { label: "Platzhalter", icon: SquareDashed, wrap: ["[[", "]]", "noch ausfüllen"] },
];

/**
 * Editor für Rechtstexte: Textformat links, Live-Vorschau rechts (am Handy umschaltbar).
 * Speichern legt eine neue Version an; der Text ist danach sofort auf der Website.
 */
export function LegalEditor({ slug, initial, saved, sourceNote }: { slug: string; initial: string; saved: string; sourceNote?: string }) {
  const [text, setText] = useState(initial);
  const [baseline, setBaseline] = useState(saved);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const deferred = useDeferredValue(text);
  const dirty = text.trim() !== baseline.trim();
  const placeholders = findPlaceholders(deferred);

  // Warnung beim Verlassen mit ungespeicherten Änderungen
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      const r = await adminSaveLegal(slug, text);
      if (r.error) return toast(r.error, "error");
      setBaseline(text);
      toast(r.unchanged ? "Keine Änderungen" : "Gespeichert – die neue Fassung ist online");
      router.replace(location.pathname);
      router.refresh();
    });

  const apply = (tool: Tool) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let next: string;
    let cursor: [number, number];
    if (tool.line) {
      const lineStart = value.lastIndexOf("\n", a - 1) + 1;
      next = value.slice(0, lineStart) + tool.line + value.slice(lineStart);
      cursor = [a + tool.line.length, b + tool.line.length];
    } else {
      const [pre, post, fallback] = tool.wrap!;
      const sel = value.slice(a, b) || fallback;
      next = value.slice(0, a) + pre + sel + post + value.slice(b);
      cursor = [a + pre.length, a + pre.length + sel.length];
    }
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(...cursor);
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-line p-0.5 xl:hidden" role="tablist" aria-label="Ansicht">
          {(
            [
              ["edit", "Bearbeiten"],
              ["preview", "Vorschau"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx("rounded-lg px-3 py-1.5 text-sm font-medium", tab === k ? "bg-brand-soft text-brand" : "text-muted")}>
              {l}
            </button>
          ))}
        </div>
        <span className={clsx("badge", placeholders.length ? "badge-red" : "badge-green")}>
          {placeholders.length ? `${placeholders.length} Platzhalter offen` : "Keine Platzhalter offen"}
        </span>
        {sourceNote && <span className="text-xs text-muted">{sourceNote}</span>}
        <div className="ml-auto flex items-center gap-2">
          {dirty && <span className="text-xs text-faint">Ungespeicherte Änderungen</span>}
          <button type="button" className="btn btn-brand btn-sm" disabled={pending || !dirty} onClick={save}>
            Speichern & veröffentlichen
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={clsx("card overflow-hidden", tab !== "edit" && "max-xl:hidden")}>
          <div className="scrollbar-none flex gap-0.5 overflow-x-auto border-b border-line p-1.5" role="toolbar" aria-label="Formatierung">
            {TOOLS.map((t) => (
              <button key={t.label} type="button" onClick={() => apply(t)} className="btn btn-ghost btn-icon shrink-0" title={t.label} aria-label={t.label}>
                <t.icon className="h-[1.125rem] w-[1.125rem]" />
              </button>
            ))}
          </div>
          <textarea
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                if (dirty && !pending) save();
              }
            }}
            spellCheck
            lang="de"
            aria-label="Text"
            className="block min-h-[65vh] w-full resize-y bg-transparent p-4 font-mono text-[0.85rem] leading-relaxed outline-none"
          />
        </div>

        <div className={clsx("card prose-legal min-w-0 p-5 sm:p-8 xl:max-h-[calc(65vh+3.25rem)] xl:overflow-y-auto", tab !== "preview" && "max-xl:hidden")} aria-label="Vorschau">
          <LegalContent blocks={parseLegal(deferred)} />
        </div>
      </div>

      {placeholders.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Offen: {placeholders.slice(0, 8).join(" · ")}
          {placeholders.length > 8 ? " …" : ""}
        </p>
      )}

      <details className="card mt-4 p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Formatierung – so funktioniert’s</summary>
        <div className="mt-3 grid gap-x-6 gap-y-1.5 text-muted sm:grid-cols-2">
          <p>
            <code>## Überschrift</code> · <code>### Unterüberschrift</code>
          </p>
          <p>
            <code>**fett**</code> · <code>*kursiv*</code>
          </p>
          <p>
            <code>- Punkt</code> bzw. <code>1. Punkt</code> für Listen
          </p>
          <p>
            <code>[Linktext](https://…)</code> oder <code>[Text](mailto:…)</code>
          </p>
          <p>
            <code>[[Platzhalter]]</code> wird blau markiert, bis er ersetzt ist
          </p>
          <p>Leerzeile = neuer Absatz, Zeilenumbruch bleibt erhalten</p>
        </div>
        <p className="mt-3 text-xs text-faint">HTML wird nicht übernommen. Jede gespeicherte Fassung bleibt im Verlauf und kann wieder geladen werden.</p>
      </details>
    </div>
  );
}
