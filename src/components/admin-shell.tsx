"use client";
import { clsx } from "clsx";
import { Car, ExternalLink, Flag, KeyRound, LayoutDashboard, LogOut, Scale, ScrollText, Settings, Tag, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme";

const ICONS = {
  dashboard: LayoutDashboard,
  reports: Flag,
  listings: Tag,
  users: Users,
  vehicles: Car,
  keys: KeyRound,
  legal: Scale,
  log: ScrollText,
  settings: Settings,
} as const;

export type AdminNavItem = { href: string; label: string; icon: keyof typeof ICONS; count?: number };

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Eigener Rahmen für den Admin-Bereich: Seitenleiste am Desktop, wischbare Leiste am Handy. */
export function AdminShell({
  user,
  nav,
  siteUrl,
  loginHref,
  children,
}: {
  user: { name: string; email: string };
  nav: AdminNavItem[];
  siteUrl: string;
  loginHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const root = nav[0].href;

  const signOut = async () => {
    await authClient.signOut();
    router.push(loginHref);
    router.refresh();
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Seitenleiste */}
      <aside className="sticky top-0 z-40 border-b border-line bg-surface lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 px-4 py-3 lg:px-4 lg:py-5">
            <Link href={root} className="flex items-center gap-2" aria-label="Admin-Dashboard">
              <Logo id="gf24-admin" className="!h-7" />
            </Link>
            <span className="badge badge-brand">Admin</span>
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <ThemeToggle compact />
              <button type="button" onClick={signOut} className="btn btn-ghost btn-icon" aria-label="Abmelden">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <nav aria-label="Admin" className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:pb-4">
            {nav.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(pathname, item.href, root);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                  {!!item.count && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-solid px-1.5 text-[11px] font-bold text-white">
                      {item.count > 99 ? "99+" : item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="hidden border-t border-line p-4 lg:block">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <div className="mt-3 flex items-center gap-1">
              <a href={siteUrl} className="btn btn-outline btn-sm flex-1">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Website
              </a>
              <ThemeToggle compact />
              <button type="button" onClick={signOut} className="btn btn-ghost btn-icon" aria-label="Abmelden" title="Abmelden">
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main id="inhalt" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

