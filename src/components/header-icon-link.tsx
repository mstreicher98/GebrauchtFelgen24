import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

/**
 * Gemeinsame Optik der Kopfzeilen-Aktionen (AutoScout24-Stil): Icon oben, Beschriftung darunter.
 * Am Handy nur das Icon (Beschriftung bleibt für Screenreader über aria-label erhalten).
 */
export const headerActionClass =
  "group relative flex h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-1.5 text-fg transition-colors hover:bg-surface-2 hover:text-brand md:h-12 md:min-w-16";

export function HeaderActionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="hidden max-w-20 truncate text-[11px] font-medium leading-none text-muted transition-colors group-hover:text-brand md:block">
      {children}
    </span>
  );
}

export function HeaderBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      className="animate-pop absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-solid px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface"
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function HeaderIconLink({
  href,
  icon: Icon,
  label,
  ariaLabel,
  badge = 0,
  active = false,
  className,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  ariaLabel?: string;
  badge?: number;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? "page" : undefined}
      className={clsx(headerActionClass, active && "text-brand", className)}
    >
      <span className="relative">
        <Icon className="h-[1.375rem] w-[1.375rem]" strokeWidth={1.75} aria-hidden="true" />
        <HeaderBadge count={badge} />
      </span>
      <HeaderActionLabel>{label}</HeaderActionLabel>
    </Link>
  );
}
