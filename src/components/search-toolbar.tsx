import { clsx } from "clsx";
import { ChevronRight, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

/** Umschalter Raster/Liste – reine Links (URL-Parameter `ansicht=liste`), kein Client-JS nötig. */
export function ViewToggle({ view, gridHref, listHref }: { view: "grid" | "list"; gridHref: string; listHref: string }) {
  const items = [
    { key: "grid", href: gridHref, Icon: LayoutGrid, label: "Rasteransicht" },
    { key: "list", href: listHref, Icon: List, label: "Listenansicht" },
  ] as const;
  return (
    <div className="inline-flex h-10 items-center rounded-full border border-line bg-surface p-[3px]" role="group" aria-label="Ansicht">
      {items.map(({ key, href, Icon, label }) => {
        const active = view === key;
        return (
          <Link
            key={key}
            href={href}
            scroll={false}
            aria-label={label}
            title={label}
            aria-current={active ? "true" : undefined}
            className={clsx(
              "grid h-8 w-9 place-items-center rounded-full transition-colors",
              active ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </Link>
        );
      })}
    </div>
  );
}

export type Crumb = { label: string; href?: string };

export function SearchBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Brotkrümelnavigation" className="text-xs text-muted">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((c, i) => (
          <li key={c.label} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden />}
            {c.href ? (
              <Link href={c.href} className="truncate hover:text-brand hover:underline hover:underline-offset-2">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-fg">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
