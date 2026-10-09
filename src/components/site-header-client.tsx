"use client";
import { clsx } from "clsx";
import {
  Bell,
  CarFront,
  ChevronDown,
  CircleDot,
  Heart,
  Home,
  LayoutList,
  LogOut,
  MessageCircle,
  Motorbike,
  Plus,
  Search,
  Settings,
  Shield,
  Snowflake,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { HeaderActionLabel, HeaderIconLink, headerActionClass } from "./header-icon-link";
import { RimMark } from "./logo";
import { useUnread } from "./realtime-provider";

export type CategoryKey = "auto" | "komplettrad" | "winter" | "motorrad" | "fahrzeuge";

function RimIcon({ className }: { className?: string }) {
  return <RimMark className={className} />;
}

/** Kategorien der Hauptnavigation (Desktop-Leiste + Menü am Handy). */
export const CATEGORIES: { key: CategoryKey; href: string; label: string; hint: string; icon: LucideIcon | typeof RimIcon }[] = [
  { key: "auto", href: "/suche?typ=auto&art=felge", label: "Autofelgen", hint: "Alu-, Stahl- & Originalfelgen", icon: RimIcon },
  { key: "komplettrad", href: "/suche?art=komplettrad", label: "Kompletträder", hint: "Felge + Reifen, fertig montiert", icon: CircleDot },
  { key: "winter", href: "/suche?saison=winter", label: "Winterräder", hint: "Für die kalte Jahreszeit", icon: Snowflake },
  { key: "motorrad", href: "/suche?typ=motorrad", label: "Motorrad", hint: "Vorder- & Hinterradfelgen", icon: Motorbike },
  { key: "fahrzeuge", href: "/fahrzeuge", label: "Fahrzeug-Datenbank", hint: "Lochkreis, ET & Größen je Modell", icon: CarFront },
];

/** Welche Kategorie passt zur aktuellen URL? (genau eine oder keine) */
export function useActiveCategory(): CategoryKey | null {
  const pathname = usePathname();
  const sp = useSearchParams();
  if (pathname.startsWith("/fahrzeuge")) return "fahrzeuge";
  if (pathname !== "/suche") return null;
  if ((sp.get("saison") ?? "").split(",").includes("winter")) return "winter";
  if (sp.get("typ") === "motorrad") return "motorrad";
  if (sp.get("art") === "komplettrad") return "komplettrad";
  if (sp.get("typ") === "auto" && sp.get("art") === "felge") return "auto";
  return null;
}

/** Kategorien-Leiste ohne Aktiv-Zustand (Fallback, solange die URL-Parameter noch nicht bekannt sind). */
export function CategoryLinks({ active = null }: { active?: CategoryKey | null }) {
  return (
    <nav className="hidden h-full items-stretch xl:flex" aria-label="Kategorien">
      {CATEGORIES.map((c) => {
        const on = c.key === active;
        return (
          <Link
            key={c.key}
            href={c.href}
            aria-current={on ? "page" : undefined}
            className={clsx(
              "relative flex items-center whitespace-nowrap px-2 text-[0.9375rem] font-semibold transition-colors",
              on ? "text-brand" : "text-fg hover:text-brand",
            )}
          >
            {c.label}
            <span
              aria-hidden="true"
              className={clsx(
                "absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand transition-transform duration-300",
                on ? "scale-x-100" : "scale-x-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function HeaderNav() {
  return <CategoryLinks active={useActiveCategory()} />;
}

export function MessagesLink({ className }: { className?: string }) {
  const unread = useUnread();
  const pathname = usePathname();
  return (
    <HeaderIconLink
      href="/nachrichten"
      icon={MessageCircle}
      label="Nachrichten"
      ariaLabel={`Nachrichten${unread ? ` (${unread} ungelesen)` : ""}`}
      badge={unread}
      active={pathname.startsWith("/nachrichten")}
      className={className}
    />
  );
}

/** Einträge des Benutzermenüs (Kopfzeile ab md und Seitenpanel am Handy). */
export const ACCOUNT_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/konto", label: "Übersicht", icon: UserIcon },
  { href: "/konto/inserate", label: "Meine Inserate", icon: LayoutList },
  { href: "/nachrichten", label: "Nachrichten", icon: MessageCircle },
  { href: "/konto/merkliste", label: "Merkliste", icon: Heart },
  { href: "/konto/suchauftraege", label: "Suchaufträge", icon: Bell },
  { href: "/konto/einstellungen", label: "Einstellungen", icon: Settings },
];

export type AccountType = "privat" | "haendler";

export function accountLabel(isAdmin: boolean, accountType?: AccountType) {
  if (isAdmin) return "Administrator";
  if (accountType === "haendler") return "Händlerkonto";
  if (accountType === "privat") return "Privatkonto";
  return "Angemeldet";
}

export function UserAvatar({ name, image, className }: { name: string; image: string | null; className?: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className={clsx(className, "shrink-0 rounded-full object-cover")} referrerPolicy="no-referrer" />
  ) : (
    <span aria-hidden="true" className={clsx(className, "grid shrink-0 place-items-center rounded-full bg-brand-fill font-bold text-on-brand")}>
      {initial}
    </span>
  );
}

/** Abmelden und zur Startseite – gemeinsam für Benutzermenü und Seitenpanel. */
export function useSignOut() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };
}

export function UserMenu({
  name,
  isAdmin,
  image,
  accountType,
}: {
  name: string;
  isAdmin: boolean;
  image: string | null;
  accountType?: AccountType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const signOut = useSignOut();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Menü bei Navigation schließen
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(headerActionClass, (open || pathname.startsWith("/konto")) && "text-brand")}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Benutzermenü von ${name}`}
      >
        <UserAvatar name={name} image={image} className="h-[1.375rem] w-[1.375rem] text-[11px]" />
        <HeaderActionLabel>
          <span className="inline-flex items-center gap-0.5">
            <span className="truncate">Mein Konto</span>
            <ChevronDown className={clsx("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </span>
        </HeaderActionLabel>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Mein Konto"
          // Auch Klicks auf die aktuelle Seite (gleicher Pfad) schließen das Menü
          onClick={(e) => (e.target as Element).closest("a") && setOpen(false)}
          className="animate-scale-in absolute right-0 top-full mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow)]"
        >
          <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
            <UserAvatar name={name} image={image} className="h-9 w-9 text-sm" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-fg">{name}</div>
              <div className="text-xs text-muted">{accountLabel(isAdmin, accountType)}</div>
            </div>
          </div>
          <div className="py-1">
            {ACCOUNT_ITEMS.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                role="menuitem"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg hover:bg-surface-2 hover:text-brand"
              >
                <i.icon className="h-4 w-4 text-muted" aria-hidden="true" />
                {i.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-surface-2">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin-Bereich
              </Link>
            )}
          </div>
          <div className="border-t border-line pt-1">
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** App-artige Navigation am unteren Rand (nur Mobil). */
export function MobileTabBar({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const unread = useUnread();
  if (pathname.startsWith("/nachrichten/")) return null;
  const tabs = [
    { href: "/", label: "Start", icon: Home, exact: true },
    { href: "/suche", label: "Suche", icon: Search },
    { href: "/inserat/neu", label: "Inserieren", icon: Plus, primary: true },
    { href: loggedIn ? "/nachrichten" : "/fahrzeuge", label: loggedIn ? "Chats" : "Fahrzeuge", icon: loggedIn ? MessageCircle : CarFront, badge: loggedIn ? unread : 0 },
    { href: loggedIn ? "/konto" : "/anmelden", label: loggedIn ? "Konto" : "Anmelden", icon: UserIcon },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_-6px_rgb(0_0_0/0.18)] md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link
              key={t.label}
              href={t.href}
              aria-current={active ? "page" : undefined}
              aria-label={t.badge ? `${t.label} (${t.badge} ungelesen)` : undefined}
              className="relative flex flex-col items-center gap-0.5 pb-1.5 pt-1.5 text-[11px] font-medium leading-none"
            >
              {active && !t.primary && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-brand" aria-hidden="true" />}
              {/* Alle Icons in einer gleich hohen Fläche: einheitliche Grundlinie, nichts ragt über die Leiste
                  (sonst kollidiert der Knopf mit festen Leisten darüber, z. B. Kaufleiste im Inserat). */}
              <span
                className={clsx(
                  "relative grid h-8 place-items-center rounded-full transition-colors",
                  t.primary ? "w-12 bg-brand-fill text-on-brand" : clsx("w-10", active ? "text-brand" : "text-muted"),
                )}
              >
                <t.icon
                  className={t.primary ? "h-5 w-5" : "h-[1.375rem] w-[1.375rem]"}
                  strokeWidth={t.primary ? 2.5 : 1.75}
                  aria-hidden="true"
                />
                {!!t.badge && (
                  <span
                    className="absolute right-0 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-solid px-1 text-[10px] font-bold text-white ring-2 ring-surface"
                    aria-hidden="true"
                  >
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
              </span>
              <span className={active ? "font-semibold text-fg" : t.primary ? "text-fg" : "text-muted"}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
