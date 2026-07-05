// Offline candle-SVG design rig: build → rasterize → LOOK → iterate, then port
// the polished art into the React renderer.
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";

// deterministic pseudo-random so scatter is stable
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

// mix a hex color toward white (t=0..1) — for wax surface pools & sheens
function lighten(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v + (255 - v) * t);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function darken(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v * (1 - t));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
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

// Drizzle that BELONGS to the cream: fine zigzag whose baseline follows the
// dome curvature (ends dip down the flanks), plus wavy runs flowing down the
// sides that end in a rounded droplet — like sauce actually poured on top.
function domeZig(cx, yc, halfW, n, amp, drop) {
  let p = `M${cx - halfW} ${yc + drop}`;
  const step = (halfW * 2) / n;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const x1 = cx - halfW + step * (i + 1);
    const base1 = yc + drop * Math.pow(2 * t1 - 1, 2);
    const xm = cx - halfW + step * (i + 0.5);
    const basem = yc + drop * Math.pow(2 * ((t0 + t1) / 2) - 1, 2);
    p += ` Q${xm} ${basem + (i % 2 === 0 ? -amp : amp)} ${x1} ${base1}`;
  }
  return p;
}

function drizzle(hex) {
  // two lattice passes — enough to read "drizzled", not scribbled
  const zigs = [
    domeZig(300, 222, 96, 8, 14, 26),
    domeZig(300, 250, 106, 9, 12, 28),
  ];
  // runs START where the lattice ends (connected!), flow down, end in a bead
  const runs = [
    { d: "M204 248 q-9 22 -2 42 q5 14 -2 26", ex: 200, ey: 318 },
    { d: "M396 250 q10 22 3 44 q-5 12 1 22", ex: 400, ey: 320 },
    { d: "M332 262 q6 13 1 24", ex: 333, ey: 288 },
  ];
  let out = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const d of zigs) {
    out += `<path d="${d}" stroke="#3A2C2A" stroke-opacity=".16" stroke-width="6" transform="translate(0 2.4)"/>`;
    out += `<path d="${d}" stroke="${hex}" stroke-width="5"/>`;
    out += `<path d="${d}" stroke="#fff" stroke-opacity=".42" stroke-width="1.5" transform="translate(-0.6 -1.4)"/>`;
  }
  for (const r of runs) {
    out += `<path d="${r.d}" stroke="#3A2C2A" stroke-opacity=".14" stroke-width="6.4" transform="translate(0 2)"/>`;
    out += `<path d="${r.d}" stroke="${hex}" stroke-width="5.2"/>`;
    out += `<path d="${r.d}" stroke="#fff" stroke-opacity=".3" stroke-width="1.3" transform="translate(-0.8 0)"/>`;
    out += `<circle cx="${r.ex}" cy="${r.ey}" r="4.6" fill="${hex}" stroke="none"/>`;
    out += `<circle cx="${r.ex - 1.4}" cy="${r.ey - 1.6}" r="1.4" fill="#fff" opacity=".5" stroke="none"/>`;
  }
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

// Stacked wax layers (parfait look) with REAL depth: per-band tonal gradient,
// cylindrical side shading, gently wavy pour lines between layers, and a
// luminous surface — wax, not painted rectangles.
function waxBands(layers, clipId, top, bottom, topRx = 114) {
  const span = bottom - top;
  const bandH = span / layers.length;
  const topHex = layers[layers.length - 1];
  let out = `<g clip-path="url(#${clipId})">`;
  layers.forEach((hex, i) => {
    const y = bottom - bandH * (i + 1);
    out += `<rect x="120" y="${y}" width="360" height="${bandH + 2}" fill="${hex}"/>`;
    // in-band tonal falloff: light where light hits, dense at its floor
    out += `<rect x="120" y="${y}" width="360" height="${bandH + 2}" fill="url(#bandTone)"/>`;
  });
  // wavy pour seams between layers (hand-poured, not ruled lines)
  for (let i = 1; i < layers.length; i++) {
    const y = bottom - bandH * i;
    out += `<path d="M120 ${y} q60 5 150 1 t210 -2 v6 q-120 4 -210 2 t-150 -1 z" fill="#3A2C2A" opacity=".08"/>`;
    out += `<path d="M120 ${y - 2} q60 5 150 1 t210 -2" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>`;
  }
  // cylindrical shading across the whole fill
  out += `<rect x="120" y="${top}" width="360" height="${span}" fill="url(#cyl)"/>`;
  // THE SURFACE: an elliptical pool of lighter wax at the fill line, with a
  // soft meniscus shadow tucked under its front lip — this is what makes it
  // read as poured wax instead of a painted rectangle. Drawn boldly: the glass
  // overlay above will soften it.
  out += `<ellipse cx="300" cy="${top + 9}" rx="${topRx + 8}" ry="19" fill="${darken(topHex, 0.14)}"/>`;
  out += `<ellipse cx="300" cy="${top + 4}" rx="${topRx + 2}" ry="16" fill="${lighten(topHex, 0.38)}"/>`;
  out += `<ellipse cx="270" cy="${top + 1}" rx="${topRx * 0.42}" ry="7" fill="${lighten(topHex, 0.62)}" opacity=".9"/>`;
  out += `</g>`;
  return out;
}

// Container art per vessel — mouth kept at y≈350 so cream/toppings code is shared.
function vesselArt(vessel, layers) {
  const top = layers[layers.length - 1];
  if (vessel === "tin") {
    // opaque metal tin: straight sides, label band, metallic sheen
    return `
      <g filter="url(#soft)"><path d="M174 356 L174 632 Q174 648 190 648 L410 648 Q426 648 426 632 L426 356 Z" fill="#D8CFC4"/></g>
      <rect x="174" y="356" width="252" height="290" fill="url(#metal)"/>
      <rect x="186" y="362" width="14" height="280" fill="#fff" opacity=".4"/>
      <rect x="398" y="368" width="7" height="268" fill="#3A2C2A" opacity=".08"/>
      <rect x="174" y="452" width="252" height="96" rx="6" fill="#FBF6EE" opacity=".55"/>
      <rect x="174" y="452" width="252" height="96" rx="6" fill="none" stroke="#C9A96A" stroke-opacity=".5" stroke-width="1.6"/>
      <text x="300" y="496" text-anchor="middle" font-family="Georgia, serif" font-size="21" letter-spacing="4" fill="#8a6f52">DÉLA JÁ</text>
      <text x="300" y="522" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="3" fill="#a89376">HAND-POURED</text>
      <ellipse cx="300" cy="356" rx="128" ry="18" fill="#BDB4AA"/>
      <ellipse cx="300" cy="354" rx="119" ry="14" fill="${darken(top, 0.06)}"/>
      <ellipse cx="300" cy="352.5" rx="112" ry="11.5" fill="${lighten(top, 0.26)}"/>
      <ellipse cx="272" cy="351" rx="46" ry="5" fill="${lighten(top, 0.5)}" opacity=".8"/>
      <ellipse cx="300" cy="356" rx="128" ry="18" fill="none" stroke="#A89E92" stroke-width="2"/>`;
  }
  if (vessel === "dessert") {
    // footed sundae glass: wide bowl, stem, foot
    const bowl = "M168 350 Q176 470 300 506 Q424 470 432 350 Z";
    const inner = "M186 364 Q196 462 300 492 Q404 462 414 364 Z";
    return `
      <g filter="url(#soft)"><path d="${bowl}" fill="#ECE7E3" fill-opacity=".45"/></g>
      <clipPath id="dclip"><path d="${inner}"/></clipPath>
      ${waxBands(layers, "dclip", 372, 496, 106)}
      <path d="${inner}" fill="url(#depth)"/>
      <path d="${bowl}" fill="url(#glass)"/>
      <path d="M186 360 Q196 450 296 488" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/>
      <rect x="294" y="500" width="12" height="120" fill="#ECE7E3" fill-opacity=".5"/>
      <ellipse cx="300" cy="636" rx="84" ry="16" fill="#EDE7DF" fill-opacity=".6" stroke="#D2C8C1" stroke-width="2"/>
      <ellipse cx="300" cy="350" rx="132" ry="18" fill="#E7E0DB" stroke="#D2C8C1" stroke-width="2"/>
      <ellipse cx="300" cy="350" rx="120" ry="13" fill="${top}" fill-opacity=".5"/>`;
  }
  // default: glass jar
  return `
    <g filter="url(#soft)"><path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z" fill="#ECE7E3" fill-opacity=".5"/></g>
    <clipPath id="jclip"><path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z"/></clipPath>
    ${waxBands(layers, "jclip", 392, 632, 112)}
    <path d="M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z" fill="url(#depth)"/>
    <path d="M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z" fill="url(#glass)"/>
    <rect x="184" y="372" width="16" height="250" rx="8" fill="#fff" opacity=".5"/>
    <rect x="408" y="380" width="8" height="220" rx="4" fill="#fff" opacity=".22"/>
    <ellipse cx="300" cy="628" rx="118" ry="18" fill="#3A2C2A" opacity=".10"/>
    <ellipse cx="300" cy="350" rx="129" ry="20" fill="#E7E0DB" stroke="#D2C8C1" stroke-width="2"/>
    <ellipse cx="300" cy="350" rx="118" ry="14" fill="${top}" fill-opacity=".5"/>`;
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
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".2" stop-color="#E9E2DA" stop-opacity=".2"/><stop offset=".5" stop-color="#CFC7BE" stop-opacity="0"/><stop offset=".82" stop-color="#A89E92" stop-opacity=".25"/><stop offset="1" stop-color="#8c817b" stop-opacity=".4"/></linearGradient>
    <radialGradient id="creamHi" cx="38%" cy="26%" r="60%"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
    <radialGradient id="creamShade" cx="50%" cy="18%" r="95%"><stop offset="58%" stop-color="#3A2C2A" stop-opacity="0"/><stop offset="100%" stop-color="#3A2C2A" stop-opacity=".13"/></radialGradient>
    <radialGradient id="berry" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#F06A78"/><stop offset="1" stop-color="#B92038"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F8D89A" stop-opacity=".8"/><stop offset="55%" stop-color="#F0C0A0" stop-opacity=".25"/><stop offset="100%" stop-color="#F0C0A0" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3A2C2A" flood-opacity=".18"/></filter>
    <filter id="tinyshadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3A2C2A" flood-opacity=".3"/></filter>
    <filter id="flameSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <linearGradient id="bandTone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity=".04"/><stop offset=".85" stop-color="#3A2C2A" stop-opacity=".05"/><stop offset="1" stop-color="#3A2C2A" stop-opacity=".14"/></linearGradient>
    <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A2C2A" stop-opacity=".22"/><stop offset=".12" stop-color="#fff" stop-opacity=".22"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset=".76" stop-color="#3A2C2A" stop-opacity="0"/><stop offset="1" stop-color="#3A2C2A" stop-opacity=".26"/></linearGradient>
    <linearGradient id="surfGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEFCF" stop-opacity=".55"/><stop offset="1" stop-color="#FFEFCF" stop-opacity="0"/></linearGradient>
    <linearGradient id="flameOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C158"/><stop offset="1" stop-color="#EE8F35"/></linearGradient>
    <radialGradient id="flameCore" cx="50%" cy="72%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#F8E6B0"/><stop offset="1" stop-color="#F8E6B0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="600" height="740" fill="url(#bg)"/>
  <ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".16"/>
  ${vesselArt(opts.vessel || "jar", opts.layers || [waxHex])}
  ${hasWhip ? cream(whipHex) : ""}
  ${hasDrizzle ? drizzle(DRIP[drizzleId] || DRIP.caramel) : ""}
  ${toppings(toppingIds)}
  <circle cx="300" cy="118" r="78" fill="url(#glow)"/>
  <rect x="297.4" y="118" width="5.2" height="40" rx="2.6" fill="#2E211C"/>
  <g filter="url(#flameSoft)">
    <path d="M300 42 C325 72 324 102 300 126 C276 102 275 72 300 42 Z" fill="url(#flameOut)"/>
  </g>
  <path d="M300 64 C315 84 314 104 300 122 C286 104 285 84 300 64 Z" fill="url(#flameCore)"/>
  <ellipse cx="300" cy="119" rx="4.6" ry="7" fill="#8FB6F2" opacity=".55"/>
</svg>`;
}

// Piped soft-serve cream: a scalloped silhouette tapering to a peak, with
// front swirl ridges (shadow fold + highlight) that read as piped cream.
function cream(whipHex) {
  const cx = 300;
  // organic wobble: each tier drifts slightly off-axis like hand-piped frosting
  const tiers = [
    { y: 348, hw: 118, dx: 0 }, { y: 321, hw: 115, dx: -5 }, { y: 293, hw: 105, dx: 5 },
    { y: 265, hw: 91, dx: -6 }, { y: 237, hw: 76, dx: 5 }, { y: 210, hw: 59, dx: -4 },
    { y: 185, hw: 43, dx: 4 }, { y: 162, hw: 27, dx: -3 }, { y: 143, hw: 12, dx: 2 },
  ];
  const L = (t) => cx + t.dx - t.hw;
  const R = (t) => cx + t.dx + t.hw;
  let d = `M${L(tiers[0])} ${tiers[0].y}`;
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i], b = tiers[i + 1];
    const my = (a.y + b.y) / 2;
    const bulge = Math.max(a.hw, b.hw) + 19;
    d += ` Q${cx + (a.dx + b.dx) / 2 - bulge} ${my} ${L(b)} ${b.y}`;
  }
  // soft-serve curl at the peak: a little flick instead of a symmetric dome
  const top = tiers[tiers.length - 1];
  d += ` C${cx + top.dx - 6} ${top.y - 22} ${cx + top.dx + 14} ${top.y - 18} ${R(top)} ${top.y}`;
  for (let i = tiers.length - 1; i > 0; i--) {
    const a = tiers[i], b = tiers[i - 1];
    const my = (a.y + b.y) / 2;
    const bulge = Math.max(a.hw, b.hw) + 19;
    d += ` Q${cx + (a.dx + b.dx) / 2 + bulge} ${my} ${R(b)} ${b.y}`;
  }
  d += " Z";

  let out = `<g filter="url(#soft)">`;
  out += `<ellipse cx="${cx}" cy="348" rx="126" ry="20" fill="#3A2C2A" opacity=".14"/>`;
  out += `<path d="${d}" fill="${whipHex}"/>`;
  out += `<path d="${d}" fill="url(#creamShade)"/>`;
  out += `</g>`;
  // volume: bright highlight upper-left, soft warm shadow lower-right
  out += `<ellipse cx="${cx - 34}" cy="248" rx="84" ry="118" fill="url(#creamHi)" opacity=".65"/>`;
  out += `<ellipse cx="${cx + 56}" cy="266" rx="54" ry="112" fill="#6B4A3F" opacity=".05"/>`;
  // piped folds: soft shadow tucked UNDER each tier lip + a thin catchlight —
  // widths/opacities vary so it reads as frosting, not ruled stripes
  for (let i = 0; i < tiers.length - 2; i++) {
    const t = tiers[i];
    const w = t.hw * 0.86;
    const sag = 12 - i * 0.6;
    out += `<path d="M${cx + t.dx - w} ${t.y - 1} Q${cx + t.dx} ${t.y + sag} ${cx + t.dx + w} ${t.y - 1}" fill="none" stroke="#6B4A3F" stroke-opacity=".10" stroke-width="${6.5 - i * 0.35}" stroke-linecap="round"/>`;
    out += `<path d="M${cx + t.dx - w * 0.92} ${t.y - 7} Q${cx + t.dx} ${t.y + sag - 9} ${cx + t.dx + w * 0.92} ${t.y - 7}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.6" stroke-linecap="round"/>`;
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

// Distinct vessels test.
board([
  { name: "Glass Jar", vessel: "jar", layers: ["#F4E4C9"], whipHex: "#FBF3E4", drizzleId: "caramel", toppingIds: ["strawberry", "cherry"] },
  { name: "Tin", vessel: "tin", layers: ["#F4E4C9"], whipHex: "#FBF3E4", drizzleId: "chocolate", toppingIds: ["sprinkles"] },
  { name: "Dessert Glass", vessel: "dessert", layers: ["#EBB7BE", "#F4E4C9"], whipHex: "#F4CAD2", drizzleId: "berry", toppingIds: ["cherry", "blueberry"] },
], "candle-preview");
console.log("wrote candle-preview.png");
