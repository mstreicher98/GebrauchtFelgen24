import Link from "next/link";
import type { User } from "@/db/schema";
import { Logo } from "./logo";
import { HeaderNav, MessagesLink, UserMenu } from "./site-header-client";
import { ThemeToggle } from "./theme";

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-bg/80 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/65">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="group shrink-0 py-2" aria-label="GebrauchtFelgen24 – Startseite">
          <Logo id="gf24-hdr" className="h-8 transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:h-9 lg:h-10" />
        </Link>
        <HeaderNav />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle compact />
          {user ? (
            <>
              <MessagesLink />
              <Link href="/inserat/neu" className="btn btn-brand btn-sm ml-1 hidden md:inline-flex">
                + Inserieren
              </Link>
              <UserMenu name={user.name} isAdmin={user.role === "admin"} image={user.image} />
            </>
          ) : (
            <>
              <Link href="/anmelden" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                Anmelden
              </Link>
              <Link href="/inserat/neu" className="btn btn-brand btn-sm hidden md:inline-flex">
                + Inserieren
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
