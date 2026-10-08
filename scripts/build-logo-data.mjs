/**
 * Erzeugt src/components/brand/logo-data.ts aus den Logo-Quelldateien in design/logo/.
 *   node scripts/build-logo-data.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, "design/logo", f), "utf8"));

function pick(p) {
  const g = p.accentGradient;
  const words = p.wordGradientDark ?? p.themes?.dark?.word?.gradient ?? [];
  const vb = p.viewBoxCap.split(" ").map(Number);
  return {
    viewBox: p.viewBoxCap,
    width: vb[2],
    height: vb[3],
    word: p.word,
    accent: p.accent,
    wordGradients: p.word.map((_, i) => {
      const w = words[i] ?? words[0];
      return { x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 };
    }),
    accentGradient: { x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 },
  };
}

const rimSvg = fs.readFileSync(path.join(root, "design/logo/rim.svg"), "utf8");
const rim = {
  viewBox: rimSvg.match(/viewBox="([^"]+)"/)[1],
  d: rimSvg.match(/<path[^>]* d="([^"]+)"/)[1],
};

const out = `// Automatisch erzeugt aus design/logo/*.json – nicht von Hand bearbeiten (node scripts/build-logo-data.mjs)
export const LOGO_STACKED = ${JSON.stringify(pick(read("parts.json")))} as const;

export const LOGO_COMPACT = ${JSON.stringify(pick(read("parts-compact.json")))} as const;

export const RIM = ${JSON.stringify(rim)} as const;
`;
fs.writeFileSync(path.join(root, "src/components/brand/logo-data.ts"), out);
console.log("logo-data.ts geschrieben");
