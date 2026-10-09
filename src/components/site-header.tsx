import { BookOpen, Heart, MessageCircle, Plus, ShieldCheck, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import type { User } from "@/db/schema";
import { HeaderIconLink } from "./header-icon-link";
import { HeaderMenu } from "./header-menu";
import { Logo } from "./logo";
import { CategoryLinks, HeaderNav, MessagesLink, UserMenu } from "./site-header-client";
import { ThemeToggle } from "./theme";
import { UspBar } from "./usp-bar";

const SERVICE_LINKS = [
  { href: "/registrieren", label: "Für Händler", icon: Store },
  { href: "/sicherheit", label: "Sicher handeln", icon: ShieldCheck },
  { href: "/ratgeber", label: "Felgen-Ratgeber", icon: BookOpen },
];

/** Schmale Service-Leiste ganz oben (nur ab md) – scrollt mit weg. */
function ServiceBar() {
  return (
    <div className="hidden border-b border-line bg-surface-2 text-xs text-muted md:block">
      <div className="container-page flex h-8 items-center justify-between gap-6">
        <p className="flex items-center gap-2">
          <span className="font-semibold text-fg">Kostenlos inserieren</span>
          <span aria-hidden="true" className="text-faint">·</span>
          <span>Österreich · Deutschland · Schweiz</span>
        </p>
        <nav aria-label="Service" className="flex items-center gap-5">
          {SERVICE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-1.5 transition-colors hover:text-brand">
              <l.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <>
      <ServiceBar />
      <header className="sticky top-0 z-50 border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center gap-2">
          <Link href="/" className="mr-2 shrink-0 py-2 xl:mr-3" aria-label="GebrauchtFelgen24 – Startseite">
            <Logo id="gf24-hdr" className="h-8 md:h-9" />
          </Link>

          <Suspense fallback={<CategoryLinks />}>
            <HeaderNav />
          </Suspense>

          <div className="ml-auto flex items-center gap-0.5 md:gap-1">
            <HeaderIconLink href="/konto/merkliste" icon={Heart} label="Merkliste" />
            {user ? (
              <>
                <MessagesLink className="hidden md:flex" />
                <UserMenu name={user.name} isAdmin={user.role === "admin"} image={user.image} accountType={user.accountType} />
              </>
            ) : (
              <>
                <HeaderIconLink href="/nachrichten" icon={MessageCircle} label="Nachrichten" className="hidden md:flex" />
                <HeaderIconLink href="/anmelden" icon={UserRound} label="Anmelden" className="hidden md:flex" />
              </>
            )}
            <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-line md:block" />
            <ThemeToggle compact className="hidden h-9 min-h-9 w-9 md:inline-flex" />
            <Link href="/inserat/neu" className="btn btn-brand ml-1.5 hidden h-10 min-h-10 px-4 text-sm md:inline-flex">
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
              Inserieren
            </Link>
            <HeaderMenu
              loggedIn={!!user}
              user={user ? { name: user.name, image: user.image, isAdmin: user.role === "admin", accountType: user.accountType } : null}
            />
          </div>
        </div>
      </header>
      <UspBar />
    </>
  );
}
