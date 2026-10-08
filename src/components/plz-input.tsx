"use client";
import { MapPin } from "lucide-react";
import { useId, useRef, useState } from "react";

type Suggestion = { country: string; zip: string; place: string };

/** PLZ-Eingabe mit Ortsvorschlägen (AT/DE/CH). */
export function PlzInput({
  value,
  onChange,
  name,
  placeholder = "PLZ oder Ort",
  invalid,
  id,
  initialLabel,
}: {
  value: string;
  onChange: (zip: string, country?: string, place?: string) => void;
  name?: string;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
  initialLabel?: string;
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialLabel || value);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = (q: string) => {
    clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/plz?q=${encodeURIComponent(q.trim())}`).catch(() => null);
      const data: Suggestion[] = r?.ok ? await r.json() : [];
      setItems(data);
      setHi(0);
      setOpen(true);
    }, 180);
  };

  const pick = (s: Suggestion) => {
    setText(`${s.zip} ${s.place}`);
    onChange(s.zip, s.country, s.place);
    setOpen(false);
  };

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
      <input
        id={id}
        className="input pl-9"
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={text}
        autoComplete="postal-code"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          const zip = v.match(/^\d{4,5}/)?.[0] ?? "";
          onChange(zip);
          search(v);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(items[hi]);
          }
        }}
      />
      {name && <input type="hidden" name={name} value={value} />}
      {open && items.length > 0 && (
        <ul id={listId} role="listbox" className="animate-scale-in absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow)]">
          {items.map((s, i) => (
            <li
              key={`${s.country}${s.zip}${s.place}`}
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ${i === hi ? "bg-surface-2" : ""}`}
            >
              <span>
                <strong>{s.zip}</strong> {s.place}
              </span>
              <span className="text-xs text-faint">{s.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
