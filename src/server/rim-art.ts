/**
 * Erzeugt stilisierte Felgen-Grafiken als SVG (für Demo-Inserate und Platzhalter).
 */
export type RimStyle = {
  spokes: number;
  color: string;
  accent: string;
  bg: [string, string];
  tire: boolean;
  split?: boolean;
  angle?: number;
};

export function rimSvg(s: RimStyle, size = 1200) {
  const c = size / 2;
  const rOuter = s.tire ? size * 0.36 : size * 0.44;
  const rTire = size * 0.47;
  const rHub = rOuter * 0.2;
  const spokes: string[] = [];
  for (let i = 0; i < s.spokes; i++) {
    const a = ((360 / s.spokes) * i + (s.angle ?? 0)) * (Math.PI / 180);
    const w = s.split ? 0.05 : 0.11;
    const pts = [
      [Math.cos(a - w * 1.6) * rHub, Math.sin(a - w * 1.6) * rHub],
      [Math.cos(a - w) * rOuter * 0.9, Math.sin(a - w) * rOuter * 0.9],
      [Math.cos(a + w) * rOuter * 0.9, Math.sin(a + w) * rOuter * 0.9],
      [Math.cos(a + w * 1.6) * rHub, Math.sin(a + w * 1.6) * rHub],
    ]
      .map(([x, y]) => `${(c + x).toFixed(1)},${(c + y).toFixed(1)}`)
      .join(" ");
    spokes.push(`<polygon points="${pts}" fill="url(#spoke)" stroke="${s.accent}" stroke-opacity=".35" stroke-width="2"/>`);
    if (s.split) {
      const a2 = a + 0.16;
      const pts2 = [
        [Math.cos(a2 - 0.08) * rHub, Math.sin(a2 - 0.08) * rHub],
        [Math.cos(a2 - 0.05) * rOuter * 0.9, Math.sin(a2 - 0.05) * rOuter * 0.9],
        [Math.cos(a2 + 0.05) * rOuter * 0.9, Math.sin(a2 + 0.05) * rOuter * 0.9],
        [Math.cos(a2 + 0.08) * rHub, Math.sin(a2 + 0.08) * rHub],
      ]
        .map(([x, y]) => `${(c + x).toFixed(1)},${(c + y).toFixed(1)}`)
        .join(" ");
      spokes.push(`<polygon points="${pts2}" fill="url(#spoke)" stroke="${s.accent}" stroke-opacity=".35" stroke-width="2"/>`);
    }
  }
  const bolts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = ((360 / 5) * i - 90) * (Math.PI / 180);
    bolts.push(
      `<circle cx="${c + Math.cos(a) * rHub * 0.62}" cy="${c + Math.sin(a) * rHub * 0.62}" r="${rHub * 0.11}" fill="#1a1a1d" stroke="${s.accent}" stroke-opacity=".6"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size * 0.75}" viewBox="0 ${size * 0.125} ${size} ${size * 0.75}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.bg[0]}"/><stop offset="1" stop-color="${s.bg[1]}"/></linearGradient>
    <radialGradient id="barrel" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#0c0c0e"/><stop offset="1" stop-color="#2a2a30"/></radialGradient>
    <linearGradient id="spoke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.color}"/><stop offset=".5" stop-color="${s.accent}"/><stop offset="1" stop-color="${s.color}"/></linearGradient>
    <linearGradient id="lip" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fafafa" stop-opacity=".9"/><stop offset=".5" stop-color="${s.color}"/><stop offset="1" stop-color="#fafafa" stop-opacity=".7"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#bg)"/>
  <ellipse cx="${c}" cy="${c + rTire * 0.98}" rx="${rTire * 0.9}" ry="${size * 0.03}" fill="#000" opacity=".45"/>
  ${s.tire ? `<circle cx="${c}" cy="${c}" r="${rTire}" fill="#131315"/><circle cx="${c}" cy="${c}" r="${rTire - size * 0.012}" fill="none" stroke="#26262b" stroke-width="${size * 0.02}" stroke-dasharray="6 10"/>` : ""}
  <circle cx="${c}" cy="${c}" r="${rOuter}" fill="url(#lip)"/>
  <circle cx="${c}" cy="${c}" r="${rOuter * 0.93}" fill="url(#barrel)"/>
  ${spokes.join("\n  ")}
  <circle cx="${c}" cy="${c}" r="${rHub}" fill="url(#spoke)" stroke="${s.accent}" stroke-opacity=".4"/>
  ${bolts.join("")}
  <circle cx="${c}" cy="${c}" r="${rHub * 0.3}" fill="#121214" stroke="${s.accent}" stroke-width="3"/>
  <circle cx="${c - rOuter * 0.3}" cy="${c - rOuter * 0.35}" r="${rOuter * 0.9}" fill="url(#glow)"/>
</svg>`;
}

export const DEMO_STYLES: RimStyle[] = [
  { spokes: 5, color: "#c9ccd1", accent: "#f2f3f5", bg: ["#1d1f24", "#0b0b0d"], tire: false },
  { spokes: 10, color: "#2b2b30", accent: "#55555c", bg: ["#2a2622", "#0f0e0d"], tire: false, split: false },
  { spokes: 5, color: "#b08a3e", accent: "#e8c779", bg: ["#16171b", "#060607"], tire: false, split: true },
  { spokes: 6, color: "#6c7078", accent: "#b9bcc2", bg: ["#22252b", "#0c0d10"], tire: true },
  { spokes: 7, color: "#d8dadf", accent: "#ffffff", bg: ["#30343b", "#121317"], tire: true, split: true },
  { spokes: 12, color: "#3b3d43", accent: "#d6a84f", bg: ["#1a1715", "#070707"], tire: false },
  { spokes: 9, color: "#9a9ea6", accent: "#e6e8ec", bg: ["#1e2128", "#0a0b0d"], tire: true },
  { spokes: 3, color: "#202024", accent: "#e63b2e", bg: ["#241413", "#0a0707"], tire: true, split: true },
];
