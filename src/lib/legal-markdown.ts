/**
 * Kleines, sicheres Textformat für Rechtstexte (Impressum, Datenschutz, AGB).
 * Es wird nie HTML übernommen – der Text wird in eine Struktur zerlegt und als React-Elemente gerendert.
 *
 *   ## Überschrift          ### Unterüberschrift
 *   - Aufzählung            1. Nummerierte Liste
 *   **fett**  *kursiv*      [Linktext](https://…)   [[Platzhalter]]
 *   Leerzeile = neuer Absatz, einfacher Zeilenumbruch = Zeilenumbruch im Absatz
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "ph"; v: string }
  | { t: "br" };

export type Block = { t: "h2" | "h3" | "p"; c: Inline[] } | { t: "ul" | "ol"; items: Inline[][] };

const INLINE = /\[\[([^\]\n]+)\]\]|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*([^*\n]+)\*/;

/** Nur ungefährliche Ziele: https, http, mailto, tel und Pfade dieser Website */
export function safeHref(href: string) {
  return /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href) ? href : null;
}

/** „§ 5“ und „Art. 6“ nicht umbrechen */
function typography(s: string) {
  return s.replace(/§ /g, "§ ").replace(/\bArt\. (?=\d)/g, "Art. ");
}

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      pushText(out, rest);
      break;
    }
    if (m.index > 0) pushText(out, rest.slice(0, m.index));
    if (m[1] !== undefined) out.push({ t: "ph", v: m[1].trim() });
    else if (m[2] !== undefined) {
      const href = safeHref(m[3]);
      if (href) out.push({ t: "link", href, c: parseInline(m[2]) });
      else pushText(out, m[2]);
    } else if (m[4] !== undefined) out.push({ t: "strong", c: parseInline(m[4]) });
    else if (m[5] !== undefined) out.push({ t: "em", c: parseInline(m[5]) });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

function pushText(out: Inline[], v: string) {
  const parts = v.split("\n");
  parts.forEach((p, i) => {
    if (i > 0) out.push({ t: "br" });
    if (p) out.push({ t: "text", v: typography(p) });
  });
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

export function parseLegal(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ t: "p", c: parseInline(para.join("\n").trim()) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ t: list.t, items: list.items.map((i) => parseInline(i.trim())) });
    list = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (!trimmed) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ t: heading[1].length === 2 ? "h2" : "h3", c: parseInline(heading[2].trim()) });
    } else if (BULLET.test(line) || NUMBER.test(line)) {
      flushPara();
      const t = BULLET.test(line) ? "ul" : "ol";
      if (list && list.t !== t) flushList();
      list ??= { t, items: [] };
      list.items.push(line.replace(t === "ul" ? BULLET : NUMBER, ""));
    } else if (list && /^\s{2,}/.test(line)) {
      // eingerückte Folgezeile gehört zum letzten Listenpunkt
      list.items[list.items.length - 1] += `\n${trimmed}`;
    } else {
      flushList();
      para.push(trimmed);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/** Alle noch offenen [[Platzhalter]] im Text */
export function findPlaceholders(src: string) {
  return [...src.matchAll(/\[\[([^\]\n]+)\]\]/g)].map((m) => m[1].trim());
}
