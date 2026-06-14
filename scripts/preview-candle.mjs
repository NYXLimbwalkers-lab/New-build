// Offline candle-SVG design rig: build → rasterize → LOOK → iterate, then port
// the polished art into the React renderer.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

// deterministic pseudo-random so scatter is stable
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

const DRIP = {
  caramel: "#B5763C",
  chocolate: "#5A3825",
  berry: "#A52248",
  honey: "#D9A441",
};

// Realistic drizzled sauce: several thin glossy ribbons criss-crossing the dome
// + a couple of drips over the edge. Reads as sauce, not one fat squiggle.
// Fine zigzag lattice — the instantly-readable "drizzle" look (thin glossy sauce
// flicked back and forth), with a couple of drips off the edge.
function zigPath(cx, y, halfW, n, amp, curve) {
  // smooth back-and-forth using quadratic segments across the dome top
  let p = `M${cx - halfW} ${y}`;
  const step = (halfW * 2) / n;
  for (let i = 0; i < n; i++) {
    const x0 = cx - halfW + step * i;
    const x1 = x0 + step;
    const cxm = (x0 + x1) / 2;
    const cy = y - (i % 2 === 0 ? amp : -amp) - curve;
    p += ` Q${cxm} ${cy} ${x1} ${y}`;
  }
  return p;
}

function drizzle(hex) {
  const a = zigPath(300, 232, 96, 7, 26, 0); // main lattice
  const b = zigPath(300, 248, 80, 6, 20, -10); // second pass, slightly lower
  const drips = ["M214 250 q-7 22 -2 42", "M388 248 q8 20 2 42"];
  let out = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const d of [a, b]) {
    out += `<path d="${d}" stroke="${hex}" stroke-width="4"/>`;
    out += `<path d="${d}" stroke="#fff" stroke-opacity=".35" stroke-width="1.3" transform="translate(0 -1.2)"/>`;
  }
  for (const d of drips) out += `<path d="${d}" stroke="${hex}" stroke-width="4"/>`;
  out += `</g>`;
  return out;
}

const CANDY = ["#E8A0C0", "#9ACBE0", "#F6E4B8", "#C4E0B0", "#E0A0A0", "#D9A0E0"];

// Scatter toppings across the cream dome (sprinkles/crumble/candy/pecans),
// placed toppings sit at nice spots (strawberry/cherry/orange/waffle/marsh).
function toppings(ids) {
  let out = "";
  const placedSpots = [
    { x: 236, y: 206 }, { x: 366, y: 214 }, { x: 300, y: 168 },
    { x: 392, y: 256 }, { x: 222, y: 258 }, { x: 330, y: 182 },
  ];
  let placedI = 0;
  ids.forEach((id, idx) => {
    if (["sprinkles", "crumble", "candy"].includes(id)) {
      out += scatter(id, idx);
    } else {
      const p = placedSpots[placedI++ % placedSpots.length];
      out += `<g filter="url(#tinyshadow)" transform="translate(${p.x} ${p.y})">${placed(id)}</g>`;
    }
  });
  return out;
}

function scatter(kind, seedIdx) {
  const r = rng(7 + seedIdx * 31);
  const n = kind === "sprinkles" ? 18 : kind === "crumble" ? 16 : 9;
  let out = `<g filter="url(#tinyshadow)">`;
  for (let i = 0; i < n; i++) {
    // within an ellipse over the dome
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = 300 + Math.cos(a) * rad * 118;
    const y = 214 + Math.sin(a) * rad * 60;
    const rot = Math.floor(r() * 180);
    if (kind === "sprinkles") {
      const c = CANDY[Math.floor(r() * CANDY.length)];
      out += `<rect x="${x - 7}" y="${y - 2.4}" width="14" height="4.8" rx="2.4" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
    } else if (kind === "crumble") {
      out += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="3" fill="#C89B62" transform="rotate(${rot} ${x} ${y})"/>`;
    } else {
      const c = CANDY[Math.floor(r() * CANDY.length)];
      out += `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/><path d="M${x - 8} ${y} q8 -6 16 0 q-8 6 -16 0z" fill="#fff" opacity=".4"/>`;
    }
  }
  out += `</g>`;
  return out;
}

function placed(id) {
  switch (id) {
    case "strawberry":
      return `<g transform="rotate(-12)"><path d="M0 -20 C18 -16 22 6 0 26 C-22 6 -18 -16 0 -20 Z" fill="url(#berry)"/><path d="M-10 -22 L-2 -30 L0 -22 L3 -30 L11 -22 Z" fill="#3F7A3A"/><circle cx="-5" cy="0" r="1.6" fill="#ffe"/><circle cx="5" cy="6" r="1.6" fill="#ffe"/><circle cx="0" cy="13" r="1.6" fill="#ffe"/></g>`;
    case "blueberry":
      return `<g><circle cx="0" cy="0" r="15" fill="#46588F"/><circle cx="-5" cy="-5" r="4" fill="#7C8BB8"/><path d="M0 -4 l3 3 l-3 3 l-3 -3 z" fill="#26304f"/><circle cx="22" cy="10" r="12" fill="#3C4E82"/><circle cx="18" cy="6" r="3" fill="#7C8BB8"/></g>`;
    case "orange-slice":
      return `<g><circle cx="0" cy="0" r="18" fill="#E89B3C"/><circle cx="0" cy="0" r="13" fill="#FBE0B0"/><path d="M0 0 V-13 M0 0 L11 7 M0 0 L-11 7 M0 0 L13 -3 M0 0 L-13 -3" stroke="#E89B3C" stroke-width="2"/></g>`;
    case "waffle":
      return `<g transform="rotate(-12)"><rect x="-18" y="-15" width="36" height="30" rx="7" fill="#D9A86A"/><path d="M-13 -10 H13 M-13 0 H13 M-13 10 H13 M-6 -15 V15 M6 -15 V15" stroke="#b3823f" stroke-width="2"/></g>`;
    case "marshmallow":
      return `<g><rect x="-15" y="-13" width="30" height="26" rx="9" fill="#FBF6EE" stroke="#e7d9c4" stroke-width="1.5"/><ellipse cx="0" cy="-13" rx="15" ry="4" fill="#fff"/></g>`;
    case "pecan":
      return `<g><ellipse cx="0" cy="0" rx="16" ry="12" fill="#8A5A33"/><path d="M0 -10 V10 M-10 -4 q10 4 20 0 M-10 4 q10 -4 20 0" stroke="#5e3c1f" stroke-width="1.6" fill="none"/></g>`;
    case "cherry":
    default:
      return `<g><path d="M0 -14 q14 -14 6 -30" stroke="#5E7D3A" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="0" cy="0" r="17" fill="url(#berry)"/><ellipse cx="-7" cy="-7" rx="5" ry="3.5" fill="#fff" opacity=".55"/></g>`;
  }
}

// Stacked wax layers (parfait look): layers[0] is the bottom pour.
function waxLayers(layers) {
  const top = 392, bottom = 632, span = bottom - top;
  const bandH = span / layers.length;
  let out = `<g clip-path="url(#waxclip)">`;
  layers.forEach((hex, i) => {
    const y = bottom - bandH * (i + 1);
    out += `<rect x="168" y="${y}" width="264" height="${bandH + 1}" fill="${hex}"/>`;
  });
  // separation lines between layers + top sheen
  for (let i = 1; i < layers.length; i++) {
    const y = bottom - bandH * i;
    out += `<rect x="168" y="${y - 2}" width="264" height="3" fill="#3A2C2A" opacity=".10"/>`;
    out += `<rect x="168" y="${y - 4}" width="264" height="2" fill="#fff" opacity=".25"/>`;
  }
  out += `<rect x="168" y="392" width="264" height="26" fill="#fff" opacity=".22"/>`;
  out += `</g>`;
  return out;
}

export function candleSVG(opts = {}) {
  const {
    waxHex = "#F0D9AE",
    whipHex = "#FBF3E4",
    drizzleId = "caramel",
    hasDrizzle = true,
    hasWhip = true,
    toppingIds = ["strawberry", "blueberry", "cherry"],
  } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 740">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9F5"/><stop offset="1" stop-color="#F6E7E2"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".16" stop-color="#ffffff" stop-opacity=".10"/><stop offset=".5" stop-color="#e9e2dd" stop-opacity=".05"/><stop offset=".84" stop-color="#9b908a" stop-opacity=".10"/><stop offset="1" stop-color="#8c817b" stop-opacity=".22"/></linearGradient>
    <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".5" stop-color="#3A2C2A" stop-opacity="0"/><stop offset="1" stop-color="#3A2C2A" stop-opacity=".22"/></linearGradient>
    <radialGradient id="creamHi" cx="38%" cy="26%" r="60%"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="creamShade" cx="50%" cy="18%" r="95%"><stop offset="58%" stop-color="#3A2C2A" stop-opacity="0"/><stop offset="100%" stop-color="#3A2C2A" stop-opacity=".13"/></radialGradient>
    <radialGradient id="berry" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F06A78"/><stop offset="1" stop-color="#B92038"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F8D89A" stop-opacity=".8"/><stop offset="55%" stop-color="#F0C0A0" stop-opacity=".25"/><stop offset="100%" stop-color="#F0C0A0" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3A2C2A" flood-opacity=".18"/></filter>
    <filter id="tinyshadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3A2C2A" flood-opacity=".3"/></filter>
  </defs>
  <rect width="600" height="740" fill="url(#bg)"/>
  <ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".16"/>
  <g filter="url(#soft)"><path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z" fill="#ECE7E3" fill-opacity=".5"/></g>
  <clipPath id="waxclip"><path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z"/></clipPath>
  ${waxLayers(opts.layers || [waxHex])}
  <path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z" fill="url(#depth)"/>
  <path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z" fill="url(#glass)"/>
  <rect x="184" y="372" width="16" height="250" rx="8" fill="#fff" opacity=".5"/>
  <rect x="408" y="380" width="8" height="220" rx="4" fill="#fff" opacity=".22"/>
  <ellipse cx="300" cy="628" rx="118" ry="18" fill="#3A2C2A" opacity=".10"/>
  <ellipse cx="300" cy="350" rx="129" ry="20" fill="#E7E0DB" stroke="#D2C8C1" stroke-width="2"/>
  <ellipse cx="300" cy="350" rx="118" ry="14" fill="${waxHex}" fill-opacity=".5"/>
  ${hasWhip ? cream(whipHex) : ""}
  ${hasDrizzle ? drizzle(DRIP[drizzleId] || DRIP.caramel) : ""}
  ${toppings(toppingIds)}
  <circle cx="300" cy="130" r="86" fill="url(#glow)"/>
  <rect x="297" y="120" width="6" height="40" rx="3" fill="#3A2C2A"/>
  <path d="M300 40 C326 70 326 102 300 128 C274 102 274 70 300 40 Z" fill="#F0B24E"/>
  <path d="M300 62 C316 82 316 104 300 126 C284 104 284 82 300 62 Z" fill="#F8E6B0"/>
  <ellipse cx="300" cy="118" rx="6" ry="10" fill="#9ec5ff" opacity=".75"/>
</svg>`;
}

// Piped soft-serve cream: a scalloped silhouette tapering to a peak, with
// front swirl ridges (shadow fold + highlight) that read as piped cream.
function cream(whipHex) {
  const cx = 300;
  const tiers = [
    { y: 348, hw: 118 }, { y: 322, hw: 116 }, { y: 294, hw: 106 }, { y: 266, hw: 92 },
    { y: 238, hw: 77 }, { y: 210, hw: 60 }, { y: 184, hw: 44 }, { y: 160, hw: 28 }, { y: 140, hw: 13 },
  ];
  // closed silhouette: up the scalloped left edge, over the peak, down the right
  let d = `M${cx - tiers[0].hw} ${tiers[0].y}`;
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i], b = tiers[i + 1];
    const my = (a.y + b.y) / 2;
    const bulge = Math.max(a.hw, b.hw) + 15;
    d += ` Q${cx - bulge} ${my} ${cx - b.hw} ${b.y}`;
  }
  d += ` Q${cx} ${tiers[tiers.length - 1].y - 16} ${cx + tiers[tiers.length - 1].hw} ${tiers[tiers.length - 1].y}`;
  for (let i = tiers.length - 1; i > 0; i--) {
    const a = tiers[i], b = tiers[i - 1];
    const my = (a.y + b.y) / 2;
    const bulge = Math.max(a.hw, b.hw) + 15;
    d += ` Q${cx + bulge} ${my} ${cx + b.hw} ${b.y}`;
  }
  d += " Z";

  let out = `<g filter="url(#soft)">`;
  out += `<ellipse cx="${cx}" cy="348" rx="126" ry="20" fill="#3A2C2A" opacity=".14"/>`;
  out += `<path d="${d}" fill="${whipHex}"/>`;
  out += `<path d="${d}" fill="url(#creamShade)"/>`;
  out += `</g>`;
  // volume: bright highlight upper-left, soft shadow on the right
  out += `<ellipse cx="${cx - 30}" cy="250" rx="86" ry="120" fill="url(#creamHi)" opacity=".7"/>`;
  out += `<ellipse cx="${cx + 58}" cy="262" rx="56" ry="116" fill="#3A2C2A" opacity=".05"/>`;
  // swirl ridges (fold shadow + bright highlight) at every tier — piped texture
  for (let i = 0; i < tiers.length - 1; i++) {
    const t = tiers[i];
    const w = t.hw * 0.9;
    out += `<path d="M${cx - w} ${t.y} Q${cx} ${t.y + 13} ${cx + w} ${t.y}" fill="none" stroke="#3A2C2A" stroke-opacity=".12" stroke-width="6" stroke-linecap="round"/>`;
    out += `<path d="M${cx - w} ${t.y - 7} Q${cx} ${t.y + 4} ${cx + w} ${t.y - 7}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3.2" stroke-linecap="round"/>`;
  }
  return out;
}

function board(list, label) {
  const inner = list
    .map((v, i) => {
      const cell = candleSVG(v).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      const safe = v.name ? v.name.replace(/&/g, "&amp;") : "";
      const name = v.name
        ? `<text x="${i * 600 + 300}" y="724" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#5b3a4a">${safe}</text>`
        : "";
      return `<svg x="${i * 600}" y="0" width="600" height="740">${cell}</svg>${name}`;
    })
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${list.length * 600} 760">${inner}</svg>`;
  writeFileSync(new URL(`../${label}.png`, import.meta.url), new Resvg(svg, { fitTo: { mode: "width", value: 460 * list.length } }).render().asPng());
}

// Multi-layer wax test (parfait look).
board([
  { name: "1 layer", layers: ["#F4E4C9"], whipHex: "#FBF3E4", drizzleId: "caramel", toppingIds: ["cherry"] },
  { name: "2 layers", layers: ["#EBB7BE", "#F4E4C9"], whipHex: "#F4CAD2", drizzleId: "berry", toppingIds: ["strawberry"] },
  { name: "3 layers", layers: ["#D9A86A", "#F1C79A", "#F4E4C9"], whipHex: "#FBF3E4", drizzleId: "chocolate", toppingIds: ["sprinkles"] },
  { name: "4 layers", layers: ["#9C6B4F", "#EBB7BE", "#F1C79A", "#F4E4C9"], whipHex: "#FBF3E4", drizzleId: "caramel", toppingIds: ["cherry", "blueberry"] },
], "candle-preview");
console.log("wrote candle-preview.png");
