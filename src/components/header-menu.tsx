"use client";
import { clsx } from "clsx";
import { BookOpen, ChevronRight, LogOut, Menu, Plus, Shield, ShieldCheck, Store, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HeaderActionLabel, headerActionClass } from "./header-icon-link";
import { Logo } from "./logo";
import { ACCOUNT_ITEMS, CATEGORIES, UserAvatar, accountLabel, useActiveCategory, useSignOut, type AccountType } from "./site-header-client";
import { ThemeToggle } from "./theme";

const SERVICE = [
  { href: "/registrieren", label: "Für Händler", icon: Store },
  { href: "/sicherheit", label: "Sicher handeln", icon: ShieldCheck },
  { href: "/ratgeber", label: "Felgen-Ratgeber", icon: BookOpen },
];

export type HeaderMenuUser = { name: string; image: string | null; isAdmin: boolean; accountType?: AccountType };

/** Menü-Knopf + Seitenpanel mit Kategorien und Service-Links (unterhalb von xl, wo die Kategorien-Leiste fehlt). */
export function HeaderMenu({ loggedIn, user = null }: { loggedIn: boolean; user?: HeaderMenuUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Menü bei Navigation schließen
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab") return;
      // Fokus im offenen Menü halten
      const items = document.getElementById("header-menu")?.querySelectorAll<HTMLElement>("a[href], button:not([tabindex='-1'])");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(headerActionClass, "xl:hidden")}
        aria-expanded={open}
        aria-controls="header-menu"
        aria-label="Menü öffnen"
      >
        <Menu className="h-[1.375rem] w-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
        <HeaderActionLabel>Menü</HeaderActionLabel>
      </button>

      {open &&
        createPortal(<MenuPanel loggedIn={loggedIn} user={user} closeRef={closeRef} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/** Seitenpanel – per Portal direkt in <body>, damit es über der Tab-Leiste liegt. */
function MenuPanel({
  loggedIn,
  user,
  closeRef,
  onClose,
}: {
  loggedIn: boolean;
  user: HeaderMenuUser | null;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const signOut = useSignOut();
  return (
    <div
      className="fixed inset-0 z-[100] xl:hidden"
      id="header-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menü"
      // Jeder Link schließt das Menü – auch wenn sich nur die Suchparameter ändern (gleicher Pfad)
      onClick={(e) => (e.target as Element).closest("a") && onClose()}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="animate-fade-in absolute inset-0 cursor-default bg-black/45"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col border-l border-line bg-surface shadow-[var(--shadow)] animate-[slide-in-right_0.3s_cubic-bezier(0.2,0.8,0.2,1)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Logo id="gf24-menu" className="h-8" />
          <button ref={closeRef} type="button" onClick={onClose} className="btn btn-ghost btn-icon h-10 min-h-10 w-10" aria-label="Menü schließen">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {user && <MenuAccount user={user} />}

          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-faint">Kategorien</h2>
          <MenuCategories />

          <h2 className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-faint">Service</h2>
          <ul className="mt-2 space-y-0.5">
            {SERVICE.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-fg hover:bg-surface-2 hover:text-brand">
                  <s.icon className="h-[1.125rem] w-[1.125rem] text-muted" aria-hidden="true" />
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
            <span className="text-sm text-muted">Farbschema</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid shrink-0 gap-2 border-t border-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Link href="/inserat/neu" className="btn btn-brand w-full">
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            Kostenlos inserieren
          </Link>
          {loggedIn ? (
            <button
              type="button"
              onClick={() => {
                onClose(); // auch schließen, wenn man schon auf der Startseite ist
                void signOut();
              }}
              className="btn btn-ghost w-full"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Abmelden
            </button>
          ) : (
            <Link href="/anmelden" className="btn btn-outline w-full">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Anmelden oder registrieren
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Eigene Komponente, damit `useSearchParams` erst beim Öffnen (nur im Browser) ausgewertet wird. */
function MenuCategories() {
  const active = useActiveCategory();
  return (
    <ul className="mt-2 space-y-0.5">
      {CATEGORIES.map((c) => {
        const on = c.key === active;
        return (
          <li key={c.key}>
            <Link
              href={c.href}
              aria-current={on ? "page" : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2",
                on && "bg-brand-soft",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-brand">
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={clsx("block text-[0.9375rem] font-semibold", on ? "text-brand" : "text-fg")}>{c.label}</span>
                <span className="block truncate text-xs text-muted">{c.hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Konto-Bereich im Panel – am Handy der einzige Weg zu Suchaufträgen, Einstellungen und zum Abmelden. */
function MenuAccount({ user }: { user: HeaderMenuUser }) {
  const items = ACCOUNT_ITEMS.filter((i) => i.href !== "/konto");
  return (
    <section aria-label="Mein Konto" className="mb-6">
      <Link href="/konto" className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-3 transition-colors hover:bg-surface-3">
        <UserAvatar name={user.name} image={user.image} className="h-10 w-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-semibold text-fg">{user.name}</span>
          <span className="block text-xs text-muted">{accountLabel(user.isAdmin, user.accountType)} · Mein Konto</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
      </Link>
      <ul className="mt-2 grid grid-cols-2 gap-1">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium text-fg hover:bg-surface-2 hover:text-brand">
              <i.icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-muted" aria-hidden="true" />
              <span className="truncate">{i.label}</span>
            </Link>
          </li>
        ))}
        {user.isAdmin && (
          <li>
            <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-sm font-medium text-brand hover:bg-surface-2">
              <Shield className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true" />
              <span className="truncate">Admin-Bereich</span>
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
