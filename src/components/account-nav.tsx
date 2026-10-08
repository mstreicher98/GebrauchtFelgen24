"use client";
import { clsx } from "clsx";
import { Bell, Heart, LayoutDashboard, LayoutList, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/konto", label: "Übersicht", icon: LayoutDashboard, exact: true },
  { href: "/konto/inserate", label: "Meine Inserate", icon: LayoutList },
  { href: "/nachrichten", label: "Nachrichten", icon: MessageCircle },
  { href: "/konto/merkliste", label: "Merkliste", icon: Heart },
  { href: "/konto/suchauftraege", label: "Suchaufträge", icon: Bell },
  { href: "/konto/einstellungen", label: "Einstellungen", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0" aria-label="Kontobereich">
      {ITEMS.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={clsx(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-gold-soft text-gold" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <i.icon className="h-4 w-4" />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
