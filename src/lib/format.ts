const euro = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
const num = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });

export function formatPrice(cents: number) {
  return cents % 100 === 0 ? euro.format(cents / 100) : euro2.format(cents / 100);
}

export function formatNumber(n: number | null | undefined) {
  return n == null ? "–" : num.format(n);
}

/** z. B. 8,5Jx19 */
export function formatRimSize(width: number, diameter: number) {
  return `${num.format(width)}Jx${num.format(diameter)}`;
}

export function formatPcd(boltCount?: number | null, boltCircle?: number | null) {
  if (!boltCount || !boltCircle) return null;
  return `${boltCount}x${String(boltCircle).replace(/\.0$/, "")}`;
}

export function parsePcd(pcd: string | null | undefined): { boltCount: number; boltCircle: number } | null {
  const m = pcd?.trim().replace(",", ".").match(/^(\d{1,2})\s*[x×/]\s*(\d{2,3}(?:\.\d)?)$/i);
  if (!m) return null;
  return { boltCount: Number(m[1]), boltCircle: Number(m[2]) };
}

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatRelative(d: Date | string) {
  const date = new Date(d);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  if (diff < 86400 * 2) return "gestern";
  if (diff < 86400 * 7) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return formatDate(date);
}

export function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

/** DOT-Nummer „2321" → „KW 23/2021" */
export function formatDot(dot: string | null | undefined) {
  if (!dot || !/^\d{4}$/.test(dot)) return dot ?? null;
  return `KW ${dot.slice(0, 2)}/20${dot.slice(2)}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function listingUrl(l: { id: number; title: string }) {
  return `/inserat/${l.id}-${slugify(l.title)}`;
}

export function yearRange(from?: number | null, to?: number | null) {
  if (!from) return "";
  return to ? `${from}–${to}` : `seit ${from}`;
}
