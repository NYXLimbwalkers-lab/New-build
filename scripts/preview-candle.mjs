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
// blend two hex colors (t=0 → a, t=1 → b) — lets cream shadows stay WARM
// (toward caramel) instead of going grey via darken()
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (x, y) => Math.round(x + (y - x) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
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
  // lattice passes that follow the rosette pile: one over the crown swirl,
  // one across the front-row swirls; runs flow down into the crevices and
  // down the flanks, each ending in a rounded glossy bead — like sauce
  // actually poured over piped cream (see the waffle-sundae photo).
  const zigs = [
    domeZig(300, 236, 60, 6, 11, 14),
    domeZig(300, 298, 112, 9, 12, 20),
  ];
  const runs = [
    { d: "M195 299 q-8 18 -2 33 q3 8 -2 14", ex: 191, ey: 346 },
    { d: "M405 301 q9 18 3 34 q-3 8 2 13", ex: 410, ey: 348 },
    { d: "M262 296 q-5 12 -1 22", ex: 261, ey: 318 },
    { d: "M340 297 q6 12 2 24", ex: 342, ey: 321 },
    { d: "M240 250 q-6 10 -3 19", ex: 237, ey: 269 },
    { d: "M360 250 q7 10 4 20", ex: 364, ey: 270 },
  ];
  let out = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const d of zigs) {
    out += `<path d="${d}" stroke="#3A2C2A" stroke-opacity=".16" stroke-width="6.6" transform="translate(0 2.4)"/>`;
    out += `<path d="${d}" stroke="${hex}" stroke-width="5.4"/>`;
    out += `<path d="${d}" stroke="#fff" stroke-opacity=".42" stroke-width="1.6" transform="translate(-0.6 -1.4)"/>`;
  }
  for (const r of runs) {
    out += `<path d="${r.d}" stroke="#3A2C2A" stroke-opacity=".14" stroke-width="6.8" transform="translate(0 2)"/>`;
    out += `<path d="${r.d}" stroke="${hex}" stroke-width="5.6"/>`;
    out += `<path d="${r.d}" stroke="#fff" stroke-opacity=".3" stroke-width="1.4" transform="translate(-0.8 0)"/>`;
    out += `<circle cx="${r.ex}" cy="${r.ey}" r="4.8" fill="${hex}" stroke="none"/>`;
    out += `<circle cx="${r.ex - 1.4}" cy="${r.ey - 1.6}" r="1.5" fill="#fff" opacity=".5" stroke="none"/>`;
  }
  out += `</g>`;
  return out;
}

const CANDY = ["#E8A0C0", "#9ACBE0", "#F6E4B8", "#C4E0B0", "#E0A0A0", "#D9A0E0"];

// Scatter toppings across the cream dome (sprinkles/crumble/candy/pecans),
// placed toppings sit at nice spots (strawberry/cherry/orange/waffle/marsh).
function toppings(ids, onCream = true) {
  let out = "";
  // on the cream dome — or, with no whip, ON the wax surface at the mouth
  const placedSpots = onCream
    ? [
        { x: 234, y: 262 }, { x: 366, y: 266 }, { x: 300, y: 232 },
        { x: 198, y: 306 }, { x: 402, y: 308 }, { x: 300, y: 300 },
      ]
    : [
        { x: 252, y: 338 }, { x: 348, y: 342 }, { x: 300, y: 332 },
        { x: 214, y: 346 }, { x: 386, y: 346 }, { x: 300, y: 348 },
      ];
  let placedI = 0;
  ids.forEach((id, idx) => {
    if (["sprinkles", "crumble", "candy"].includes(id)) {
      out += scatter(id, idx, onCream);
    } else {
      const p = placedSpots[placedI++ % placedSpots.length];
      out += `<g filter="url(#tinyshadow)" transform="translate(${p.x} ${p.y})">${placed(id)}</g>`;
    }
  });
  return out;
}

function scatter(kind, seedIdx, onCream = true) {
  const r = rng(7 + seedIdx * 31);
  const n = kind === "sprinkles" ? 18 : kind === "crumble" ? 16 : 9;
  let out = `<g filter="url(#tinyshadow)">`;
  for (let i = 0; i < n; i++) {
    // within an ellipse over the dome (or flat on the wax pool with no whip)
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = 300 + Math.cos(a) * rad * 106;
    const y = (onCream ? 282 : 344) + Math.sin(a) * rad * (onCream ? 52 : 9);
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
    case "strawberry": {
      // plump berry: fat shoulders, dimpled seeds, leafy calyx + stem
      const seeds = [
        [-14, -6], [0, -9], [13, -5], [-8, 8], [7, 7], [-1, 21], [-19, 3], [18, 4],
      ].map(([x, y]) =>
        `<ellipse cx="${x}" cy="${y}" rx="1.9" ry="2.8" fill="#FBE7A0" stroke="#C98B2E" stroke-width=".5" transform="rotate(${x * 1.4} ${x} ${y})"/>`
      ).join("");
      return `<g transform="rotate(-10)">
        <path d="M0 -26 C20 -26 30 -12 27 4 C24 20 12 32 0 38 C-12 32 -24 20 -27 4 C-30 -12 -20 -26 0 -26 Z" fill="url(#berry)"/>
        <path d="M-18 -14 C-12 -21 -3 -24 6 -22 C-2 -27 -14 -23 -18 -14 Z" fill="#fff" opacity=".5"/>
        ${seeds}
        <path d="M0 -23 C-5 -30 -14 -33 -23 -30 C-16 -24 -8 -22 -2 -22 Z" fill="#4C8A44"/>
        <path d="M0 -23 C5 -30 14 -33 23 -30 C16 -24 8 -22 2 -22 Z" fill="#3F7A3A"/>
        <path d="M-2 -24 C-3 -31 -1 -36 2 -40 C4 -34 4 -28 2 -23 Z" fill="#579750"/>
        <path d="M2 -38 q3 -6 8 -8" stroke="#3F7A3A" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`;
    }
    case "blueberry":
      return `<g>
        <circle cx="0" cy="0" r="15" fill="url(#bberry)"/>
        <path d="M0 -6 l4.4 3.2 l-1.7 5.2 h-5.4 L-4.4 -2.8 z" fill="#26304F" opacity=".85"/>
        <ellipse cx="-6" cy="-7" rx="4.6" ry="3" fill="#AEBCD8" opacity=".75"/>
        <circle cx="21" cy="11" r="11.5" fill="url(#bberry)"/>
        <ellipse cx="17" cy="7" rx="3.4" ry="2.3" fill="#AEBCD8" opacity=".75"/>
      </g>`;
    case "orange-slice": {
      // juicy citrus wheel: rind, pith ring, flesh segments split by membranes
      let segs = "";
      const nseg = 9;
      for (let i = 0; i < nseg; i++) {
        const a = (i / nseg) * Math.PI * 2 - Math.PI / 2;
        const r0 = 13;
        const x1 = Math.cos(a - 0.30) * r0, y1 = Math.sin(a - 0.30) * r0;
        const x2 = Math.cos(a + 0.30) * r0, y2 = Math.sin(a + 0.30) * r0;
        segs += `<path d="M0 0 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r0} ${r0} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="url(#citrus)"/>`;
      }
      return `<g transform="rotate(-12)">
        <circle cx="0" cy="0" r="19" fill="#E1801F"/>
        <circle cx="0" cy="0" r="16.5" fill="#FBE7C4"/>
        <g>${segs}</g>
        <circle cx="0" cy="0" r="2.6" fill="#FBE7C4"/>
        <ellipse cx="-7" cy="-8" rx="6.5" ry="4.2" fill="#fff" opacity=".4"/>
      </g>`;
    }
    case "waffle": {
      // a thick PIECE of Belgian waffle (a quarter), stuck into the cream at a
      // lean like her sundaes — deep golden pockets + a visible edge thickness
      let px = "";
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          px += `<rect x="${-25 + c * 18}" y="${-25 + r * 18}" width="14" height="14" rx="4.5" fill="url(#pocket)"/>`;
      return `<g transform="rotate(-18)">
        <path d="M-29 18 Q0 28 29 18 L27 30 Q0 40 -27 30 Z" fill="#7E5626"/>
        <rect x="-30" y="-30" width="60" height="54" rx="13" fill="url(#waffleG)"/>
        ${px}
        <rect x="-30" y="-30" width="60" height="54" rx="13" fill="none" stroke="#8F6228" stroke-opacity=".45" stroke-width="1.8"/>
        <path d="M-24 -27 q24 -6 48 0" stroke="#FFE9B8" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/>
      </g>`;
    }
    case "marshmallow":
      // toasted marshmallow CUBE (her photos): charred top, dusted sides
      return `<g transform="rotate(-8)">
        <rect x="-16" y="-15" width="32" height="30" rx="5" fill="url(#toast)" stroke="#D8B98C" stroke-width="1"/>
        <path d="M-16 -8 Q0 -13 16 -8 L16 -15 Q16 -15 11 -15 L-11 -15 Q-16 -15 -16 -15 Z" fill="#8A5A33" opacity=".85"/>
        <path d="M-13 -10 Q0 -14 13 -10" fill="none" stroke="#4A2E16" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <circle cx="-6" cy="-11" r="1.8" fill="#3A2314"/><circle cx="5" cy="-12" r="1.4" fill="#3A2314"/>
        <circle cx="7" cy="5" r="1.3" fill="#C9A876" opacity=".8"/>
        <circle cx="-7" cy="9" r="1.1" fill="#C9A876" opacity=".7"/>
        <circle cx="1" cy="1" r="1" fill="#C9A876" opacity=".6"/>
        <path d="M-16 8 Q0 12 16 8" fill="none" stroke="#E8D8B8" stroke-width="1.6" opacity=".8"/>
      </g>`;
    case "banana":
      // banana slice (her banana-pudding tins): pale disc, seed flecks
      return `<g transform="rotate(-6)">
        <circle cx="0" cy="0" r="17" fill="#EFDC8C"/>
        <circle cx="0" cy="0" r="17" fill="none" stroke="#D9C06A" stroke-width="2.2"/>
        <circle cx="0" cy="0" r="12.5" fill="#F6EAB4"/>
        <circle cx="-3" cy="-2" r="1.7" fill="#6E4A2E"/><circle cx="3.5" cy="-1" r="1.3" fill="#6E4A2E"/>
        <circle cx="0" cy="4" r="1.4" fill="#6E4A2E"/>
        <ellipse cx="-5" cy="-6" rx="5" ry="3" fill="#fff" opacity=".4"/>
      </g>`;
    case "wafer":
      // glossy amber wafer/honey dome (her banana-pudding + apple-crisp tins)
      return `<g>
        <ellipse cx="0" cy="2" rx="19" ry="15" fill="url(#honeyblob)"/>
        <ellipse cx="0" cy="2" rx="19" ry="15" fill="none" stroke="#9A6A2C" stroke-opacity=".4" stroke-width="1.4"/>
        <ellipse cx="-6" cy="-4" rx="7" ry="4.6" fill="#fff" opacity=".42"/>
        <circle cx="6" cy="-2" r="1" fill="#FBE7C4" opacity=".8"/><circle cx="1" cy="6" r="1.2" fill="#FBE7C4" opacity=".7"/>
      </g>`;
    case "graham":
      // toffee/graham slab (her toasted-marshmallow candle): amber square slab
      return `<g transform="rotate(-14)">
        <rect x="-20" y="-16" width="40" height="32" rx="3" fill="#B8552E"/>
        <rect x="-22" y="-19" width="40" height="32" rx="3" fill="#CE6636"/>
        <rect x="-22" y="-19" width="40" height="32" rx="3" fill="none" stroke="#8F3D1E" stroke-opacity=".5" stroke-width="1.4"/>
        <path d="M-16 -13 q17 -4 30 0" stroke="#F0A468" stroke-width="2.4" opacity=".6" fill="none" stroke-linecap="round"/>
        <circle cx="-8" cy="-6" r="1.1" fill="#F6D8B8" opacity=".7"/><circle cx="6" cy="-1" r="1.3" fill="#F6D8B8" opacity=".6"/>
        <circle cx="-2" cy="6" r="1" fill="#F6D8B8" opacity=".65"/>
      </g>`;
    case "peppermint":
      // peppermint crumble shard (festive line): white shard, red stripes
      return `<g transform="rotate(-20)">
        <path d="M-16 -10 L14 -14 L18 8 L-8 14 Z" fill="#FDF8F4"/>
        <path d="M-16 -10 L14 -14 L18 8 L-8 14 Z" fill="none" stroke="#E3CFC8" stroke-width="1.2"/>
        <path d="M-10 -11 L-4 13 M0 -12.5 L6 12 M9 -13.5 L14 10" stroke="#C42C3E" stroke-width="4" stroke-linecap="round" opacity=".85"/>
        <ellipse cx="-4" cy="-6" rx="6" ry="3" fill="#fff" opacity=".6"/>
      </g>`;
    case "pecan":
      // pecan half: lobed oval, central groove, wrinkled ridges
      return `<g transform="rotate(-18)">
        <path d="M0 -15 C11 -15 16 -7 16 2 C16 11 9 16 0 16 C-9 16 -16 11 -16 2 C-16 -7 -11 -15 0 -15 Z" fill="url(#pecanG)"/>
        <path d="M0 -13 V13" stroke="#5A3A1E" stroke-width="2.4" opacity=".7"/>
        <path d="M-3 -11 C-9 -6 -9 6 -4 11" stroke="#6E4A28" stroke-width="1.3" fill="none" opacity=".55"/>
        <path d="M3 -11 C9 -6 9 6 4 11" stroke="#6E4A28" stroke-width="1.3" fill="none" opacity=".55"/>
        <path d="M-8 -8 C-12 -3 -12 5 -8 9" stroke="#6E4A28" stroke-width="1" fill="none" opacity=".4"/>
        <path d="M8 -8 C12 -3 12 5 8 9" stroke="#6E4A28" stroke-width="1" fill="none" opacity=".4"/>
        <ellipse cx="-6" cy="-8" rx="5.5" ry="4" fill="#fff" opacity=".22"/>
      </g>`;
    case "chocolate": {
      // glossy milk-chocolate bar chunk (2×2 segments)
      return `<g transform="rotate(-6)">
        <rect x="-22" y="-15" width="44" height="32" rx="4" fill="url(#choc)"/>
        <path d="M-22 1 H22 M0 -15 V17" stroke="#2E190E" stroke-width="2.4" opacity=".7"/>
        <rect x="-20" y="-13" width="18" height="12" rx="2" fill="#fff" opacity=".10"/>
        <rect x="2" y="-13" width="18" height="12" rx="2" fill="#fff" opacity=".06"/>
        <rect x="-20" y="-14" width="42" height="4" rx="2" fill="#fff" opacity=".16"/>
      </g>`;
    }
    case "honey": {
      // glossy honey / caramel dollop with a drip + bead
      return `<g>
        <ellipse cx="0" cy="0" rx="17" ry="14" fill="url(#honeyblob)"/>
        <path d="M6 12 q4 9 0 17 q-2 4 1 8" stroke="#C9862F" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="7" cy="36" r="4.5" fill="url(#honeyblob)"/>
        <ellipse cx="-5" cy="-5" rx="6.5" ry="4.5" fill="#fff" opacity=".55"/>
      </g>`;
    }
    case "cinnamon-roll": {
      // swirl bun with icing drizzle
      return `<g>
        <ellipse cx="0" cy="0" rx="21" ry="19" fill="url(#cinnabun)"/>
        <g fill="none" stroke="#8A5A2E" stroke-width="3.4" stroke-opacity=".82">
          <ellipse cx="1" cy="0" rx="5" ry="4.4"/>
          <ellipse cx="0" cy="0" rx="11" ry="9.6"/>
          <ellipse cx="-0.5" cy="0" rx="16.5" ry="14.6"/>
        </g>
        <ellipse cx="0" cy="0" rx="21" ry="19" fill="none" stroke="#8A5A2E" stroke-opacity=".5" stroke-width="1.6"/>
        <path d="M-15 -5 q15 7 30 0" stroke="#FFF6EA" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".92"/>
        <path d="M-11 4 q11 5 22 0" stroke="#FFF6EA" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="-7" cy="-7" rx="6" ry="4" fill="#fff" opacity=".3"/>
      </g>`;
    }
    case "honeycomb": {
      // a chunk of honeycomb — amber block of hexagonal cells + a honey drip
      const r = 8.6;
      const hexPath = (hx, hy) => {
        let p = "";
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 3;
          p += (i ? " L" : "M") + (hx + Math.cos(a) * r).toFixed(1) + " " + (hy + Math.sin(a) * r).toFixed(1);
        }
        return p + " Z";
      };
      const hs = Math.sqrt(3) * r, vs = 1.5 * r;
      let cells = "";
      for (let row = -1; row <= 1; row++)
        for (let col = -1; col <= 1; col++) {
          const hx = col * hs + (row & 1 ? hs / 2 : 0);
          const hy = row * vs;
          cells += `<path d="${hexPath(hx, hy)}" fill="#C88A33" stroke="#F4D27A" stroke-width="2"/>`;
          cells += `<circle cx="${hx}" cy="${hy}" r="3" fill="#8A5A22" opacity=".45"/>`;
        }
      return `<g transform="rotate(-7)">
        <rect x="-25" y="-23" width="50" height="46" rx="10" fill="url(#honeyblob)"/>
        <clipPath id="hcclip"><rect x="-25" y="-23" width="50" height="46" rx="10"/></clipPath>
        <g clip-path="url(#hcclip)">${cells}</g>
        <rect x="-25" y="-23" width="50" height="46" rx="10" fill="none" stroke="#9A6A2C" stroke-width="2" stroke-opacity=".6"/>
        <ellipse cx="-9" cy="-9" rx="11" ry="6" fill="#fff" opacity=".3"/>
        <path d="M9 22 q4 9 0 16 q-2 4 1 7" stroke="url(#honeyblob)" stroke-width="5.5" fill="none" stroke-linecap="round"/>
        <circle cx="10" cy="46" r="4.5" fill="url(#honeyblob)"/>
      </g>`;
    }
    case "apple": {
      // caramel-apple piece with leaf
      return `<g>
        <path d="M0 -11 q11 -4 16 6 q4 12 -6 18 q-9 4 -10 -3 q-1 7 -10 3 q-10 -6 -6 -18 q5 -10 16 -6 Z" fill="#D5473F"/>
        <ellipse cx="-4" cy="-3" rx="5" ry="7" fill="#F2988C" opacity=".55"/>
        <path d="M1 -11 q0 -6 3 -9" stroke="#6E4A2E" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M4 -19 q7 -3 10 2 q-6 5 -10 -2 Z" fill="#5E8A3A"/>
      </g>`;
    }
    case "cherry":
    default:
      return `<g>
        <path d="M2 -15 C10 -27 10 -39 4 -49" stroke="#5E7D3A" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M4 -49 q11 -3 17 6 q-11 5 -17 -6 z" fill="#6B8F45"/>
        <circle cx="0" cy="0" r="18" fill="url(#berry)"/>
        <path d="M0 -17 C3 -8 3 8 0 16" stroke="#8F1B2E" stroke-width="2" opacity=".45" fill="none"/>
        <ellipse cx="-7" cy="-8" rx="5.5" ry="4" fill="#fff" opacity=".6"/>
        <circle cx="2" cy="-15" r="2" fill="#7A1526"/>
      </g>`;
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
  if (vessel === "heart-tin") {
    // gold heart tin seen TOP-DOWN (her wax-melt photos): creamy piped wax
    // filling the heart, banana slice + glossy amber wafer domes + crumble
    // dust visible inside. Flameless.
    const heart = (s) =>
      `M300 ${370 + s} C${270 - s} ${330 - s} ${192 - s} ${334 - s} ${183 - s} ${398}` +
      ` C${176 - s} ${452 + s} ${240 - s / 2} ${500 + s} 300 ${534 + s}` +
      ` C${360 + s / 2} ${500 + s} ${424 + s} ${452 + s} ${417 + s} ${398}` +
      ` C${408 + s} ${334 - s} ${330 + s} ${330 - s} 300 ${370 + s} Z`;
    const cream = lighten(top, 0.12);
    const bumpShade = darken(top, 0.3);
    // piped dollop rows inside (soft bumps like her photo) — with real contrast
    let bumps = "";
    const rows = [
      [252, 402, 17], [300, 396, 19], [348, 402, 17], [226, 436, 15], [276, 442, 18],
      [326, 442, 18], [374, 436, 15], [252, 478, 15], [300, 486, 17], [348, 478, 15],
    ];
    for (const [bx, by, br] of rows) {
      bumps += `<ellipse cx="${bx}" cy="${by + br * 0.55}" rx="${br * 0.95}" ry="${br * 0.45}" fill="${bumpShade}" opacity=".3"/>`;
      bumps += `<circle cx="${bx}" cy="${by}" r="${br}" fill="${cream}"/>`;
      bumps += `<path d="M${bx - br * 0.6} ${by - br * 0.25} Q${bx} ${by - br * 0.95} ${bx + br * 0.6} ${by - br * 0.25}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2.2"/>`;
      bumps += `<path d="M${bx - br * 0.55} ${by + br * 0.4} Q${bx} ${by + br * 0.9} ${bx + br * 0.55} ${by + br * 0.4}" fill="none" stroke="${bumpShade}" stroke-opacity=".4" stroke-width="2.2"/>`;
    }
    // crumble dust
    let dust = "";
    const rr = rng(41);
    for (let i = 0; i < 26; i++) {
      const a = rr() * Math.PI * 2, rad = Math.sqrt(rr());
      const dx = 300 + Math.cos(a) * rad * 96, dy = 436 + Math.sin(a) * rad * 66;
      dust += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(1 + rr() * 1.6).toFixed(1)}" fill="#C89B62" opacity="${(0.5 + rr() * 0.4).toFixed(2)}"/>`;
    }
    return `
      <g transform="translate(300 452) scale(1.34) translate(-300 -442)">
      <g filter="url(#soft)"><path d="${heart(10)}" fill="#B8903A"/></g>
      <path d="${heart(10)}" fill="url(#goldMetal)"/>
      <path d="${heart(0)}" fill="#C9A23C"/>
      <path d="${heart(-7)}" fill="${top}"/>
      ${bumps}
      <clipPath id="htclip"><path d="${heart(-7)}"/></clipPath>
      <g clip-path="url(#htclip)">
        ${dust}
        <g filter="url(#tinyshadow)">
          <circle cx="252" cy="412" r="30" fill="#EFDC8C"/>
          <circle cx="252" cy="412" r="30" fill="none" stroke="#D9C06A" stroke-width="2.5"/>
          <circle cx="247" cy="408" r="2.2" fill="#6E4A2E"/><circle cx="257" cy="410" r="1.8" fill="#6E4A2E"/>
          <circle cx="251" cy="418" r="1.9" fill="#6E4A2E"/><circle cx="259" cy="417" r="1.4" fill="#6E4A2E"/>
        </g>
        <g filter="url(#tinyshadow)">
          <ellipse cx="342" cy="428" rx="42" ry="36" fill="url(#honeyblob)"/>
          <ellipse cx="330" cy="415" rx="13" ry="9" fill="#fff" opacity=".4"/>
        </g>
        <g filter="url(#tinyshadow)">
          <ellipse cx="276" cy="486" rx="33" ry="28" fill="url(#honeyblob)"/>
          <ellipse cx="267" cy="476" rx="10" ry="7" fill="#fff" opacity=".38"/>
        </g>
      </g>
      <path d="${heart(0)}" fill="none" stroke="#96712B" stroke-width="2.4" opacity=".7"/>
      <path d="M232 352 Q262 338 296 350" fill="none" stroke="#F6E3A0" stroke-width="3" opacity=".7" stroke-linecap="round"/>
      </g>`;
  }
  if (vessel === "wine") {
    // stemmed wine glass with translucent GEL + drips up the bowl (her "drink"
    // candles). No whip/mouth toppings — the pour IS the candle.
    const gel = top;
    const bowl = "M196 214 Q196 366 300 398 Q404 366 404 214 Z";
    let drips = "";
    for (const [x, y] of [[236, 236], [268, 224], [332, 226], [364, 238], [300, 220]]) {
      drips += `<path d="M${x} ${y} q${x < 300 ? -3 : 3} -${y - 196} ${x < 300 ? 1 : -1} -${y - 190}" stroke="${gel}" stroke-width="6.5" fill="none" stroke-linecap="round" opacity=".82"/>`;
      drips += `<circle cx="${x + (x < 300 ? -2 : 2)}" cy="${y - (y - 196) - 2}" r="4.6" fill="${gel}" opacity=".85"/>`;
    }
    return `
      <g filter="url(#soft)"><path d="${bowl}" fill="#ECE7E3" fill-opacity=".42"/></g>
      <clipPath id="wclip"><path d="M206 224 Q206 356 300 386 Q394 356 394 224 Z"/></clipPath>
      <g clip-path="url(#wclip)">
        <path d="M206 252 Q206 356 300 386 Q394 356 394 252 Z" fill="${gel}" fill-opacity=".82"/>
        <ellipse cx="300" cy="252" rx="94" ry="13" fill="${lighten(gel, 0.3)}" fill-opacity=".7"/>
        <circle cx="332" cy="300" r="7" fill="#fff" fill-opacity=".35"/>
        <circle cx="278" cy="330" r="5" fill="#fff" fill-opacity=".3"/>
        <circle cx="314" cy="348" r="4" fill="#fff" fill-opacity=".28"/>
        ${drips}
      </g>
      <path d="${bowl}" fill="url(#glass)"/>
      <path d="M214 226 Q216 324 292 364" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="300" cy="214" rx="104" ry="16" fill="#EDE7DF" fill-opacity=".7" stroke="#D2C8C1" stroke-width="2"/>
      <rect x="294" y="396" width="12" height="236" fill="#ECE7E3" fill-opacity=".55"/>
      <path d="M296 400 L296 626" stroke="#fff" stroke-opacity=".5" stroke-width="2.4"/>
      <ellipse cx="300" cy="636" rx="88" ry="15" fill="#EDE7DF" fill-opacity=".6" stroke="#D2C8C1" stroke-width="2"/>
      <ellipse cx="300" cy="632" rx="60" ry="8" fill="#fff" fill-opacity=".25"/>`;
  }
  // default: clean straight-sided glass tumbler (her jars are simple cylinders)
  return `
    <g filter="url(#soft)"><path d="M172 350 L172 616 Q172 648 204 648 L396 648 Q428 648 428 616 L428 350 Z" fill="#ECE7E3" fill-opacity=".5"/></g>
    <clipPath id="jclip"><path d="M186 392 L186 612 Q186 630 204 630 L396 630 Q414 630 414 612 L414 392 Z"/></clipPath>
    ${waxBands(layers, "jclip", 392, 630, 110)}
    <path d="M186 392 L186 612 Q186 630 204 630 L396 630 Q414 630 414 612 L414 392 Z" fill="url(#depth)"/>
    <path d="M172 350 L172 616 Q172 648 204 648 L396 648 Q428 648 428 616 L428 350 Z" fill="url(#glass)"/>
    <rect x="182" y="370" width="14" height="252" rx="7" fill="#fff" opacity=".5"/>
    <rect x="404" y="378" width="7" height="224" rx="3.5" fill="#fff" opacity=".2"/>
    <path d="M186 630 Q300 642 414 630" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <ellipse cx="300" cy="632" rx="112" ry="13" fill="#3A2C2A" opacity=".10"/>
    <ellipse cx="300" cy="350" rx="128" ry="19" fill="#E7E0DB" stroke="#D2C8C1" stroke-width="2"/>
    <ellipse cx="300" cy="350" rx="117" ry="14" fill="${top}" fill-opacity=".5"/>`;
}

// Soft-serve SWIRL — the "whipped topping" style: a single tall tapering
// spiral with piped ridge folds and a curled peak (distinct from the rosette
// pile and the ice-cream scoop). Base sits on the mouth (y≈348), peak ~y=132.
function swirl(hex) {
  const cx = 300;
  // fewer, FATTER coils — soft-serve ribbons, not stacked rings
  const tiers = [
    { y: 348, hw: 118, dx: 0 }, { y: 312, hw: 110, dx: -6 }, { y: 276, hw: 94, dx: 6 },
    { y: 242, hw: 74, dx: -6 }, { y: 210, hw: 52, dx: 5 }, { y: 182, hw: 31, dx: -4 },
    { y: 158, hw: 13, dx: 2 },
  ];
  const L = (t) => cx + t.dx - t.hw;
  const R = (t) => cx + t.dx + t.hw;
  let d = `M${L(tiers[0])} ${tiers[0].y}`;
  for (let i = 0; i < tiers.length - 1; i++) {
    const a = tiers[i], b = tiers[i + 1];
    const bulge = Math.max(a.hw, b.hw) + 27;
    d += ` Q${cx + (a.dx + b.dx) / 2 - bulge} ${(a.y + b.y) / 2} ${L(b)} ${b.y}`;
  }
  const top = tiers[tiers.length - 1];
  d += ` C${cx + top.dx - 7} ${top.y - 26} ${cx + top.dx + 16} ${top.y - 21} ${R(top)} ${top.y}`;
  for (let i = tiers.length - 1; i > 0; i--) {
    const a = tiers[i], b = tiers[i - 1];
    const bulge = Math.max(a.hw, b.hw) + 27;
    d += ` Q${cx + (a.dx + b.dx) / 2 + bulge} ${(a.y + b.y) / 2} ${R(b)} ${b.y}`;
  }
  d += " Z";
  let out = `<g filter="url(#soft)">`;
  out += `<ellipse cx="${cx}" cy="348" rx="126" ry="20" fill="#3A2C2A" opacity=".14"/>`;
  out += `<path d="${d}" fill="${hex}"/>`;
  out += `<path d="${d}" fill="url(#creamShade)"/>`;
  out += `</g>`;
  out += `<clipPath id="swirlclip"><path d="${d}"/></clipPath>`;
  out += `<g clip-path="url(#swirlclip)">`;
  out += `<ellipse cx="${cx - 34}" cy="248" rx="82" ry="116" fill="url(#creamHi)" opacity=".58"/>`;
  out += `<ellipse cx="${cx + 56}" cy="266" rx="52" ry="110" fill="#6B4A3F" opacity=".05"/>`;
  out += `</g>`;
  // spiralling ridge folds: each tier's fold drifts sideways so it reads as a
  // wound soft-serve swirl rather than stacked rings
  for (let i = 0; i < tiers.length - 1; i++) {
    const t = tiers[i];
    const drift = (i % 2 ? 1 : -1) * t.hw * 0.14;
    const w = t.hw * 0.86;
    const sag = 17 - i * 1.4;
    // deep tuck under each fat coil + a broad catchlight on its crown
    out += `<path d="M${cx + t.dx - w + drift} ${t.y - 1} Q${cx + t.dx + drift} ${t.y + sag} ${cx + t.dx + w + drift} ${t.y - 1}" fill="none" stroke="#6B4A3F" stroke-opacity=".14" stroke-width="${9 - i * 0.7}" stroke-linecap="round"/>`;
    out += `<path d="M${cx + t.dx - w * 0.9 + drift} ${t.y - 9} Q${cx + t.dx + drift} ${t.y + sag - 12} ${cx + t.dx + w * 0.9 + drift} ${t.y - 9}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  return out;
}

// Sculpted wax ROSE (her "White Tea & Rose" candle) — a carved bloom filling
// the mouth: three rings of petals closing into a tight spiral center.
function rose(hex) {
  // Face-on carved rose: cupped petals wrapping a spiral heart, plus a row of
  // opened outer petals sagging over the jar mouth — like her sculpted candle.
  const cx = 300, cy = 268, R = 78;
  const deep = darken(hex, 0.24);
  const dim = darken(hex, 0.1);
  const edge = lighten(hex, 0.42);
  let g = `<g filter="url(#soft)">`;
  g += `<ellipse cx="${cx}" cy="350" rx="112" ry="15" fill="#3A2C2A" opacity=".13"/>`;
  // opened OUTER petals: broad cupped lobes ringing the bloom, sagging outward
  const outer = [
    [-96, 26, 52, 38, -38], [-58, 62, 54, 40, -16], [0, 74, 58, 40, 0],
    [58, 62, 54, 40, 16], [96, 26, 52, 38, 38], [-88, -28, 48, 36, -64], [88, -28, 48, 36, 64],
    [-50, -62, 46, 34, -28], [50, -62, 46, 34, 28],
  ];
  for (const [dx, dy, rx, ry, rot] of outer) {
    g += `<g transform="translate(${cx + dx} ${cy + dy}) rotate(${rot})">`;
    g += `<path d="M${-rx} 0 Q${-rx} ${-ry} 0 ${-ry} Q${rx} ${-ry} ${rx} 0 Q${rx * 0.7} ${ry * 0.72} 0 ${ry * 0.8} Q${-rx * 0.7} ${ry * 0.72} ${-rx} 0 Z" fill="${dim}"/>`;
    g += `<path d="M${-rx * 0.86} ${-ry * 0.1} Q0 ${-ry * 0.95} ${rx * 0.86} ${-ry * 0.1}" fill="none" stroke="${edge}" stroke-opacity=".6" stroke-width="2.2"/>`;
    g += `</g>`;
  }
  // bloom face: a disc of wrapped petals
  g += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${hex}"/>`;
  g += `</g>`;
  // wrapped-petal arcs spiraling into the heart (carved look)
  g += `<g fill="none" stroke-linecap="round">`;
  const wraps = [
    [R - 12, -30, 205], [R - 26, 130, 190], [R - 40, 305, 200],
    [R - 52, 80, 185], [R - 62, 250, 190],
  ];
  for (const [r, a0, sweep] of wraps) {
    const a1 = ((a0 + sweep) * Math.PI) / 180, a0r = (a0 * Math.PI) / 180;
    const x0 = cx + Math.cos(a0r) * r, y0 = cy + Math.sin(a0r) * r;
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    const large = sweep > 180 ? 1 : 0;
    g += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${deep}" stroke-opacity=".5" stroke-width="3.4"/>`;
    g += `<path d="M${x0.toFixed(1)} ${(y0 - 2.4).toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${(y1 - 2.4).toFixed(1)}" stroke="${edge}" stroke-opacity=".5" stroke-width="1.6"/>`;
  }
  g += `</g>`;
  // scalloped rim of the bloom face (petal lobes on the edge)
  g += `<g fill="none">`;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const x = cx + Math.cos(a) * (R - 3), y = cy + Math.sin(a) * (R - 3);
    const px = Math.cos(a + Math.PI / 2) * 26, py = Math.sin(a + Math.PI / 2) * 26;
    g += `<path d="M${(x - px).toFixed(1)} ${(y - py).toFixed(1)} Q${(cx + Math.cos(a) * (R + 9)).toFixed(1)} ${(cy + Math.sin(a) * (R + 9)).toFixed(1)} ${(x + px).toFixed(1)} ${(y + py).toFixed(1)}" stroke="${deep}" stroke-opacity=".32" stroke-width="2.6"/>`;
  }
  g += `</g>`;
  // spiral heart
  g += `<circle cx="${cx}" cy="${cy}" r="14" fill="${hex}"/>`;
  g += `<path d="M${cx - 9} ${cy - 2} a9 8 0 1 1 9 9 a6 5.5 0 1 1 5 -8 a3.4 3 0 1 0 -4 4" fill="none" stroke="${deep}" stroke-width="3" stroke-linecap="round"/>`;
  // soft light, clipped to the bloom
  g += `<clipPath id="roseclip"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`;
  g += `<g clip-path="url(#roseclip)"><ellipse cx="${cx - 26}" cy="${cy - 34}" rx="46" ry="34" fill="url(#roseHi)" opacity=".45"/></g>`;
  return g;
}

// Single round ice-cream SCOOP (her waffle sundaes) — a soft ball with a
// scalloped scooped edge, sitting on the vessel mouth / waffle base (base y≈348,
// crown ~y=218 so the wick still roots above it). An alternative to the rosette
// pile; same footprint so it drops onto any vessel.
function scoop(hex) {
  // Watercolor ice-cream scoop (ref: wide dome, wider than tall; rough crumbly
  // scooped edge at the base; short marble streaks following the dome curve).
  const cx = 300, baseY = 348, RX = 118, RY = 152;
  const shadow = darken(hex, 0.18);
  const deep = darken(hex, 0.3);
  const lite = lighten(hex, 0.45);
  // — irregular dome silhouette: wobbled radii over 180°, apex ~y=196 —
  const wob = [0, 0.02, -0.012, 0.03, -0.018, 0.016, 0.026, -0.014, 0.024, -0.018, 0.02, -0.012, 0];
  const pts = wob.map((w, i) => {
    const a = Math.PI - (i / (wob.length - 1)) * Math.PI; // 180° → 0°
    return [cx + Math.cos(a) * RX * (1 + w), baseY - Math.sin(a) * RY * (1 + w) * 0.985];
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i];
    d += ` Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
    if (i === pts.length - 1) d += ` T${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  // — rough crumbly base edge: chunky bumps, right → left, hugging the rim —
  const crumbs = [[26, 10], [22, 6], [30, 13], [24, 8], [34, 12], [26, 7], [24, 11], [30, 8]];
  let x = cx + RX;
  d += ` L${x.toFixed(1)} ${baseY}`;
  for (const [w, dip] of crumbs) {
    const nx = Math.max(cx - RX, x - w);
    d += ` Q${((x + nx) / 2).toFixed(1)} ${(baseY + dip).toFixed(1)} ${nx.toFixed(1)} ${(baseY + (dip > 9 ? 3 : 1)).toFixed(1)}`;
    x = nx;
    if (x <= cx - RX) break;
  }
  d += " Z";
  let g = `<g filter="url(#soft)">`;
  g += `<ellipse cx="${cx}" cy="${baseY + 6}" rx="112" ry="14" fill="#3A2C2A" opacity=".13"/>`;
  g += `<path d="${d}" fill="${hex}"/>`;
  g += `<path d="${d}" fill="url(#creamShade)"/>`;
  g += `</g>`;
  // — churned marble: short broken streaks that FOLLOW the dome curvature —
  g += `<clipPath id="scoopclip"><path d="${d}"/></clipPath>`;
  g += `<g clip-path="url(#scoopclip)">`;
  // warm settled tone in the lower third + bolder marble pools (ref look)
  g += `<ellipse cx="${cx}" cy="${baseY - 18}" rx="${RX}" ry="52" fill="${shadow}" opacity=".18"/>`;
  g += `<g filter="url(#softblur)">`;
  g += `<ellipse cx="${cx - 40}" cy="302" rx="36" ry="24" fill="${deep}" opacity=".13"/>`;
  g += `<ellipse cx="${cx + 46}" cy="322" rx="32" ry="20" fill="${deep}" opacity=".11"/>`;
  g += `<ellipse cx="${cx + 20}" cy="252" rx="30" ry="18" fill="${deep}" opacity=".09"/>`;
  g += `</g>`;
  // curved streaks: [x0,y0, qx,qy, x1,y1, color, opacity, width, blur?]
  const streaks = [
    [cx - 74, 262, cx - 34, 250, cx - 2, 258, deep, 0.20, 6, 1],
    [cx + 12, 244, cx + 52, 238, cx + 84, 254, deep, 0.16, 5, 1],
    [cx - 88, 300, cx - 44, 292, cx - 8, 300, shadow, 0.24, 7, 1],
    [cx + 6, 296, cx + 54, 288, cx + 96, 302, shadow, 0.2, 6, 1],
    [cx - 62, 330, cx - 12, 324, cx + 40, 332, deep, 0.18, 6, 1],
    [cx - 58, 234, cx - 28, 224, cx + 4, 230, "#ffffff", 0.4, 4, 0],
    [cx - 84, 276, cx - 50, 268, cx - 18, 274, "#ffffff", 0.3, 3, 0],
    [cx + 26, 268, cx + 58, 262, cx + 86, 272, "#ffffff", 0.26, 3.5, 0],
    [cx - 30, 312, cx + 6, 306, cx + 42, 312, "#ffffff", 0.22, 3, 0],
  ];
  let blurred = "", crisp = "";
  for (const [x0, y0, qx, qy, x1, y1, c, o, w, b] of streaks) {
    const p = `<path d="M${x0} ${y0} Q${qx} ${qy} ${x1} ${y1}" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
    if (b) blurred += p; else crisp += p;
  }
  g += `<g filter="url(#softblur)">${blurred}</g>${crisp}`;
  // churn speckles
  const dabs = [
    [cx - 44, 246, 4, deep, 0.16], [cx + 30, 236, 3.4, deep, 0.14], [cx + 66, 284, 4.4, deep, 0.15],
    [cx - 70, 312, 3.6, deep, 0.14], [cx + 8, 276, 3, deep, 0.12], [cx - 20, 288, 2.6, "#ffffff", 0.3],
    [cx + 48, 250, 3, "#ffffff", 0.28], [cx - 52, 270, 2.4, "#ffffff", 0.26], [cx + 74, 316, 3.2, "#ffffff", 0.2],
    [cx - 6, 330, 2.8, "#ffffff", 0.22],
  ];
  for (const [px, py, r, c, o] of dabs) g += `<circle cx="${px}" cy="${py}" r="${r}" fill="${c}" opacity="${o}"/>`;
  // crumbly edge shading: small tonal pockets right at the base bumps
  g += `<g filter="url(#softblur)">`;
  g += `<ellipse cx="${cx - 62}" cy="${baseY - 4}" rx="20" ry="9" fill="${deep}" opacity=".14"/>`;
  g += `<ellipse cx="${cx + 8}" cy="${baseY - 2}" rx="24" ry="9" fill="${deep}" opacity=".12"/>`;
  g += `<ellipse cx="${cx + 74}" cy="${baseY - 5}" rx="18" ry="8" fill="${deep}" opacity=".13"/>`;
  g += `</g>`;
  g += `</g>`;
  // — volume: broad soft highlight upper-left, crescent shade lower-right —
  // (clipped to the dome so nothing bleeds outside the silhouette)
  g += `<g clip-path="url(#scoopclip)">`;
  g += `<ellipse cx="${cx - 34}" cy="248" rx="56" ry="44" fill="url(#roseHi)" opacity=".6"/>`;
  g += `<ellipse cx="${cx - 12}" cy="222" rx="20" ry="12" fill="${lite}" opacity=".55"/>`;
  g += `<ellipse cx="${cx + 52}" cy="300" rx="42" ry="52" fill="${shadow}" opacity=".12"/>`;
  g += `</g>`;
  return g;
}

// Round Belgian WAFFLE disc at the cup mouth — the base her sundae scoop sits
// on. Foreshortened grid pockets, golden, with a little edge thickness.
function waffleBase() {
  const cx = 300, cy = 348, rx = 116, ry = 30;
  let g = `<g filter="url(#soft)">`;
  g += `<path d="M${cx - rx} ${cy} A${rx} ${ry} 0 0 0 ${cx + rx} ${cy} L${cx + rx} ${cy + 15} A${rx} ${ry} 0 0 1 ${cx - rx} ${cy + 15} Z" fill="#8F6228"/>`;
  g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#waffleG)"/>`;
  g += `<clipPath id="wbclip"><ellipse cx="${cx}" cy="${cy}" rx="${rx - 3}" ry="${ry - 2}"/></clipPath>`;
  g += `<g clip-path="url(#wbclip)">`;
  for (let r = -2; r <= 2; r++)
    for (let c = -3; c <= 3; c++) {
      const x = cx + c * 31, y = cy + r * 12.5;
      g += `<rect x="${x - 12.5}" y="${y - 5}" width="25" height="10" rx="4" fill="url(#pocket)"/>`;
    }
  g += `</g>`;
  g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#8F6228" stroke-opacity=".4" stroke-width="1.5"/>`;
  g += `</g>`;
  return g;
}

export function candleSVG(opts = {}) {
  const {
    waxHex = "#F0D9AE",
    whipHex = "#FBF3E4",
    drizzleId = "caramel",
    hasDrizzle = true,
    hasWhip = true,
    whipStyle = "rosette", // "rosette" (piped pile) | "scoop" (sundae ball)
    hasWaffleBase = false,
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
    <radialGradient id="roseHi" cx="38%" cy="32%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="waffleG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EFC97F"/><stop offset="1" stop-color="#C08A44"/></linearGradient>
    <radialGradient id="pocket" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#7E5524"/><stop offset=".7" stop-color="#96682C"/><stop offset="1" stop-color="#BE8B41"/></radialGradient>
    <radialGradient id="bberry" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8B9AC4"/><stop offset="1" stop-color="#3A4C80"/></radialGradient>
    <linearGradient id="toast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF2E0"/><stop offset=".6" stop-color="#F3E3C6"/><stop offset="1" stop-color="#D9AC6E"/></linearGradient>
    <linearGradient id="choc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6E4A30"/><stop offset="1" stop-color="#3F2416"/></linearGradient>
    <radialGradient id="honeyblob" cx="38%" cy="30%" r="72%"><stop offset="0" stop-color="#F4C65E"/><stop offset="1" stop-color="#B5763C"/></radialGradient>
    <radialGradient id="cinnabun" cx="42%" cy="34%" r="74%"><stop offset="0" stop-color="#E3AC62"/><stop offset="1" stop-color="#A5692F"/></radialGradient>
    <radialGradient id="gelsheen" cx="40%" cy="26%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="pecanG" cx="40%" cy="32%" r="74%"><stop offset="0" stop-color="#B27E48"/><stop offset="1" stop-color="#7C4F27"/></radialGradient>
    <linearGradient id="goldMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6E3A0"/><stop offset=".24" stop-color="#E7C874"/><stop offset=".55" stop-color="#D9B44A"/><stop offset=".84" stop-color="#B8903A"/><stop offset="1" stop-color="#96712B"/></linearGradient>
    <radialGradient id="citrus" cx="42%" cy="34%" r="72%"><stop offset="0" stop-color="#FBC55A"/><stop offset="1" stop-color="#EE9A2E"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F8D89A" stop-opacity=".8"/><stop offset="55%" stop-color="#F0C0A0" stop-opacity=".25"/><stop offset="100%" stop-color="#F0C0A0" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#3A2C2A" flood-opacity=".18"/></filter>
    <filter id="tinyshadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#3A2C2A" flood-opacity=".3"/></filter>
    <filter id="flameSoft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="softblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4.5"/></filter>
    <linearGradient id="bandTone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity=".04"/><stop offset=".85" stop-color="#3A2C2A" stop-opacity=".05"/><stop offset="1" stop-color="#3A2C2A" stop-opacity=".14"/></linearGradient>
    <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A2C2A" stop-opacity=".22"/><stop offset=".12" stop-color="#fff" stop-opacity=".22"/><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset=".76" stop-color="#3A2C2A" stop-opacity="0"/><stop offset="1" stop-color="#3A2C2A" stop-opacity=".26"/></linearGradient>
    <linearGradient id="surfGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEFCF" stop-opacity=".55"/><stop offset="1" stop-color="#FFEFCF" stop-opacity="0"/></linearGradient>
    <linearGradient id="flameOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C158"/><stop offset="1" stop-color="#EE8F35"/></linearGradient>
    <radialGradient id="flameCore" cx="50%" cy="72%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#F8E6B0"/><stop offset="1" stop-color="#F8E6B0" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="600" height="740" fill="url(#bg)"/>
  <g transform="translate(300 650) scale(${opts.scale ?? 1}) translate(-300 -650)">
  ${(opts.vessel || "jar") === "heart-tin" ? "" : `<ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".16"/>`}
  ${vesselArt(opts.vessel || "jar", opts.layers || [waxHex])}
  ${hasWaffleBase ? waffleBase() : ""}
  ${hasWhip ? (whipStyle === "scoop" ? scoop(whipHex) : whipStyle === "swirl" ? swirl(whipHex) : whipStyle === "rose" ? rose(whipHex) : cream(whipHex)) : ""}
  ${hasDrizzle ? drizzle(DRIP[drizzleId] || DRIP.caramel) : ""}
  ${toppings(toppingIds, hasWhip)}
  ${(opts.vessel || "jar") === "heart-tin" ? "" : `<g transform="translate(0 ${(opts.vessel || "jar") === "wine" ? 96 : 0})">
  <circle cx="300" cy="118" r="78" fill="url(#glow)"/>
  <rect x="297.2" y="118" width="5.6" height="${hasWhip && (whipStyle === "scoop" || whipStyle === "rose") ? 88 : 40}" rx="2.8" fill="#EFE4CE"/>
  <path d="M300 124 l-2 5 l2 5 l-2 5 l2 5 l-2 5 l2 5" stroke="#C9B893" stroke-width="1.2" fill="none"/>
  <rect x="297.2" y="118" width="5.6" height="9" rx="2.8" fill="#4A3A2E"/>
  <g filter="url(#flameSoft)">
    <path d="M300 42 C325 72 324 102 300 126 C276 102 275 72 300 42 Z" fill="url(#flameOut)"/>
  </g>
  <path d="M300 64 C315 84 314 104 300 122 C286 104 285 84 300 64 Z" fill="url(#flameCore)"/>
  <ellipse cx="300" cy="119" rx="4.6" ry="7" fill="#8FB6F2" opacity=".55"/>
  </g>`}
  </g>
</svg>`;
}

// Piped whipped cream — her signature: a MOUND of star-tip PIPED SWIRLS
// (like the icing swirls in her photos: wrapped ribbon bands with parallel
// piping grooves, curling to a soft peak). Composed back-to-front into a pile
// sitting on the vessel mouth (base y≈348), crown swirl meeting the wick.
function cream(whipHex) {
  const cx = 300;

  // one piped swirl on (0,0): base ~y=12, curled tip ~y=-78, half-width ~47
  const rosette = (shade = 0) => {
    const body = shade ? mix(whipHex, "#C69B72", shade) : whipHex;
    const tuck = mix(body, "#8A5F46", 0.48);
    let g = `<ellipse cx="0" cy="9" rx="44" ry="8" fill="#8A5F46" opacity=".16"/>`;
    // BASE WRAP — the widest ribbon, bulging at the front
    g += `<path d="M-46 -10 Q-50 6 -30 11 Q0 16 30 11 Q50 6 46 -10 Q46 -22 26 -27 Q0 -31 -26 -27 Q-46 -22 -46 -10 Z" fill="${body}"/>`;
    // star-tip grooves along the ribbon
    g += `<path d="M-42 -3 Q0 11 42 -3" fill="none" stroke="${tuck}" stroke-opacity=".3" stroke-width="1.8" stroke-linecap="round"/>`;
    g += `<path d="M-38 -8 Q0 5 38 -8" fill="none" stroke="${tuck}" stroke-opacity=".26" stroke-width="1.7" stroke-linecap="round"/>`;
    g += `<path d="M-32 -14 Q0 -3 32 -14" fill="none" stroke="${tuck}" stroke-opacity=".2" stroke-width="1.6" stroke-linecap="round"/>`;
    g += `<path d="M-28 -21 Q0 -27 28 -21" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/>`;
    // MIDDLE WRAP — sweeps right→left so the spiral direction reads
    g += `<path d="M-40 -20 Q-47 -39 -22 -46 Q8 -53 30 -44 Q45 -37 40 -25 Q37 -17 26 -20 Q4 -33 -20 -29 Q-34 -26 -40 -20 Z" fill="${body}"/>`;
    g += `<path d="M-34 -26 Q0 -40 33 -28" fill="none" stroke="${tuck}" stroke-opacity=".28" stroke-width="1.7" stroke-linecap="round"/>`;
    g += `<path d="M-28 -32 Q-1 -44 27 -34" fill="none" stroke="${tuck}" stroke-opacity=".22" stroke-width="1.6" stroke-linecap="round"/>`;
    g += `<path d="M-23 -39 Q-1 -48 21 -40" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="1.9" stroke-linecap="round"/>`;
    // TOP CURL — a comma wrapping up to the tip
    g += `<path d="M-23 -37 Q-29 -57 -7 -64 Q12 -69 21 -58 Q25 -50 15 -46 Q7 -56 -5 -52 Q-17 -48 -23 -37 Z" fill="${body}"/>`;
    g += `<path d="M-17 -46 Q-4 -58 13 -52" fill="none" stroke="${tuck}" stroke-opacity=".26" stroke-width="1.6" stroke-linecap="round"/>`;
    g += `<path d="M-13 -52 Q-2 -60 9 -55" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.7" stroke-linecap="round"/>`;
    // soft peak flick
    g += `<path d="M0 -60 Q6 -70 -2 -78 Q2 -68 -4 -60 Q-2 -56 0 -60 Z" fill="${body}"/>`;
    // sheen
    g += `<ellipse cx="-10" cy="-38" rx="20" ry="16" fill="url(#roseHi)" opacity=".5"/>`;
    return g;
  };
  const put = (x, y, sx, sy, rot, shade = 0) =>
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})">${rosette(shade)}</g>`;

  let out = `<g filter="url(#soft)">`;
  // contact shadow on the rim
  out += `<ellipse cx="${cx}" cy="349" rx="124" ry="17" fill="#3A2C2A" opacity=".13"/>`;
  // backdrop mass: fills any gap between swirls; darker = crevice depth
  out += `<path d="M198 352 Q204 276 300 262 Q396 276 402 352 Z" fill="${mix(whipHex, "#C69B72", 0.22)}"/>`;
  // back row (in shadow, peeking between the front swirls)
  out += put(240, 320, 0.8, 0.8, -5, 0.09);
  out += put(360, 320, 0.8, 0.8, 5, 0.09);
  // small filler swirls tucked into the wedge between crown and back row —
  // her piles are packed, no flat wax showing between swirls
  out += put(266, 290, 0.56, 0.54, -10, 0.05);
  out += put(336, 290, 0.56, 0.54, 10, 0.05);
  // front row, bases resting on the mouth / sagging just over the rim —
  // sizes and tilts vary like hand piping
  out += put(219, 351, 0.88, 0.88, -7);
  out += put(381, 351, 0.9, 0.88, 6);
  out += put(300, 357, 1.0, 0.96, -3);
  // crown swirl — a touch taller, the one the wick rises from
  out += put(300, 262, 1.04, 1.12, 3);
  out += `</g>`;
  // (volume comes from the per-rosette highlights — no unclipped halo ovals)
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
  writeFileSync(new URL(`../${label}.png`, import.meta.url), new Resvg(svg, { fitTo: { mode: "width", value: 640 * list.length } }).render().asPng());
}

// Distinct vessels test.
board([
  { name: "Rose", vessel: "jar", layers: ["#F3E9DD"], whipStyle: "rose", whipHex: "#EFA8B8", hasDrizzle: false, toppingIds: [] },
  { name: "Sundae Scoop", vessel: "dessert", layers: ["#EBB7BE", "#F4E4C9"], whipStyle: "scoop", whipHex: "#F3E7C9", drizzleId: "berry", toppingIds: ["waffle"] },
  { name: "Swirl + Peppermint", vessel: "tin", layers: ["#F4E4C9"], whipStyle: "swirl", whipHex: "#FBF3E4", hasDrizzle: false, toppingIds: ["peppermint", "crumble"] },
  { name: "Banana Tin", vessel: "heart-tin", layers: ["#FBF3E4"], hasWhip: false, hasDrizzle: false, toppingIds: [] },
], "candle-preview");
console.log("wrote candle-preview.png");
