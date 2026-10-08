import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/meldungen", "Meldungen"],
  ["/admin/inserate", "Inserate"],
  ["/admin/nutzer", "Nutzer"],
  ["/admin/fahrzeuge", "Fahrzeuge"],
  ["/admin/hsn-tsn", "HSN/TSN"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-3xl font-bold uppercase">
          Admin<span className="text-brand">.</span>
        </h1>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="chip shrink-0">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
