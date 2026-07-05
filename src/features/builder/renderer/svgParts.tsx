import { motion } from "motion/react";
import { SPRING } from "@/lib/motionPresets";

/*
  Semi-realistic candle art (viewBox 600×740), parametric on ingredient colors.
  Designed offline with a rasterizer (scripts/preview-candle.mjs) so the forms
  and shading are verified, then ported here with the Confiserie animations.
  One shared camera framing so every combination reads as one illustration.
*/

export const VIEW = { w: 600, h: 740 };
/** Where cream/toppings sit, and where the wick roots. */
export const MOUTH = { cx: 300, cy: 350 };

/** Mix a hex color toward white / black — wax surface pools & sheens. */
function lighten(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v + (255 - v) * t);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
function darken(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(v * (1 - t));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function GlowDefs() {
  return (
    <defs>
      <linearGradient id="cglass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
        <stop offset=".16" stopColor="#ffffff" stopOpacity=".10" />
        <stop offset=".5" stopColor="#e9e2dd" stopOpacity=".05" />
        <stop offset=".84" stopColor="#9b908a" stopOpacity=".10" />
        <stop offset="1" stopColor="#8c817b" stopOpacity=".22" />
      </linearGradient>
      <linearGradient id="cdepth" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".18" />
        <stop offset=".5" stopColor="#3A2C2A" stopOpacity="0" />
        <stop offset="1" stopColor="#3A2C2A" stopOpacity=".22" />
      </linearGradient>
      <linearGradient id="cmetal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#fff" stopOpacity=".5" />
        <stop offset=".2" stopColor="#E9E2DA" stopOpacity=".2" />
        <stop offset=".5" stopColor="#CFC7BE" stopOpacity="0" />
        <stop offset=".82" stopColor="#A89E92" stopOpacity=".25" />
        <stop offset="1" stopColor="#8c817b" stopOpacity=".4" />
      </linearGradient>
      <radialGradient id="ccreamHi" cx="38%" cy="26%" r="60%">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ccreamShade" cx="50%" cy="18%" r="95%">
        <stop offset="58%" stopColor="#6B4A3F" stopOpacity="0" />
        <stop offset="100%" stopColor="#6B4A3F" stopOpacity=".13" />
      </radialGradient>
      <linearGradient id="cbandTone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".28" />
        <stop offset=".35" stopColor="#fff" stopOpacity=".04" />
        <stop offset=".85" stopColor="#3A2C2A" stopOpacity=".05" />
        <stop offset="1" stopColor="#3A2C2A" stopOpacity=".14" />
      </linearGradient>
      <linearGradient id="ccyl" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3A2C2A" stopOpacity=".22" />
        <stop offset=".12" stopColor="#fff" stopOpacity=".22" />
        <stop offset=".32" stopColor="#fff" stopOpacity="0" />
        <stop offset=".76" stopColor="#3A2C2A" stopOpacity="0" />
        <stop offset="1" stopColor="#3A2C2A" stopOpacity=".26" />
      </linearGradient>
      <linearGradient id="cflameOut" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6C158" />
        <stop offset="1" stopColor="#EE8F35" />
      </linearGradient>
      <radialGradient id="cflameCore" cx="50%" cy="72%" r="60%">
        <stop offset="0" stopColor="#fff" />
        <stop offset=".55" stopColor="#F8E6B0" />
        <stop offset="1" stopColor="#F8E6B0" stopOpacity="0" />
      </radialGradient>
      <filter id="cflameSoft" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="1.4" />
      </filter>
      <radialGradient id="cglow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#F8D89A" stopOpacity=".8" />
        <stop offset="55%" stopColor="#F0C0A0" stopOpacity=".25" />
        <stop offset="100%" stopColor="#F0C0A0" stopOpacity="0" />
      </radialGradient>
      <filter id="csoft" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#3A2C2A" floodOpacity=".18" />
      </filter>
      <filter id="ctiny" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3A2C2A" floodOpacity=".3" />
      </filter>
      <clipPath id="cwaxclip">
        <path d={JAR_WAX} />
      </clipPath>
      <clipPath id="cdclip">
        <path d="M186 364 Q196 462 300 492 Q404 462 414 364 Z" />
      </clipPath>
    </defs>
  );
}

export function SurfaceShadow() {
  return <ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".15" />;
}

/* ── Jar (glass + animated wax pour). Used for soy vessels. ───────────── */
const JAR_GLASS = "M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z";
const JAR_WAX = "M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z";

/**
 * Stacked wax layers (parfait look) with real depth: per-band tonal gradient,
 * cylindrical side shading, wavy hand-poured seams, and an elliptical SURFACE
 * pool at the fill line — wax, not painted rectangles. (Design verified in the
 * offline rig, scripts/preview-candle.mjs.)
 */
function WaxBands({ layers, clipId = "cwaxclip", top = 392, bottom = 632, topRx = 112 }: { layers: string[]; clipId?: string; top?: number; bottom?: number; topRx?: number }) {
  const bandH = (bottom - top) / layers.length;
  const topHex = layers[layers.length - 1];
  return (
    <g clipPath={`url(#${clipId})`}>
      {layers.map((hex, i) => {
        const y = bottom - bandH * (i + 1);
        return (
          <g key={i}>
            <rect x="120" y={y} width="360" height={bandH + 2} fill={hex} />
            <rect x="120" y={y} width="360" height={bandH + 2} fill="url(#cbandTone)" />
          </g>
        );
      })}
      {layers.slice(1).map((_, idx) => {
        const y = bottom - bandH * (idx + 1);
        return (
          <g key={`sep${idx}`}>
            <path d={`M120 ${y} q60 5 150 1 t210 -2 v6 q-120 4 -210 2 t-150 -1 z`} fill="#3A2C2A" opacity=".08" />
            <path d={`M120 ${y - 2} q60 5 150 1 t210 -2`} fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.6" />
          </g>
        );
      })}
      <rect x="120" y={top} width="360" height={bottom - top} fill="url(#ccyl)" />
      {/* surface pool + meniscus + sheen */}
      <ellipse cx="300" cy={top + 9} rx={topRx + 8} ry="19" fill={darken(topHex, 0.14)} />
      <ellipse cx="300" cy={top + 4} rx={topRx + 2} ry="16" fill={lighten(topHex, 0.38)} />
      <ellipse cx="270" cy={top + 1} rx={topRx * 0.42} ry="7" fill={lighten(topHex, 0.62)} opacity=".9" />
    </g>
  );
}

/** Opaque metal tin — branded label band; the mouth shows a true wax surface. */
export function TinVessel({ topColor }: { topColor: string }) {
  return (
    <g>
      <g filter="url(#csoft)">
        <path d="M174 356 L174 632 Q174 648 190 648 L410 648 Q426 648 426 632 L426 356 Z" fill="#D8CFC4" />
      </g>
      <rect x="174" y="356" width="252" height="290" fill="url(#cmetal)" />
      <rect x="186" y="362" width="14" height="280" fill="#fff" opacity=".4" />
      <rect x="398" y="368" width="7" height="268" fill="#3A2C2A" opacity=".08" />
      <rect x="174" y="452" width="252" height="96" rx="6" fill="#FBF6EE" opacity=".55" />
      <rect x="174" y="452" width="252" height="96" rx="6" fill="none" stroke="#C9A96A" strokeOpacity=".5" strokeWidth="1.6" />
      <text x="300" y="496" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="21" letterSpacing="4" fill="#8a6f52">DÉLA JÁ</text>
      <text x="300" y="522" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="11" letterSpacing="3" fill="#a89376">HAND-POURED</text>
      <ellipse cx="300" cy="356" rx="128" ry="18" fill="#BDB4AA" />
      <ellipse cx="300" cy="354" rx="119" ry="14" fill={darken(topColor, 0.06)} />
      <ellipse cx="300" cy="352.5" rx="112" ry="11.5" fill={lighten(topColor, 0.26)} />
      <ellipse cx="272" cy="351" rx="46" ry="5" fill={lighten(topColor, 0.5)} opacity=".8" />
      <ellipse cx="300" cy="356" rx="128" ry="18" fill="none" stroke="#A89E92" strokeWidth="2" />
    </g>
  );
}

/** Footed sundae glass — layered wax in the bowl, stem + foot. */
const DBOWL = "M168 350 Q176 470 300 506 Q424 470 432 350 Z";
const DINNER = "M186 364 Q196 462 300 492 Q404 462 414 364 Z";
export function DessertGlass({ layers }: { layers: string[] }) {
  const top = layers[layers.length - 1];
  return (
    <g>
      <g filter="url(#csoft)">
        <path d={DBOWL} fill="#ECE7E3" fillOpacity=".45" />
      </g>
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 496px" }}
      >
        <WaxBands layers={layers} clipId="cdclip" top={372} bottom={496} topRx={106} />
        <path d={DINNER} fill="url(#cdepth)" />
      </motion.g>
      <path d={DBOWL} fill="url(#cglass)" />
      <path d="M186 360 Q196 450 296 488" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="9" strokeLinecap="round" />
      <rect x="294" y="500" width="12" height="120" fill="#ECE7E3" fillOpacity=".5" />
      <ellipse cx="300" cy="636" rx="84" ry="16" fill="#EDE7DF" fillOpacity=".6" stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="350" rx="132" ry="18" fill="#E7E0DB" stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="350" rx="120" ry="13" fill={top} fillOpacity=".5" />
    </g>
  );
}

export function JarVessel({ layers }: { layers: string[] }) {
  const topColor = layers[layers.length - 1];
  return (
    <g>
      <g filter="url(#csoft)">
        <path d={JAR_GLASS} fill="#ECE7E3" fillOpacity={0.5} />
      </g>
      {/* animated wax pour */}
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 632px" }}
      >
        <WaxBands layers={layers} />
        <path d={JAR_WAX} fill="url(#cdepth)" />
      </motion.g>
      {/* glass tint + highlights over the wax */}
      <path d={JAR_GLASS} fill="url(#cglass)" />
      <rect x="184" y="372" width="16" height="250" rx="8" fill="#fff" opacity={0.5} />
      <rect x="408" y="380" width="8" height="220" rx="4" fill="#fff" opacity=".22" />
      <ellipse cx="300" cy="628" rx="118" ry="18" fill="#3A2C2A" opacity=".10" />
      {/* rim (top layer color shows at the mouth) */}
      <ellipse cx="300" cy="350" rx="129" ry="20" fill="#E7E0DB" stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="350" rx="118" ry="14" fill={topColor} fillOpacity=".5" />
    </g>
  );
}

/* ── Wine glass (gel "drink" path) ────────────────────────────────────── */
export function WineGlass({ waxHex }: { waxHex: string }) {
  return (
    <g>
      <g filter="url(#csoft)">
        <path d="M198 210 Q198 360 300 392 Q402 360 402 210 Z" fill="#ECE7E3" fillOpacity=".42" />
      </g>
      {/* gel fill */}
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 392px" }}
      >
        <path d="M210 250 Q210 352 300 380 Q390 352 390 250 Z" fill={waxHex} fillOpacity=".75" />
        <ellipse cx="300" cy="250" rx="90" ry="12" fill="#fff" fillOpacity=".2" />
        <circle cx="330" cy="300" r="7" fill="#fff" fillOpacity=".4" />
        <circle cx="280" cy="330" r="5" fill="#fff" fillOpacity=".35" />
        <circle cx="312" cy="345" r="4" fill="#fff" fillOpacity=".3" />
      </motion.g>
      <path d="M198 210 Q198 360 300 392 Q402 360 402 210 Z" fill="url(#cglass)" />
      <path d="M214 222 Q216 320 290 360" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="300" cy="210" rx="102" ry="16" fill="#EDE7DF" fillOpacity=".7" stroke="#D2C8C1" strokeWidth="2" />
      {/* stem + foot */}
      <rect x="294" y="390" width="12" height="150" fill="#ECE7E3" fillOpacity=".55" />
      <ellipse cx="300" cy="548" rx="74" ry="16" fill="#EDE7DF" fillOpacity=".6" stroke="#D2C8C1" strokeWidth="2" />
    </g>
  );
}

/* ── Piped soft-serve cream: hand-piped wobble, scallops, soft-serve curl ── */
const CTIERS = [
  { y: 348, hw: 118, dx: 0 }, { y: 321, hw: 115, dx: -5 }, { y: 293, hw: 105, dx: 5 },
  { y: 265, hw: 91, dx: -6 }, { y: 237, hw: 76, dx: 5 }, { y: 210, hw: 59, dx: -4 },
  { y: 185, hw: 43, dx: 4 }, { y: 162, hw: 27, dx: -3 }, { y: 143, hw: 12, dx: 2 },
];

const CREAM_D = (() => {
  const cx = 300;
  const L = (t: (typeof CTIERS)[number]) => cx + t.dx - t.hw;
  const R = (t: (typeof CTIERS)[number]) => cx + t.dx + t.hw;
  let d = `M${L(CTIERS[0])} ${CTIERS[0].y}`;
  for (let i = 0; i < CTIERS.length - 1; i++) {
    const a = CTIERS[i], b = CTIERS[i + 1];
    const bulge = Math.max(a.hw, b.hw) + 19;
    d += ` Q${cx + (a.dx + b.dx) / 2 - bulge} ${(a.y + b.y) / 2} ${L(b)} ${b.y}`;
  }
  // soft-serve curl at the peak instead of a symmetric dome
  const top = CTIERS[CTIERS.length - 1];
  d += ` C${cx + top.dx - 6} ${top.y - 22} ${cx + top.dx + 14} ${top.y - 18} ${R(top)} ${top.y}`;
  for (let i = CTIERS.length - 1; i > 0; i--) {
    const a = CTIERS[i], b = CTIERS[i - 1];
    const bulge = Math.max(a.hw, b.hw) + 19;
    d += ` Q${cx + (a.dx + b.dx) / 2 + bulge} ${(a.y + b.y) / 2} ${R(b)} ${b.y}`;
  }
  return d + " Z";
})();

export function CreamSwirl({ hex }: { hex: string }) {
  const cx = 300;
  return (
    <motion.g
      initial={{ scale: 0.4, y: 26, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={SPRING.pipe}
      style={{ transformOrigin: "300px 348px" }}
    >
      <g filter="url(#csoft)">
        <ellipse cx={cx} cy="348" rx="126" ry="20" fill="#3A2C2A" opacity=".14" />
        <path d={CREAM_D} fill={hex} />
        <path d={CREAM_D} fill="url(#ccreamShade)" />
      </g>
      {/* volume: highlight upper-left, soft warm shadow lower-right */}
      <ellipse cx={cx - 34} cy="248" rx="84" ry="118" fill="url(#ccreamHi)" opacity=".65" />
      <ellipse cx={cx + 56} cy="266" rx="54" ry="112" fill="#6B4A3F" opacity=".05" />
      {/* piped folds tucked UNDER each tier lip — frosting, not ruled stripes */}
      {CTIERS.slice(0, -2).map((t, i) => {
        const w = t.hw * 0.86;
        const sag = 12 - i * 0.6;
        return (
          <g key={i}>
            <path d={`M${cx + t.dx - w} ${t.y - 1} Q${cx + t.dx} ${t.y + sag} ${cx + t.dx + w} ${t.y - 1}`} fill="none" stroke="#6B4A3F" strokeOpacity=".10" strokeWidth={6.5 - i * 0.35} strokeLinecap="round" />
            <path d={`M${cx + t.dx - w * 0.92} ${t.y - 7} Q${cx + t.dx} ${t.y + sag - 9} ${cx + t.dx + w * 0.92} ${t.y - 7}`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        );
      })}
    </motion.g>
  );
}

/* ── Drizzle that BELONGS to the cream: the zigzag baseline follows the dome
   curvature (ends dip down the flanks) and runs flow down the sides, ending
   in a rounded bead — sauce actually poured on top, not wire laid over it. ── */
function domeZig(cx: number, yc: number, halfW: number, n: number, amp: number, drop: number) {
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

const DRIZZLE_ZIGS = [domeZig(300, 222, 96, 8, 14, 26), domeZig(300, 250, 106, 9, 12, 28)];
const DRIZZLE_RUNS = [
  { d: "M204 248 q-9 22 -2 42 q5 14 -2 26", ex: 200, ey: 318 },
  { d: "M396 250 q10 22 3 44 q-5 12 1 22", ex: 400, ey: 320 },
  { d: "M332 262 q6 13 1 24", ex: 333, ey: 288 },
];

export function Drizzle({ hex }: { hex: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {DRIZZLE_ZIGS.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#3A2C2A" strokeOpacity=".16" strokeWidth="6" transform="translate(0 2.4)" />
          <motion.path
            d={d}
            stroke={hex}
            strokeWidth="5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: i * 0.12 }}
          />
          <motion.path
            d={d}
            stroke="#fff"
            strokeOpacity=".42"
            strokeWidth="1.5"
            transform="translate(-0.6 -1.4)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: i * 0.12 }}
          />
        </g>
      ))}
      {DRIZZLE_RUNS.map((r, i) => (
        <g key={`r${i}`}>
          <motion.path
            d={r.d}
            stroke={hex}
            strokeWidth="5.2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: 0.26 + i * 0.08 }}
          />
          <motion.circle
            cx={r.ex}
            cy={r.ey}
            r="4.6"
            fill={hex}
            stroke="none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRING.drop, delay: 0.5 + i * 0.08 }}
          />
        </g>
      ))}
    </g>
  );
}

/* ── Toppings: scatter (sprinkles/crumble/candy) vs placed ────────────── */
const SCATTER = new Set(["sprinkles", "crumble", "candy"]);
const CANDY = ["#E8A0C0", "#9ACBE0", "#F6E4B8", "#C4E0B0", "#E0A0A0", "#D9A0E0"];
const SPOTS = [
  { x: 236, y: 206 }, { x: 366, y: 214 }, { x: 300, y: 168 },
  { x: 392, y: 256 }, { x: 222, y: 258 }, { x: 330, y: 182 },
];

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
}

function placedShape(id: string, hex: string): React.ReactNode {
  switch (id) {
    case "strawberry":
      return (
        <g transform="rotate(-12)">
          <path d="M0 -20 C18 -16 22 6 0 26 C-22 6 -18 -16 0 -20 Z" fill={hex} />
          <path d="M-10 -22 L-2 -30 L0 -22 L3 -30 L11 -22 Z" fill="#3F7A3A" />
          <circle cx="-5" cy="0" r="1.6" fill="#ffe" /><circle cx="5" cy="6" r="1.6" fill="#ffe" />
          <circle cx="0" cy="13" r="1.6" fill="#ffe" />
        </g>
      );
    case "blueberry":
      return (
        <g>
          <circle cx="0" cy="0" r="15" fill="#46588F" /><circle cx="-5" cy="-5" r="4" fill="#7C8BB8" />
          <path d="M0 -4 l3 3 l-3 3 l-3 -3 z" fill="#26304f" />
          <circle cx="22" cy="10" r="12" fill="#3C4E82" /><circle cx="18" cy="6" r="3" fill="#7C8BB8" />
        </g>
      );
    case "orange-slice":
      return (
        <g>
          <circle cx="0" cy="0" r="18" fill={hex} /><circle cx="0" cy="0" r="13" fill="#FBE0B0" />
          <path d="M0 0 V-13 M0 0 L11 7 M0 0 L-11 7 M0 0 L13 -3 M0 0 L-13 -3" stroke={hex} strokeWidth="2" />
        </g>
      );
    case "waffle":
      return (
        <g transform="rotate(-12)">
          <rect x="-18" y="-15" width="36" height="30" rx="7" fill={hex} />
          <path d="M-13 -10 H13 M-13 0 H13 M-13 10 H13 M-6 -15 V15 M6 -15 V15" stroke="#b3823f" strokeWidth="2" />
        </g>
      );
    case "marshmallow":
      return (
        <g>
          <rect x="-15" y="-13" width="30" height="26" rx="9" fill={hex} stroke="#e7d9c4" strokeWidth="1.5" />
          <ellipse cx="0" cy="-13" rx="15" ry="4" fill="#fff" />
        </g>
      );
    case "pecan":
      return (
        <g>
          <ellipse cx="0" cy="0" rx="16" ry="12" fill={hex} />
          <path d="M0 -10 V10 M-10 -4 q10 4 20 0 M-10 4 q10 -4 20 0" stroke="#5e3c1f" strokeWidth="1.6" fill="none" />
        </g>
      );
    case "cherry":
    default:
      return (
        <g>
          <path d="M0 -14 q14 -14 6 -30" stroke="#5E7D3A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="0" cy="0" r="17" fill={hex} />
          <ellipse cx="-7" cy="-7" rx="5" ry="3.5" fill="#fff" fillOpacity=".55" />
        </g>
      );
  }
}

function ScatterTopping({ kind, seedIdx }: { kind: string; seedIdx: number }) {
  const r = rng(7 + seedIdx * 31);
  const n = kind === "sprinkles" ? 18 : kind === "crumble" ? 16 : 9;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = 300 + Math.cos(a) * rad * 118;
    const y = 214 + Math.sin(a) * rad * 60;
    const rot = Math.floor(r() * 180);
    if (kind === "sprinkles") {
      const c = CANDY[Math.floor(r() * CANDY.length)];
      items.push(<rect key={i} x={x - 7} y={y - 2.4} width="14" height="4.8" rx="2.4" fill={c} transform={`rotate(${rot} ${x} ${y})`} />);
    } else if (kind === "crumble") {
      items.push(<rect key={i} x={x - 5} y={y - 5} width="10" height="10" rx="3" fill="#C89B62" transform={`rotate(${rot} ${x} ${y})`} />);
    } else {
      const c = CANDY[Math.floor(r() * CANDY.length)];
      items.push(
        <g key={i}>
          <circle cx={x} cy={y} r="8" fill={c} />
          <path d={`M${x - 8} ${y} q8 -6 16 0 q-8 6 -16 0z`} fill="#fff" fillOpacity=".4" />
        </g>,
      );
    }
  }
  return (
    <motion.g
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={SPRING.drop}
      filter="url(#ctiny)"
    >
      {items}
    </motion.g>
  );
}

export function ToppingCluster({ ids }: { ids: { id: string; hex: string }[] }) {
  let placedI = 0;
  return (
    <g>
      {ids.map((t, i) => {
        if (SCATTER.has(t.id)) {
          return <ScatterTopping key={`${t.id}-${i}`} kind={t.id} seedIdx={i} />;
        }
        const p = SPOTS[placedI++ % SPOTS.length];
        return (
          <motion.g
            key={`${t.id}-${i}`}
            initial={{ y: -90, opacity: 0, rotate: -14 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ ...SPRING.drop, delay: i * 0.06 }}
            filter="url(#ctiny)"
          >
            <g transform={`translate(${p.x} ${p.y})`}>{placedShape(t.id, t.hex)}</g>
          </motion.g>
        );
      })}
    </g>
  );
}

/* ── Flame + glow (reveal) ────────────────────────────────────────────── */
export function Flame() {
  return (
    <g>
      <motion.circle
        cx="300" cy="118" r="78" fill="url(#cglow)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <rect x="297.4" y="118" width="5.2" height="40" rx="2.6" fill="#2E211C" />
      <motion.g
        style={{ transformOrigin: "300px 124px" }}
        animate={{ scaleY: [1, 1.12, 0.96, 1.06, 1], scaleX: [1, 0.96, 1.04, 0.98, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <g filter="url(#cflameSoft)">
          <path d="M300 42 C325 72 324 102 300 126 C276 102 275 72 300 42 Z" fill="url(#cflameOut)" />
        </g>
        <path d="M300 64 C315 84 314 104 300 122 C286 104 285 84 300 64 Z" fill="url(#cflameCore)" />
        <ellipse cx="300" cy="119" rx="4.6" ry="7" fill="#8FB6F2" fillOpacity=".55" />
      </motion.g>
    </g>
  );
}

/* ── Name label on the vessel ─────────────────────────────────────────── */
export function NameLabel({ name }: { name: string }) {
  const text = name.trim().length > 18 ? name.trim().slice(0, 17) + "…" : name.trim();
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING.gentle}
      style={{ transformOrigin: "300px 520px" }}
    >
      <rect x="206" y="496" width="188" height="56" rx="10" fill="#FFFAF7" fillOpacity=".93" stroke="#C8A15A" strokeWidth="1.5" />
      <text x="300" y="526" textAnchor="middle" dominantBaseline="middle" fontFamily="'Playfair Display', Georgia, serif" fontSize="24" fill="#3A2C2A">
        {text}
      </text>
    </motion.g>
  );
}
