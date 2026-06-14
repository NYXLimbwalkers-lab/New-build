import { motion } from "motion/react";
import { SPRING } from "@/lib/motionPresets";

/*
  Hand-drawn SVG layer art for the candle. Each part is its own layer, composited
  in recipe order by SvgLayerRenderer. Geometry shares ONE camera framing
  (viewBox 0 0 400 470, surface at y≈402, centered x=200) so any combination
  reads as a single studio photo — the same discipline the PNG pipeline will use.
*/

export interface VesselGeometry {
  /** Inner region the wax fills: x, top y, width, bottom y. */
  fill: { x: number; top: number; w: number; bottom: number; rx: number };
  /** Where whip/toppings sit (the "mouth" center + half-width). */
  mouth: { cx: number; cy: number; rx: number };
}

const GLASS = "#EBE6E4";
const GLASS_EDGE = "#D7CFCb";

/* ── Vessels ──────────────────────────────────────────────────────────── */

export function JarVessel({ tall }: { tall?: boolean }) {
  const top = tall ? 150 : 178;
  return (
    <g>
      {/* glass body */}
      <rect
        x="120"
        y={top}
        width="160"
        height={402 - top}
        rx="26"
        fill={GLASS}
        fillOpacity="0.55"
        stroke={GLASS_EDGE}
        strokeWidth="2"
      />
      {/* glass tint gradient (light left edge → darker right edge) */}
      <rect x="120" y={top} width="160" height={402 - top} rx="26" fill="url(#glassV)" />
      {/* pearlescent highlights */}
      <rect x="134" y={top + 12} width="20" height={402 - top - 30} rx="10" fill="#fff" fillOpacity="0.5" />
      <rect x="250" y={top + 20} width="10" height={402 - top - 50} rx="5" fill="#fff" fillOpacity="0.25" />
      {/* rim */}
      <ellipse cx="200" cy={top} rx="80" ry="11" fill={GLASS} fillOpacity="0.7" stroke={GLASS_EDGE} strokeWidth="2" />
    </g>
  );
}

export function jarGeometry(tall?: boolean): VesselGeometry {
  const top = tall ? 150 : 178;
  return {
    fill: { x: 126, top: top + 4, w: 148, bottom: 396, rx: 22 },
    mouth: { cx: 200, cy: top, rx: 78 },
  };
}

export function TinVessel() {
  return (
    <g>
      <rect x="128" y="250" width="144" height="152" rx="14" fill="#E8E2DA" stroke="#C9BFB2" strokeWidth="2" />
      <rect x="128" y="250" width="144" height="18" rx="9" fill="#D8CFC2" />
      <rect x="140" y="262" width="14" height="128" rx="7" fill="#fff" fillOpacity="0.45" />
      <ellipse cx="200" cy="250" rx="72" ry="9" fill="#EDE7DF" stroke="#C9BFB2" strokeWidth="2" />
    </g>
  );
}
export function tinGeometry(): VesselGeometry {
  return { fill: { x: 134, top: 256, w: 132, bottom: 396, rx: 10 }, mouth: { cx: 200, cy: 250, rx: 70 } };
}

export function DessertGlass() {
  return (
    <g>
      {/* footed coupe */}
      <path d="M130 196 Q130 300 200 312 Q270 300 270 196 Z" fill={GLASS} fillOpacity="0.5" stroke={GLASS_EDGE} strokeWidth="2" />
      <rect x="196" y="310" width="8" height="58" fill={GLASS} fillOpacity="0.55" />
      <ellipse cx="200" cy="392" rx="46" ry="10" fill={GLASS} fillOpacity="0.6" stroke={GLASS_EDGE} strokeWidth="2" />
      <ellipse cx="200" cy="196" rx="70" ry="12" fill={GLASS} fillOpacity="0.65" stroke={GLASS_EDGE} strokeWidth="2" />
      <path d="M146 206 Q150 280 196 300" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}
export function dessertGeometry(): VesselGeometry {
  return { fill: { x: 138, top: 202, w: 124, bottom: 305, rx: 60 }, mouth: { cx: 200, cy: 196, rx: 68 } };
}

export function WineGlass() {
  return (
    <g>
      <path d="M138 150 Q138 250 200 268 Q262 250 262 150 Z" fill={GLASS} fillOpacity="0.45" stroke={GLASS_EDGE} strokeWidth="2" />
      <rect x="196" y="266" width="8" height="96" fill={GLASS} fillOpacity="0.5" />
      <ellipse cx="200" cy="392" rx="52" ry="11" fill={GLASS} fillOpacity="0.55" stroke={GLASS_EDGE} strokeWidth="2" />
      <ellipse cx="200" cy="150" rx="62" ry="11" fill={GLASS} fillOpacity="0.6" stroke={GLASS_EDGE} strokeWidth="2" />
      <path d="M152 160 Q156 230 196 256" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}
export function wineGeometry(): VesselGeometry {
  return { fill: { x: 144, top: 156, w: 112, bottom: 262, rx: 56 }, mouth: { cx: 200, cy: 150, rx: 60 } };
}

/* ── Wax fill (animated pour) ─────────────────────────────────────────── */

export function WaxFill({ geo, hex, gel }: { geo: VesselGeometry; hex: string; gel?: boolean }) {
  const { x, top, w, bottom, rx } = geo.fill;
  const h = bottom - top;
  return (
    <motion.g
      initial={{ scaleY: 0, opacity: 0.4 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ ...SPRING.pour }}
      style={{ transformOrigin: `200px ${bottom}px` }}
    >
      {/* body */}
      <rect x={x} y={top} width={w} height={h} rx={rx} fill={hex} fillOpacity={gel ? 0.7 : 0.96} />
      {/* depth toward the bottom + glassy top sheen */}
      <rect x={x} y={top} width={w} height={h} rx={rx} fill="url(#depthBottom)" />
      <rect x={x} y={top} width={w} height={h} rx={rx} fill="url(#sheenTop)" />
      {/* crisp specular streak down the left */}
      <rect x={x + 7} y={top + 8} width="9" height={h - 22} rx="4.5" fill="#fff" fillOpacity={gel ? 0.3 : 0.2} />
      {/* liquid surface meniscus */}
      <ellipse cx={x + w / 2} cy={top} rx={w / 2 - 3} ry="6.5" fill="#fff" fillOpacity={gel ? 0.18 : 0.26} />
      <ellipse cx={x + w / 2} cy={top + 1.5} rx={w / 2 - 7} ry="4" fill={hex} fillOpacity="0.5" />
      {gel && (
        <>
          {/* suspended bubbles for the "drink" look */}
          <circle cx={x + w * 0.66} cy={top + h * 0.4} r="5" fill="#fff" fillOpacity="0.45" />
          <circle cx={x + w * 0.4} cy={top + h * 0.62} r="3.5" fill="#fff" fillOpacity="0.4" />
          <circle cx={x + w * 0.55} cy={top + h * 0.78} r="2.5" fill="#fff" fillOpacity="0.32" />
        </>
      )}
    </motion.g>
  );
}

/* ── Whipped topping (pipes on) ───────────────────────────────────────── */

export function WhipTopping({ geo, hex }: { geo: VesselGeometry; hex: string }) {
  const { cx, cy, rx } = geo.mouth;
  const r = rx * 0.92;
  // a stacked swirl built from a few softening ellipses + a peak
  return (
    <motion.g
      initial={{ scale: 0.2, y: 18, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ ...SPRING.pipe }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {/* contact shadow where the cream meets the wax */}
      <ellipse cx={cx} cy={cy + 2} rx={r * 0.96} ry={r * 0.2} fill="#3A2C2A" fillOpacity="0.12" />
      {/* piped cream lobes (soft drop shadow grounds the swirl) */}
      <g filter="url(#softShadow)">
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.34} fill={hex} />
        <ellipse cx={cx} cy={cy - r * 0.28} rx={r * 0.74} ry={r * 0.3} fill={hex} />
        <ellipse cx={cx} cy={cy - r * 0.54} rx={r * 0.5} ry={r * 0.26} fill={hex} />
        <ellipse cx={cx} cy={cy - r * 0.78} rx={r * 0.28} ry={r * 0.2} fill={hex} />
        <path d={`M${cx} ${cy - r * 0.95} q6 -14 0 -22 q-6 8 0 22`} fill={hex} />
      </g>
      {/* soft volumetric highlight + crisp specular */}
      <ellipse cx={cx} cy={cy - r * 0.22} rx={r * 0.88} ry={r * 0.5} fill="url(#whipHi)" />
      <ellipse cx={cx - r * 0.32} cy={cy - r * 0.36} rx={r * 0.12} ry={r * 0.07} fill="#fff" fillOpacity="0.55" />
    </motion.g>
  );
}

/* ── Drizzle (pours slow + glossy) ────────────────────────────────────── */

export function Drizzle({ geo, hex }: { geo: VesselGeometry; hex: string }) {
  const { cx, cy, rx } = geo.mouth;
  const r = rx * 0.92;
  const d = `M${cx - r * 0.7} ${cy - r * 0.1}
    q ${r * 0.35} ${r * 0.22} ${r * 0.7} 0
    q ${r * 0.35} -${r * 0.22} ${r * 0.7} ${r * 0.05}
    M${cx - r * 0.5} ${cy - r * 0.35}
    q ${r * 0.5} ${r * 0.3} ${r} -${r * 0.05}`;
  return (
    <motion.g
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ ...SPRING.drizzle }}
    >
      {/* glossy drizzle: colored body + a thin specular highlight on top */}
      <motion.path d={d} fill="none" stroke={hex} strokeWidth="6.5" strokeLinecap="round" />
      <motion.path
        d={d}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.45"
        strokeWidth="2"
        strokeLinecap="round"
        transform="translate(0 -1.4)"
      />
    </motion.g>
  );
}

/* ── Toppings (drop in with a soft bounce) ────────────────────────────── */

const TOPPING_SHAPE: Record<string, (p: { x: number; y: number; hex: string }) => React.ReactNode> = {
  strawberry: ({ x, y, hex }) => (
    <g>
      <path d={`M${x} ${y - 9} q11 2 9 13 q-2 11 -9 12 q-7 -1 -9 -12 q-2 -11 9 -13z`} fill={hex} />
      <path d={`M${x - 4} ${y - 11} l4 -5 l4 5z`} fill="#3f7a3f" />
      <circle cx={x - 3} cy={y + 3} r="1" fill="#fff8" />
      <circle cx={x + 3} cy={y + 6} r="1" fill="#fff8" />
    </g>
  ),
  blueberry: ({ x, y, hex }) => (
    <g>
      <circle cx={x} cy={y} r="9" fill={hex} />
      <circle cx={x - 3} cy={y - 3} r="2" fill="#fff5" />
      <path d={`M${x} ${y - 3} l2 2 l-2 2 l-2 -2z`} fill="#1f2a4a" />
    </g>
  ),
  "orange-slice": ({ x, y, hex }) => (
    <g>
      <circle cx={x} cy={y} r="11" fill={hex} />
      <circle cx={x} cy={y} r="8" fill="#fbe0b0" />
      <path d={`M${x} ${y} L${x} ${y - 8} M${x} ${y} L${x + 7} ${y + 4} M${x} ${y} L${x - 7} ${y + 4}`} stroke={hex} strokeWidth="1.4" />
    </g>
  ),
  waffle: ({ x, y, hex }) => (
    <g>
      <rect x={x - 11} y={y - 9} width="22" height="18" rx="4" fill={hex} transform={`rotate(-12 ${x} ${y})`} />
      <path d={`M${x - 8} ${y - 6} h16 M${x - 8} ${y} h16 M${x - 8} ${y + 6} h16 M${x - 4} ${y - 9} v18 M${x + 4} ${y - 9} v18`} stroke="#b3823f" strokeWidth="1.2" transform={`rotate(-12 ${x} ${y})`} />
    </g>
  ),
  sprinkles: ({ x, y }) => (
    <g>
      {["#E8A0C0", "#9ACBE0", "#F6E4B8", "#C4E0B0", "#E0A0A0"].map((c, i) => (
        <rect key={i} x={x - 10 + i * 5} y={y - 6 + (i % 2) * 8} width="9" height="3.4" rx="1.7" fill={c} transform={`rotate(${i * 40} ${x - 6 + i * 5} ${y})`} />
      ))}
    </g>
  ),
  pecan: ({ x, y, hex }) => (
    <g>
      <ellipse cx={x} cy={y} rx="10" ry="7" fill={hex} />
      <path d={`M${x} ${y - 6} v12 M${x - 6} ${y - 3} q6 3 12 0 M${x - 6} ${y + 3} q6 -3 12 0`} stroke="#5e3c1f" strokeWidth="1" fill="none" />
    </g>
  ),
  crumble: ({ x, y, hex }) => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x - 9 + (i % 3) * 7} y={y - 6 + Math.floor(i / 3) * 7} width="6" height="6" rx="2" fill={hex} fillOpacity={0.85 - i * 0.08} transform={`rotate(${i * 25} ${x} ${y})`} />
      ))}
    </g>
  ),
  candy: ({ x, y, hex }) => (
    <g>
      <circle cx={x} cy={y} r="8" fill={hex} />
      <path d={`M${x - 8} ${y} q8 -6 16 0 q-8 6 -16 0z`} fill="#fff7" />
    </g>
  ),
  marshmallow: ({ x, y, hex }) => (
    <g>
      <rect x={x - 9} y={y - 8} width="18" height="16" rx="6" fill={hex} stroke="#e7d9c4" strokeWidth="1" />
      <ellipse cx={x} cy={y - 8} rx="9" ry="3" fill="#fff" />
      <path d={`M${x - 5} ${y + 4} q5 3 10 0`} stroke="#caa97f" strokeWidth="1" fill="none" />
    </g>
  ),
  cherry: ({ x, y, hex }) => (
    <g>
      <circle cx={x} cy={y + 2} r="9" fill={hex} />
      <circle cx={x - 3} cy={y - 1} r="2" fill="#fff7" />
      <path d={`M${x} ${y - 7} q4 -10 10 -12`} stroke="#5e7d3a" strokeWidth="1.6" fill="none" />
    </g>
  ),
};

export function ToppingCluster({
  geo,
  ids,
}: {
  geo: VesselGeometry;
  ids: { id: string; hex: string }[];
}) {
  const { cx, cy, rx } = geo.mouth;
  // arrange around the mouth in a gentle ring + center
  const positions = layoutToppings(cx, cy - rx * 0.45, rx * 0.62, ids.length);
  return (
    <g>
      {ids.map((t, i) => {
        const shape = TOPPING_SHAPE[t.id] ?? TOPPING_SHAPE.candy;
        const p = positions[i];
        return (
          <motion.g
            key={`${t.id}-${i}`}
            initial={{ y: -60, opacity: 0, rotate: -12 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ ...SPRING.drop, delay: i * 0.05 }}
            filter="url(#softShadow)"
          >
            {shape({ x: p.x, y: p.y, hex: t.hex })}
          </motion.g>
        );
      })}
    </g>
  );
}

function layoutToppings(cx: number, cy: number, radius: number, n: number) {
  if (n <= 0) return [];
  if (n === 1) return [{ x: cx, y: cy }];
  const pts: { x: number; y: number }[] = [];
  const ring = Math.min(n, 6);
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius * 0.7 });
  }
  for (let i = ring; i < n; i++) pts.push({ x: cx, y: cy });
  return pts;
}

/* ── Flame + glow (reveal) ────────────────────────────────────────────── */

export function Flame({ geo }: { geo: VesselGeometry }) {
  const { cx, cy } = geo.mouth;
  const baseY = cy - 6;
  return (
    <g>
      {/* wick */}
      <rect x={cx - 1.4} y={baseY - 16} width="2.8" height="18" rx="1.4" fill="#3A2C2A" />
      {/* glow bloom */}
      <motion.circle
        cx={cx}
        cy={baseY - 30}
        r="70"
        fill="url(#flameGlow)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* flame */}
      <motion.g
        style={{ transformOrigin: `${cx}px ${baseY - 16}px` }}
        animate={{ scaleY: [1, 1.12, 0.96, 1.06, 1], scaleX: [1, 0.96, 1.04, 0.98, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d={`M${cx} ${baseY - 44} q12 14 0 30 q-12 -16 0 -30z`} fill="#E9B65A" />
        <path d={`M${cx} ${baseY - 36} q7 9 0 19 q-7 -10 0 -19z`} fill="#F6E2B0" />
        <ellipse cx={cx} cy={baseY - 14} rx="3" ry="5" fill="#9ec5ff" fillOpacity="0.8" />
      </motion.g>
    </g>
  );
}

export function GlowDefs() {
  return (
    <defs>
      <radialGradient id="flameGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F6D89A" stopOpacity="0.7" />
        <stop offset="45%" stopColor="#E8C4C8" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#E8C4C8" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="surfaceShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#3A2C2A" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#3A2C2A" stopOpacity="0" />
      </radialGradient>

      {/* Color-agnostic lighting overlays — give any tinted shape real depth. */}
      <linearGradient id="sheenTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="24%" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="55%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="depthBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="50%" stopColor="#3A2C2A" stopOpacity="0" />
        <stop offset="100%" stopColor="#3A2C2A" stopOpacity="0.24" />
      </linearGradient>
      <radialGradient id="whipHi" cx="38%" cy="26%" r="72%">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="42%" stopColor="#fff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="glassV" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="20%" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="78%" stopColor="#9a908b" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#9a908b" stopOpacity="0.24" />
      </linearGradient>
      {/* Soft contact shadow / fake ambient occlusion to ground elements. */}
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#3A2C2A" floodOpacity="0.28" />
      </filter>
    </defs>
  );
}
