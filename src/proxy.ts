import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HEADER, adminHostname } from "@/lib/admin-url";
import { env } from "@/lib/env";

function requestHost(req: NextRequest) {
  const raw = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  return raw.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
}

function withAdminHeader(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set(ADMIN_HEADER, "1");
  return { request: { headers } };
}

/**
 * Admin-Subdomain: admin.gebrauchtfelgen24.at/nutzer → intern /admin/nutzer.
 * Auf der Website wird /admin/* dorthin umgeleitet. Die Berechtigung prüft das Admin-Layout bzw. jede Server-Action.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const adminHost = adminHostname();
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const stripped = (isAdminPath ? pathname.slice("/admin".length) : pathname) || "/";

  if (adminHost && requestHost(req) === adminHost) {
    // Alte Links mit Präfix auf saubere Adressen umleiten
    if (isAdminPath) return NextResponse.redirect(new URL(stripped + search, env.adminUrl!));
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    const res = NextResponse.rewrite(url, withAdminHeader(req));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (isAdminPath) {
    if (adminHost) return NextResponse.redirect(new URL(stripped + search, env.adminUrl!));
    return NextResponse.next(withAdminHeader(req));
  }

  // Den internen Header nie von außen übernehmen
  if (req.headers.has(ADMIN_HEADER)) {
    const headers = new Headers(req.headers);
    headers.delete(ADMIN_HEADER);
    return NextResponse.next({ request: { headers } });
  }
  return NextResponse.next();
}

export const config = {
  // Keine API-Routen, Next-Interna, Bilder und Dateien mit Endung (Icons, Schriften, sw.js …)
  matcher: ["/((?!api/|_next/|bilder/|.*\\.\\w+$).*)"],
};
