// Offline candle-SVG design rig: build the SVG, rasterize to PNG so I can SEE it
// and iterate, then port the polished art into the React renderer.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

export function candleSVG(opts = {}) {
  const {
    waxHex = "#F0D9AE",
    whipHex = "#FBF3E4",
    drizzleHex = "#7A3B12",
  } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 740">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF9F5"/><stop offset="1" stop-color="#F6E7E2"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".55"/>
      <stop offset=".16" stop-color="#ffffff" stop-opacity=".10"/>
      <stop offset=".5" stop-color="#e9e2dd" stop-opacity=".05"/>
      <stop offset=".84" stop-color="#9b908a" stop-opacity=".10"/>
      <stop offset="1" stop-color="#8c817b" stop-opacity=".22"/>
    </linearGradient>
    <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".18"/>
      <stop offset=".5" stop-color="#3A2C2A" stop-opacity="0"/>
      <stop offset="1" stop-color="#3A2C2A" stop-opacity=".22"/>
    </linearGradient>
    <radialGradient id="cream" cx="40%" cy="28%" r="80%">
      <stop offset="0" stop-color="#FFFDF9"/><stop offset=".55" stop-color="#FBF1E0"/>
      <stop offset="1" stop-color="#EAD7BE"/>
    </radialGradient>
    <radialGradient id="creamHi" cx="38%" cy="26%" r="60%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="berry" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#F06A78"/><stop offset="1" stop-color="#B92038"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#F8D89A" stop-opacity=".8"/>
      <stop offset="55%" stop-color="#F0C0A0" stop-opacity=".25"/>
      <stop offset="100%" stop-color="#F0C0A0" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3A2C2A" flood-opacity=".18"/>
    </filter>
    <filter id="tinyshadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3A2C2A" flood-opacity=".3"/>
    </filter>
  </defs>

  <rect width="600" height="740" fill="url(#bg)"/>

  <!-- contact shadow -->
  <ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".16"/>

  <!-- ===== GLASS JAR ===== -->
  <g filter="url(#soft)">
    <path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z"
          fill="#ECE7E3" fill-opacity=".5"/>
  </g>
  <!-- wax inside (inset for glass thickness) -->
  <path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z" fill="${waxHex}"/>
  <path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z" fill="url(#depth)"/>
  <path d="M186 392 L414 392 L412 422 L188 422 Z" fill="#fff" opacity=".28"/>
  <!-- glass body tint + highlights over everything inside -->
  <path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z" fill="url(#glass)"/>
  <rect x="184" y="372" width="16" height="250" rx="8" fill="#fff" opacity=".5"/>
  <rect x="408" y="380" width="8" height="220" rx="4" fill="#fff" opacity=".22"/>
  <!-- rim -->
  <ellipse cx="300" cy="350" rx="129" ry="20" fill="#E7E0DB" stroke="#D2C8C1" stroke-width="2"/>
  <ellipse cx="300" cy="350" rx="118" ry="14" fill="#D9CBB0"/>

  <!-- ===== WHIPPED CREAM SWIRL ===== -->
  ${cream(whipHex)}

  <!-- ===== DRIZZLE ===== -->
  <g stroke-linecap="round" fill="none">
    <path d="M214 250 q34 26 70 6 q34 -20 70 4 q26 16 44 2" stroke="${drizzleHex}" stroke-width="9"/>
    <path d="M214 250 q34 26 70 6 q34 -20 70 4 q26 16 44 2" stroke="#fff" stroke-opacity=".4" stroke-width="3" transform="translate(0 -2)"/>
  </g>

  <!-- ===== TOPPINGS ===== -->
  <!-- strawberry -->
  <g filter="url(#tinyshadow)" transform="translate(232 196) rotate(-12)">
    <path d="M0 -20 C18 -16 22 6 0 26 C-22 6 -18 -16 0 -20 Z" fill="url(#berry)"/>
    <path d="M-10 -22 L-2 -30 L0 -22 L3 -30 L11 -22 Z" fill="#3F7A3A"/>
    <circle cx="-5" cy="0" r="1.5" fill="#ffd"/><circle cx="5" cy="4" r="1.5" fill="#ffd"/>
    <circle cx="0" cy="12" r="1.5" fill="#ffd"/>
  </g>
  <!-- blueberries -->
  <g filter="url(#tinyshadow)">
    <circle cx="370" cy="206" r="15" fill="#46588F"/><circle cx="365" cy="201" r="4" fill="#7C8BB8"/>
    <circle cx="392" cy="224" r="12" fill="#3C4E82"/><circle cx="388" cy="220" r="3" fill="#7C8BB8"/>
  </g>
  <!-- cherry on top -->
  <g filter="url(#tinyshadow)">
    <path d="M300 150 q26 -36 52 -44" stroke="#5E7D3A" stroke-width="4" fill="none"/>
    <circle cx="300" cy="160" r="17" fill="url(#berry)"/>
    <ellipse cx="293" cy="153" rx="5" ry="3.5" fill="#fff" opacity=".55"/>
  </g>

  <!-- ===== WICK + FLAME + GLOW ===== -->
  <circle cx="300" cy="120" r="86" fill="url(#glow)"/>
  <rect x="297.5" y="92" width="5" height="34" rx="2.5" fill="#3A2C2A"/>
  <path d="M300 36 C326 64 326 96 300 122 C274 96 274 64 300 36 Z" fill="#F0B24E"/>
  <path d="M300 56 C316 76 316 98 300 120 C284 98 284 76 300 56 Z" fill="#F8E6B0"/>
  <ellipse cx="300" cy="112" rx="6" ry="10" fill="#9ec5ff" opacity=".75"/>
</svg>`;
}

// Piped whipped-cream swirl: stacked, shaded dollops spiraling to a peak.
// Parametric on whip color; white highlight + dark crescent give each dollop form.
export function cream(whipHex = "#FBF3E4") {
  const cx = 300;
  const dollops = [
    { x: 300, y: 330, r: 116, ry: 60 },
    { x: 268, y: 300, r: 78 },
    { x: 336, y: 292, r: 70 },
    { x: 286, y: 256, r: 64 },
    { x: 322, y: 224, r: 52 },
    { x: 300, y: 196, r: 40 },
    { x: 300, y: 168, r: 26 },
  ];
  let out = `<g filter="url(#soft)">`;
  out += `<ellipse cx="${cx}" cy="334" rx="118" ry="22" fill="#3A2C2A" opacity=".14"/>`;
  for (const d of dollops) {
    const ry = d.ry ?? d.r * 0.9;
    out += `<ellipse cx="${d.x}" cy="${d.y}" rx="${d.r}" ry="${ry}" fill="${whipHex}"/>`;
  }
  out += `</g>`;
  for (const d of dollops) {
    const ry = d.ry ?? d.r * 0.9;
    // dark crescent (lower-right) for volume
    out += `<ellipse cx="${d.x + d.r * 0.22}" cy="${d.y + ry * 0.34}" rx="${d.r * 0.62}" ry="${ry * 0.5}" fill="#3A2C2A" opacity=".07"/>`;
    // bright highlight (upper-left)
    out += `<ellipse cx="${d.x - d.r * 0.28}" cy="${d.y - ry * 0.42}" rx="${d.r * 0.5}" ry="${ry * 0.4}" fill="url(#creamHi)"/>`;
  }
  return out;
}

const variants = [
  { waxHex: "#F0D9AE", whipHex: "#FBF3E4", drizzleHex: "#7A3B12" },
  { waxHex: "#EBB7BE", whipHex: "#F4CAD2", drizzleHex: "#9C2F52" }, // strawberry
  { waxHex: "#D9A86A", whipHex: "#F6E4B8", drizzleHex: "#B5763C" }, // caramel
];
// 3-up board
const inner = variants
  .map((v, i) => `<svg x="${i * 600}" y="0" width="600" height="740">${candleSVG(v).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</svg>`)
  .join("");
const board = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 740">${inner}</svg>`;
const png = new Resvg(board, { fitTo: { mode: "width", value: 1500 } }).render().asPng();
writeFileSync(new URL("../candle-preview.png", import.meta.url), png);
console.log("wrote candle-preview.png");
