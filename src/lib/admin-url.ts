import { env } from "./env";

/**
 * Der Admin-Bereich liegt im Code unter src/app/admin. Ist ADMIN_URL gesetzt (z. B. https://admin.gebrauchtfelgen24.at),
 * liefert src/proxy.ts ihn auf dieser Subdomain ohne „/admin“-Präfix aus; sonst bleibt er unter /admin erreichbar.
 */

/** Request-Header, den der Proxy für Admin-Seiten setzt (Root-Layout zeigt dann keinen Website-Rahmen). */
export const ADMIN_HEADER = "x-gf-admin";

export function adminHostname() {
  if (!env.adminUrl) return null;
  try {
    return new URL(env.adminUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Pfad innerhalb des Admin-Bereichs: adminPath("/nutzer") → „/nutzer“ (Subdomain) bzw. „/admin/nutzer“. */
export function adminPath(p = "/") {
  if (env.adminUrl) return p;
  return p === "/" ? "/admin" : `/admin${p}`;
}

/** Absoluter Link von der Website in den Admin-Bereich. */
export function adminHref(p = "/") {
  return env.adminUrl ? `${env.adminUrl}${p === "/" ? "" : p}` : adminPath(p);
}

/**
 * Cookie-Domain für eine gemeinsame Anmeldung auf Website und Admin-Subdomain,
 * z. B. „gebrauchtfelgen24.at“ für admin.gebrauchtfelgen24.at. Null, wenn keine Subdomain der Website (oder localhost).
 */
export function sharedCookieDomain() {
  const admin = adminHostname();
  if (!admin) return null;
  let app: string;
  try {
    app = new URL(env.appUrl).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (app === "localhost" || /^[\d.]+$/.test(app) || !app.includes(".")) return null;
  return admin.endsWith(`.${app}`) ? app : null;
}
