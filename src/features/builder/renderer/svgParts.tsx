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
      <radialGradient id="ccreamHi" cx="38%" cy="26%" r="60%">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ccreamShade" cx="50%" cy="18%" r="95%">
        <stop offset="58%" stopColor="#3A2C2A" stopOpacity="0" />
        <stop offset="100%" stopColor="#3A2C2A" stopOpacity=".13" />
      </radialGradient>
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
    </defs>
  );
}

export function SurfaceShadow() {
  return <ellipse cx="300" cy="664" rx="170" ry="30" fill="#3A2C2A" opacity=".15" />;
}

/* ── Jar (glass + animated wax pour). Used for soy vessels. ───────────── */
const JAR_GLASS = "M171 350 L164 614 Q164 648 198 648 L402 648 Q436 648 436 614 L429 350 Z";
const JAR_WAX = "M186 392 L180 612 Q180 632 200 632 L400 632 Q420 632 420 612 L414 392 Z";

export function JarVessel({ waxHex, tin }: { waxHex: string; tin?: boolean }) {
  return (
    <g>
      <g filter="url(#csoft)">
        <path d={JAR_GLASS} fill={tin ? "#E6DFD6" : "#ECE7E3"} fillOpacity={tin ? 0.95 : 0.5} />
      </g>
      {/* animated wax pour (clipped to the inset wax shape) */}
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 632px" }}
      >
        <path d={JAR_WAX} fill={waxHex} />
        <path d={JAR_WAX} fill="url(#cdepth)" />
        <path d="M186 392 L414 392 L412 422 L188 422 Z" fill="#fff" opacity=".28" />
      </motion.g>
      {/* glass tint + highlights over the wax */}
      {!tin && <path d={JAR_GLASS} fill="url(#cglass)" />}
      <rect x="184" y="372" width="16" height="250" rx="8" fill="#fff" opacity={tin ? 0.3 : 0.5} />
      <rect x="408" y="380" width="8" height="220" rx="4" fill="#fff" opacity=".22" />
      {/* inner bottom shadow for depth */}
      <ellipse cx="300" cy="628" rx="118" ry="18" fill="#3A2C2A" opacity=".10" />
      {/* rim */}
      <ellipse cx="300" cy="350" rx="129" ry="20" fill={tin ? "#D8CFC4" : "#E7E0DB"} stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="350" rx="118" ry="14" fill={waxHex} fillOpacity=".5" />
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

/* ── Piped soft-serve cream: scalloped silhouette + swirl ridges ──────── */
const CTIERS = [
  { y: 348, hw: 118 }, { y: 322, hw: 116 }, { y: 294, hw: 106 }, { y: 266, hw: 92 },
  { y: 238, hw: 77 }, { y: 210, hw: 60 }, { y: 184, hw: 44 }, { y: 160, hw: 28 }, { y: 140, hw: 13 },
];

const CREAM_D = (() => {
  const cx = 300;
  let d = `M${cx - CTIERS[0].hw} ${CTIERS[0].y}`;
  for (let i = 0; i < CTIERS.length - 1; i++) {
    const a = CTIERS[i], b = CTIERS[i + 1];
    const bulge = Math.max(a.hw, b.hw) + 15;
    d += ` Q${cx - bulge} ${(a.y + b.y) / 2} ${cx - b.hw} ${b.y}`;
  }
  const top = CTIERS[CTIERS.length - 1];
  d += ` Q${cx} ${top.y - 16} ${cx + top.hw} ${top.y}`;
  for (let i = CTIERS.length - 1; i > 0; i--) {
    const a = CTIERS[i], b = CTIERS[i - 1];
    const bulge = Math.max(a.hw, b.hw) + 15;
    d += ` Q${cx + bulge} ${(a.y + b.y) / 2} ${cx + b.hw} ${b.y}`;
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
      {/* volume: highlight upper-left, soft shadow right */}
      <ellipse cx={cx - 30} cy="250" rx="86" ry="120" fill="url(#ccreamHi)" opacity=".7" />
      <ellipse cx={cx + 58} cy="262" rx="56" ry="116" fill="#3A2C2A" opacity=".05" />
      {/* swirl ridges at every tier */}
      {CTIERS.slice(0, -1).map((t, i) => {
        const w = t.hw * 0.9;
        return (
          <g key={i}>
            <path d={`M${cx - w} ${t.y} Q${cx} ${t.y + 13} ${cx + w} ${t.y}`} fill="none" stroke="#3A2C2A" strokeOpacity=".12" strokeWidth="6" strokeLinecap="round" />
            <path d={`M${cx - w} ${t.y - 7} Q${cx} ${t.y + 4} ${cx + w} ${t.y - 7}`} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        );
      })}
    </motion.g>
  );
}

/* ── Drizzle: a fine zigzag lattice of glossy sauce (parametric color) ─── */
function zigPath(cx: number, y: number, halfW: number, n: number, amp: number, curve: number) {
  let p = `M${cx - halfW} ${y}`;
  const step = (halfW * 2) / n;
  for (let i = 0; i < n; i++) {
    const x0 = cx - halfW + step * i;
    const x1 = x0 + step;
    const cym = y - (i % 2 === 0 ? amp : -amp) - curve;
    p += ` Q${(x0 + x1) / 2} ${cym} ${x1} ${y}`;
  }
  return p;
}

export function Drizzle({ hex }: { hex: string }) {
  const a = zigPath(300, 232, 96, 7, 26, 0);
  const b = zigPath(300, 248, 80, 6, 20, -10);
  const drips = ["M214 250 q-7 22 -2 42", "M388 248 q8 20 2 42"];
  const paths = [a, b];
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {paths.map((d, i) => (
        <g key={i}>
          <motion.path
            d={d}
            stroke={hex}
            strokeWidth="4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: i * 0.12 }}
          />
          <motion.path
            d={d}
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="1.3"
            transform="translate(0 -1.2)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: i * 0.12 }}
          />
        </g>
      ))}
      {drips.map((d, i) => (
        <motion.path
          key={`d${i}`}
          d={d}
          stroke={hex}
          strokeWidth="4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ ...SPRING.drizzle, delay: 0.3 }}
        />
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
        cx="300" cy="130" r="86" fill="url(#cglow)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <rect x="297" y="120" width="6" height="40" rx="3" fill="#3A2C2A" />
      <motion.g
        style={{ transformOrigin: "300px 124px" }}
        animate={{ scaleY: [1, 1.12, 0.96, 1.06, 1], scaleX: [1, 0.96, 1.04, 0.98, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M300 40 C326 70 326 102 300 128 C274 102 274 70 300 40 Z" fill="#F0B24E" />
        <path d="M300 62 C316 82 316 104 300 126 C284 104 284 82 300 62 Z" fill="#F8E6B0" />
        <ellipse cx="300" cy="118" rx="6" ry="10" fill="#9ec5ff" fillOpacity=".75" />
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
