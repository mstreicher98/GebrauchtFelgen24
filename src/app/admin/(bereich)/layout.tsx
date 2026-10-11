import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { report } from "@/db/schema";
import { AdminShell } from "@/components/admin-shell";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  // Nicht angemeldet oder kein Admin → Admin-Login (zeigt bei fehlenden Rechten einen Hinweis)
  if (!me || me.role !== "admin") redirect(adminPath("/anmelden"));

  const [{ open }] = await db.select({ open: sql<number>`count(*)::int` }).from(report).where(eq(report.status, "offen"));

  return (
    <AdminShell
      user={{ name: me.name, email: me.email }}
      siteUrl={env.appUrl}
      loginHref={adminPath("/anmelden")}
      nav={[
        { href: adminPath("/"), label: "Dashboard", icon: "dashboard" },
        { href: adminPath("/meldungen"), label: "Meldungen", icon: "reports", count: open },
        { href: adminPath("/inserate"), label: "Inserate", icon: "listings" },
        { href: adminPath("/nutzer"), label: "Nutzer", icon: "users" },
        { href: adminPath("/fahrzeuge"), label: "Fahrzeuge", icon: "vehicles" },
        { href: adminPath("/hsn-tsn"), label: "HSN/TSN", icon: "keys" },
        { href: adminPath("/rechtliches"), label: "Rechtliches", icon: "legal" },
        { href: adminPath("/protokoll"), label: "Protokoll", icon: "log" },
        { href: adminPath("/einstellungen"), label: "Einstellungen", icon: "settings" },
      ]}
    >
      {children}
    </AdminShell>
  );
}
