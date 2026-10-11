import "server-only";
import { cache } from "react";
import { getSetting, setSetting } from "./settings";

/** Website-Hinweis (z. B. Wartung), im Admin-Bereich unter „Einstellungen“ pflegbar. */
export type SiteBannerData = {
  text: string;
  tone: "info" | "warnung" | "erfolg";
  link: string | null;
  /** ISO-Datum; danach wird der Hinweis automatisch ausgeblendet */
  until: string | null;
};

const KEY = "site_banner";

export async function readSiteBanner(): Promise<SiteBannerData | null> {
  const raw = await getSetting(KEY);
  if (!raw) return null;
  try {
    const b = JSON.parse(raw) as SiteBannerData;
    return b.text ? b : null;
  } catch {
    return null;
  }
}

/** Aktiver Hinweis für die Website (abgelaufene werden ignoriert). Fehler der DB blenden ihn einfach aus. */
export const getSiteBanner = cache(async () => {
  try {
    const b = await readSiteBanner();
    if (!b || (b.until && new Date(b.until).getTime() < Date.now())) return null;
    return b;
  } catch {
    return null;
  }
});

export async function writeSiteBanner(b: SiteBannerData | null) {
  await setSetting(KEY, b ? JSON.stringify(b) : "");
}

const TZ = "Europe/Vienna";

/** ISO-Zeitpunkt → Wert für <input type="datetime-local"> (Wiener Zeit). */
export function toViennaInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(" ", "T");
}

/** Wert aus <input type="datetime-local"> als Wiener Zeit lesen. */
export function fromViennaInput(local: string) {
  const asUtc = new Date(`${local}Z`);
  if (Number.isNaN(asUtc.getTime())) return null;
  const inTz = new Date(asUtc.toLocaleString("en-US", { timeZone: TZ }));
  const inUtc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUtc.getTime() - (inTz.getTime() - inUtc.getTime()));
}
