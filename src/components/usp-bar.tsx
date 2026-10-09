"use client";
import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

const USPS = [
  { strong: "Passungsprüfung", rest: "für dein Fahrzeug" },
  { strong: "Kostenlos", rest: "inserieren" },
  { strong: "Privat & Händler", rest: "auf einem Marktplatz" },
  { strong: "Sicher chatten", rest: "– Kontaktdaten bleiben privat" },
];

/** Bereiche, in denen die Vorteile-Leiste nur ablenken würde (Chat, Verwaltung). */
const HIDDEN = ["/nachrichten", "/admin", "/konto"];

/** Vorteile-Leiste unter der Kopfzeile (Shop-Muster). Bis xl eine Zeile, horizontal wischbar (bei 1024 px passen die vier Punkte noch nicht nebeneinander). */
export function UspBar() {
  const pathname = usePathname();
  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="border-b border-line bg-brand-soft">
      <div className="container-page">
        <ul
          data-usp-track
          aria-label="Deine Vorteile"
          className="scrollbar-none -mx-4 flex h-10 items-center gap-6 overflow-x-auto whitespace-nowrap pl-4 pr-10 [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] sm:-mx-6 sm:pl-6 xl:mx-0 xl:justify-between xl:gap-4 xl:overflow-visible xl:px-0 xl:[mask-image:none]"
        >
          {USPS.map((u) => (
            <li key={u.strong} className="flex shrink-0 items-center gap-2 text-[0.8125rem] leading-none">
              <span className="grid h-[1.125rem] w-[1.125rem] place-items-center rounded-full bg-brand-fill text-on-brand">
                <Check className="h-3 w-3" strokeWidth={3.25} aria-hidden="true" />
              </span>
              <span>
                <span className="font-semibold text-fg">{u.strong}</span> <span className="text-muted">{u.rest}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
