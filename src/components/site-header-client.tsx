"use client";
import { clsx } from "clsx";
import {
  Bell,
  CarFront,
  ChevronDown,
  Heart,
  Home,
  LayoutList,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useUnread } from "./realtime-provider";

const NAV = [
  { href: "/suche", label: "Felgen finden" },
  { href: "/fahrzeuge", label: "Fahrzeug-Datenbank" },
  { href: "/ratgeber", label: "Ratgeber" },
];

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={clsx(
              "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "text-fg" : "text-muted hover:text-fg",
            )}
          >
            {n.label}
            <span
              className={clsx(
                "absolute inset-x-3.5 -bottom-[1px] h-0.5 rounded-full bg-brand transition-transform duration-300",
                active ? "scale-x-100" : "scale-x-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function MessagesLink() {
  const unread = useUnread();
  return (
    <Link href="/nachrichten" className="btn btn-ghost btn-icon relative hidden md:inline-flex" aria-label={`Nachrichten${unread ? ` (${unread} ungelesen)` : ""}`}>
      <MessageCircle className="h-5 w-5" />
      {unread > 0 && (
        <span key={unread} className="animate-pop absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-solid px-1 text-[10px] font-bold text-white">
          {unread}
        </span>
      )}
    </Link>
  );
}

export function UserMenu({ name, isAdmin, image }: { name: string; isAdmin: boolean; image: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Menü bei Navigation schließen
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);

  const items = [
    { href: "/konto", label: "Übersicht", icon: UserIcon },
    { href: "/konto/inserate", label: "Meine Inserate", icon: LayoutList },
    { href: "/nachrichten", label: "Nachrichten", icon: MessageCircle },
    { href: "/konto/merkliste", label: "Merkliste", icon: Heart },
    { href: "/konto/suchauftraege", label: "Suchaufträge", icon: Bell },
    { href: "/konto/einstellungen", label: "Einstellungen", icon: Settings },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="ml-1 flex items-center gap-1.5 rounded-full border border-line py-1 pl-1 pr-2.5 transition-colors hover:border-brand"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <ChevronDown className={clsx("h-4 w-4 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="animate-scale-in absolute right-0 top-12 w-60 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow)]"
        >
          <div className="truncate px-3 py-2 text-sm font-semibold">{name}</div>
          {items.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
              <i.icon className="h-4 w-4" />
              {i.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-brand hover:bg-surface-2">
              <Shield className="h-4 w-4" />
              Admin-Bereich
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg"
            onClick={async () => {
              await authClient.signOut();
              router.push("/");
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
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
    { href: loggedIn ? "/konto" : "/anmelden", label: loggedIn ? "Konto" : "Login", icon: UserIcon },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="grid grid-cols-5">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
          return (
            <Link key={t.label} href={t.href} className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium">
              {t.primary ? (
                <span className="-mt-5 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-fill to-brand-fill-2 text-on-brand shadow-[0_8px_24px_-8px_var(--brand)]">
                  <t.icon className="h-6 w-6" />
                </span>
              ) : (
                <t.icon className={clsx("h-5 w-5 transition-colors", active ? "text-brand" : "text-muted")} />
              )}
              <span className={active ? "text-fg" : "text-muted"}>{t.label}</span>
              {!!t.badge && (
                <span className="absolute right-[calc(50%-18px)] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-solid px-1 text-[10px] font-bold text-white">
                  {t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
