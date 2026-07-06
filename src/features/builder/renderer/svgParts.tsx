import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motionPresets";

/*
  Semi-realistic candle art (viewBox 600×740), parametric on ingredient colors.
  Designed offline in the rasterizer rig (scripts/preview-candle.mjs — the
  source of truth for the LOOK, iterated against the owner's real product
  photos), then ported here with the Confiserie animations.
  One shared camera framing so every combination reads as one illustration:
  vessel mouth at (300,350); creams sit ON the mouth; toppings sit on the
  cream — or directly on the wax surface when there is no whip.
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
/** Blend two hexes (t=0 → a, t=1 → b) — keeps cream shadows WARM, not grey. */
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
  const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
  const bl = ch(pa & 255, pb & 255);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

/** Deterministic pseudo-random — scatter layouts stay stable per seed. */
function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
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
      <linearGradient id="cgoldMetal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#F6E3A0" />
        <stop offset=".24" stopColor="#E7C874" />
        <stop offset=".55" stopColor="#D9B44A" />
        <stop offset=".84" stopColor="#B8903A" />
        <stop offset="1" stopColor="#96712B" />
      </linearGradient>
      <radialGradient id="ccreamHi" cx="38%" cy="26%" r="60%">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".85" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="ccreamShade" cx="50%" cy="18%" r="95%">
        <stop offset="58%" stopColor="#6B4A3F" stopOpacity="0" />
        <stop offset="100%" stopColor="#6B4A3F" stopOpacity=".13" />
      </radialGradient>
      <radialGradient id="croseHi" cx="38%" cy="32%" r="65%">
        <stop offset="0" stopColor="#fff" stopOpacity=".8" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="cberry" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#F06A78" />
        <stop offset="1" stopColor="#B92038" />
      </radialGradient>
      <radialGradient id="cbberry" cx="35%" cy="30%" r="75%">
        <stop offset="0" stopColor="#8B9AC4" />
        <stop offset="1" stopColor="#3A4C80" />
      </radialGradient>
      <linearGradient id="cwaffleG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#EFC97F" />
        <stop offset="1" stopColor="#C08A44" />
      </linearGradient>
      <radialGradient id="cpocket" cx="50%" cy="45%" r="65%">
        <stop offset="0" stopColor="#7E5524" />
        <stop offset=".7" stopColor="#96682C" />
        <stop offset="1" stopColor="#BE8B41" />
      </radialGradient>
      <linearGradient id="ctoast" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FBF2E0" />
        <stop offset=".6" stopColor="#F3E3C6" />
        <stop offset="1" stopColor="#D9AC6E" />
      </linearGradient>
      <linearGradient id="cchoc" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6E4A30" />
        <stop offset="1" stopColor="#3F2416" />
      </linearGradient>
      <radialGradient id="choneyblob" cx="38%" cy="30%" r="72%">
        <stop offset="0" stopColor="#F4C65E" />
        <stop offset="1" stopColor="#B5763C" />
      </radialGradient>
      <radialGradient id="ccinnabun" cx="42%" cy="34%" r="74%">
        <stop offset="0" stopColor="#E3AC62" />
        <stop offset="1" stopColor="#A5692F" />
      </radialGradient>
      <radialGradient id="cpecanG" cx="40%" cy="32%" r="74%">
        <stop offset="0" stopColor="#B27E48" />
        <stop offset="1" stopColor="#7C4F27" />
      </radialGradient>
      <radialGradient id="ccitrus" cx="42%" cy="34%" r="72%">
        <stop offset="0" stopColor="#FBC55A" />
        <stop offset="1" stopColor="#EE9A2E" />
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
      <filter id="csoftblur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4.5" />
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

/* ── Jar: clean straight-sided glass tumbler (her jars are simple cylinders) ── */
const JAR_GLASS = "M172 350 L172 616 Q172 648 204 648 L396 648 Q428 648 428 616 L428 350 Z";
const JAR_WAX = "M186 392 L186 612 Q186 630 204 630 L396 630 Q414 630 414 612 L414 392 Z";

/**
 * Stacked wax layers (parfait look): per-band tonal gradient, cylindrical side
 * shading, wavy hand-poured seams, and an elliptical SURFACE pool at the fill
 * line — wax, not painted rectangles.
 */
function WaxBands({ layers, clipId = "cwaxclip", top = 392, bottom = 630, topRx = 110 }: { layers: string[]; clipId?: string; top?: number; bottom?: number; topRx?: number }) {
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
      <ellipse cx="300" cy={top + 9} rx={topRx + 8} ry="19" fill={darken(topHex, 0.14)} />
      <ellipse cx="300" cy={top + 4} rx={topRx + 2} ry="16" fill={lighten(topHex, 0.38)} />
      <ellipse cx="270" cy={top + 1} rx={topRx * 0.42} ry="7" fill={lighten(topHex, 0.62)} opacity=".9" />
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
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 630px" }}
      >
        <WaxBands layers={layers} />
        <path d={JAR_WAX} fill="url(#cdepth)" />
      </motion.g>
      <path d={JAR_GLASS} fill="url(#cglass)" />
      <rect x="182" y="370" width="14" height="252" rx="7" fill="#fff" opacity={0.5} />
      <rect x="404" y="378" width="7" height="224" rx="3.5" fill="#fff" opacity=".2" />
      <path d="M186 630 Q300 642 414 630" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
      <ellipse cx="300" cy="632" rx="112" ry="13" fill="#3A2C2A" opacity=".10" />
      <ellipse cx="300" cy="350" rx="128" ry="19" fill="#E7E0DB" stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="350" rx="117" ry="14" fill={topColor} fillOpacity=".5" />
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

/* ── Wine glass (gel "drink" path) — grounded, with drips up the bowl ──── */
export function WineGlass({ waxHex }: { waxHex: string }) {
  const drips = [
    [236, 236], [268, 224], [332, 226], [364, 238], [300, 220],
  ] as const;
  return (
    <g>
      <g filter="url(#csoft)">
        <path d="M196 214 Q196 366 300 398 Q404 366 404 214 Z" fill="#ECE7E3" fillOpacity=".42" />
      </g>
      <clipPath id="cwclip">
        <path d="M206 224 Q206 356 300 386 Q394 356 394 224 Z" />
      </clipPath>
      <motion.g
        initial={{ scaleY: 0, opacity: 0.5 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={SPRING.pour}
        style={{ transformOrigin: "300px 386px" }}
        clipPath="url(#cwclip)"
      >
        <path d="M206 252 Q206 356 300 386 Q394 356 394 252 Z" fill={waxHex} fillOpacity=".82" />
        <ellipse cx="300" cy="252" rx="94" ry="13" fill={lighten(waxHex, 0.3)} fillOpacity=".7" />
        <circle cx="332" cy="300" r="7" fill="#fff" fillOpacity=".35" />
        <circle cx="278" cy="330" r="5" fill="#fff" fillOpacity=".3" />
        <circle cx="314" cy="348" r="4" fill="#fff" fillOpacity=".28" />
        {drips.map(([x, y], i) => (
          <g key={i}>
            <path
              d={`M${x} ${y} q${x < 300 ? -3 : 3} -${y - 196} ${x < 300 ? 1 : -1} -${y - 190}`}
              stroke={waxHex}
              strokeWidth="6.5"
              fill="none"
              strokeLinecap="round"
              opacity=".82"
            />
            <circle cx={x + (x < 300 ? -2 : 2)} cy={y - (y - 196) - 2} r="4.6" fill={waxHex} opacity=".85" />
          </g>
        ))}
      </motion.g>
      <path d="M196 214 Q196 366 300 398 Q404 366 404 214 Z" fill="url(#cglass)" />
      <path d="M214 226 Q216 324 292 364" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="300" cy="214" rx="104" ry="16" fill="#EDE7DF" fillOpacity=".7" stroke="#D2C8C1" strokeWidth="2" />
      <rect x="294" y="396" width="12" height="236" fill="#ECE7E3" fillOpacity=".55" />
      <path d="M296 400 L296 626" stroke="#fff" strokeOpacity=".5" strokeWidth="2.4" />
      <ellipse cx="300" cy="636" rx="88" ry="15" fill="#EDE7DF" fillOpacity=".6" stroke="#D2C8C1" strokeWidth="2" />
      <ellipse cx="300" cy="632" rx="60" ry="8" fill="#fff" fillOpacity=".25" />
    </g>
  );
}

/* ── Heart tin (wax-melt line) — TOP-DOWN gold heart, creamy piped fill,
   banana slice + amber wafer domes + crumble dust. Flameless. ───────────── */
export function HeartTin({ topColor }: { topColor: string }) {
  const heart = (s: number) =>
    `M300 ${370 + s} C${270 - s} ${330 - s} ${192 - s} ${334 - s} ${183 - s} ${398}` +
    ` C${176 - s} ${452 + s} ${240 - s / 2} ${500 + s} 300 ${534 + s}` +
    ` C${360 + s / 2} ${500 + s} ${424 + s} ${452 + s} ${417 + s} ${398}` +
    ` C${408 + s} ${334 - s} ${330 + s} ${330 - s} 300 ${370 + s} Z`;
  const cream = lighten(topColor, 0.12);
  const bumpShade = darken(topColor, 0.3);
  const rows: [number, number, number][] = [
    [252, 402, 17], [300, 396, 19], [348, 402, 17], [226, 436, 15], [276, 442, 18],
    [326, 442, 18], [374, 436, 15], [252, 478, 15], [300, 486, 17], [348, 478, 15],
  ];
  const rr = rng(41);
  const dust: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const a = rr() * Math.PI * 2, rad = Math.sqrt(rr());
    dust.push(
      <circle
        key={i}
        cx={(300 + Math.cos(a) * rad * 96).toFixed(1)}
        cy={(436 + Math.sin(a) * rad * 66).toFixed(1)}
        r={(1 + rr() * 1.6).toFixed(1)}
        fill="#C89B62"
        opacity={0.5 + rr() * 0.4}
      />,
    );
  }
  // No motion entrance on the vessel itself (matches JarVessel; also avoids a
  // Motion-12 quirk where g-level enter animations can freeze mid-flight).
  return (
    <g>
      <g transform="translate(300 452) scale(1.34) translate(-300 -442)">
        <g filter="url(#csoft)">
          <path d={heart(10)} fill="#B8903A" />
        </g>
        <path d={heart(10)} fill="url(#cgoldMetal)" />
        <path d={heart(0)} fill="#C9A23C" />
        <path d={heart(-7)} fill={topColor} />
        {rows.map(([bx, by, br], i) => (
          <g key={i}>
            <ellipse cx={bx} cy={by + br * 0.55} rx={br * 0.95} ry={br * 0.45} fill={bumpShade} opacity=".3" />
            <circle cx={bx} cy={by} r={br} fill={cream} />
            <path d={`M${bx - br * 0.6} ${by - br * 0.25} Q${bx} ${by - br * 0.95} ${bx + br * 0.6} ${by - br * 0.25}`} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.2" />
            <path d={`M${bx - br * 0.55} ${by + br * 0.4} Q${bx} ${by + br * 0.9} ${bx + br * 0.55} ${by + br * 0.4}`} fill="none" stroke={bumpShade} strokeOpacity=".4" strokeWidth="2.2" />
          </g>
        ))}
        <clipPath id="chtclip">
          <path d={heart(-7)} />
        </clipPath>
        <g clipPath="url(#chtclip)">
          {dust}
          <g filter="url(#ctiny)">
            <circle cx="252" cy="412" r="30" fill="#EFDC8C" />
            <circle cx="252" cy="412" r="30" fill="none" stroke="#D9C06A" strokeWidth="2.5" />
            <circle cx="247" cy="408" r="2.2" fill="#6E4A2E" />
            <circle cx="257" cy="410" r="1.8" fill="#6E4A2E" />
            <circle cx="251" cy="418" r="1.9" fill="#6E4A2E" />
            <circle cx="259" cy="417" r="1.4" fill="#6E4A2E" />
          </g>
          <g filter="url(#ctiny)">
            <ellipse cx="342" cy="428" rx="42" ry="36" fill="url(#choneyblob)" />
            <ellipse cx="330" cy="415" rx="13" ry="9" fill="#fff" opacity=".4" />
          </g>
          <g filter="url(#ctiny)">
            <ellipse cx="276" cy="486" rx="33" ry="28" fill="url(#choneyblob)" />
            <ellipse cx="267" cy="476" rx="10" ry="7" fill="#fff" opacity=".38" />
          </g>
        </g>
        <path d={heart(0)} fill="none" stroke="#96712B" strokeWidth="2.4" opacity=".7" />
        <path d="M232 352 Q262 338 296 350" fill="none" stroke="#F6E3A0" strokeWidth="3" opacity=".7" strokeLinecap="round" />
      </g>
    </g>
  );
}

/* ── Piped whipped cream — her signature: a MOUND of star-tip PIPED SWIRLS
   (wrapped ribbon bands with piping grooves, curled peaks), matching the
   icing in her photos. Base y≈348 on the mouth; crown meets the wick. ───── */
function PipedSwirl({ body, tuck }: { body: string; tuck: string }) {
  return (
    <>
      <ellipse cx="0" cy="9" rx="44" ry="8" fill="#8A5F46" opacity=".16" />
      <path d="M-46 -10 Q-50 6 -30 11 Q0 16 30 11 Q50 6 46 -10 Q46 -22 26 -27 Q0 -31 -26 -27 Q-46 -22 -46 -10 Z" fill={body} />
      <path d="M-42 -3 Q0 11 42 -3" fill="none" stroke={tuck} strokeOpacity=".3" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-38 -8 Q0 5 38 -8" fill="none" stroke={tuck} strokeOpacity=".26" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M-32 -14 Q0 -3 32 -14" fill="none" stroke={tuck} strokeOpacity=".2" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-28 -21 Q0 -27 28 -21" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      <path d="M-40 -20 Q-47 -39 -22 -46 Q8 -53 30 -44 Q45 -37 40 -25 Q37 -17 26 -20 Q4 -33 -20 -29 Q-34 -26 -40 -20 Z" fill={body} />
      <path d="M-34 -26 Q0 -40 33 -28" fill="none" stroke={tuck} strokeOpacity=".28" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M-28 -32 Q-1 -44 27 -34" fill="none" stroke={tuck} strokeOpacity=".22" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-23 -39 Q-1 -48 21 -40" fill="none" stroke="#fff" strokeOpacity=".42" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M-23 -37 Q-29 -57 -7 -64 Q12 -69 21 -58 Q25 -50 15 -46 Q7 -56 -5 -52 Q-17 -48 -23 -37 Z" fill={body} />
      <path d="M-17 -46 Q-4 -58 13 -52" fill="none" stroke={tuck} strokeOpacity=".26" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-13 -52 Q-2 -60 9 -55" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M0 -60 Q6 -70 -2 -78 Q2 -68 -4 -60 Q-2 -56 0 -60 Z" fill={body} />
      <ellipse cx="-10" cy="-38" rx="20" ry="16" fill="url(#croseHi)" opacity=".5" />
    </>
  );
}

const PILE: [number, number, number, number, number, number][] = [
  // x, y, sx, sy, rot, shade
  [240, 320, 0.8, 0.8, -5, 0.09],
  [360, 320, 0.8, 0.8, 5, 0.09],
  [266, 290, 0.56, 0.54, -10, 0.05],
  [336, 290, 0.56, 0.54, 10, 0.05],
  [219, 351, 0.88, 0.88, -7, 0],
  [381, 351, 0.9, 0.88, 6, 0],
  [300, 357, 1.0, 0.96, -3, 0],
  [300, 262, 1.06, 1.22, 3, 0],
];

export function CreamSwirl({ hex }: { hex: string }) {
  return (
    <motion.g
      initial={{ scale: 0.4, y: 26, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={SPRING.pipe}
      style={{ transformOrigin: "300px 348px" }}
    >
      <g filter="url(#csoft)">
        <ellipse cx="300" cy="349" rx="124" ry="17" fill="#3A2C2A" opacity=".13" />
        <path d="M198 352 Q204 276 300 262 Q396 276 402 352 Z" fill={mix(hex, "#C69B72", 0.22)} />
        {PILE.map(([x, y, sx, sy, rot, shade], i) => {
          const body = shade ? mix(hex, "#C69B72", shade) : hex;
          const tuck = mix(body, "#8A5F46", 0.48);
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
              <PipedSwirl body={body} tuck={tuck} />
            </g>
          );
        })}
      </g>
    </motion.g>
  );
}

/* ── Soft-serve SWIRL — the whipped-topping style: fat tapering coils ───── */
const SWIRL_TIERS = [
  { y: 348, hw: 118, dx: 0 }, { y: 312, hw: 110, dx: -6 }, { y: 276, hw: 94, dx: 6 },
  { y: 242, hw: 74, dx: -6 }, { y: 210, hw: 52, dx: 5 }, { y: 182, hw: 31, dx: -4 },
  { y: 158, hw: 13, dx: 2 },
];
const SWIRL_D = (() => {
  const cx = 300;
  const L = (t: (typeof SWIRL_TIERS)[number]) => cx + t.dx - t.hw;
  const R = (t: (typeof SWIRL_TIERS)[number]) => cx + t.dx + t.hw;
  let d = `M${L(SWIRL_TIERS[0])} ${SWIRL_TIERS[0].y}`;
  for (let i = 0; i < SWIRL_TIERS.length - 1; i++) {
    const a = SWIRL_TIERS[i], b = SWIRL_TIERS[i + 1];
    const bulge = Math.max(a.hw, b.hw) + 27;
    d += ` Q${cx + (a.dx + b.dx) / 2 - bulge} ${(a.y + b.y) / 2} ${L(b)} ${b.y}`;
  }
  const top = SWIRL_TIERS[SWIRL_TIERS.length - 1];
  d += ` C${cx + top.dx - 7} ${top.y - 26} ${cx + top.dx + 16} ${top.y - 21} ${R(top)} ${top.y}`;
  for (let i = SWIRL_TIERS.length - 1; i > 0; i--) {
    const a = SWIRL_TIERS[i], b = SWIRL_TIERS[i - 1];
    const bulge = Math.max(a.hw, b.hw) + 27;
    d += ` Q${cx + (a.dx + b.dx) / 2 + bulge} ${(a.y + b.y) / 2} ${R(b)} ${b.y}`;
  }
  return d + " Z";
})();

export function SwirlTop({ hex }: { hex: string }) {
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
        <path d={SWIRL_D} fill={hex} />
        <path d={SWIRL_D} fill="url(#ccreamShade)" />
      </g>
      <clipPath id="cswirlclip">
        <path d={SWIRL_D} />
      </clipPath>
      <g clipPath="url(#cswirlclip)">
        <ellipse cx={cx - 34} cy="248" rx="82" ry="116" fill="url(#ccreamHi)" opacity=".58" />
        <ellipse cx={cx + 56} cy="266" rx="52" ry="110" fill="#6B4A3F" opacity=".05" />
      </g>
      {SWIRL_TIERS.slice(0, -1).map((t, i) => {
        const drift = (i % 2 ? 1 : -1) * t.hw * 0.14;
        const w = t.hw * 0.86;
        const sag = 17 - i * 1.4;
        return (
          <g key={i}>
            <path d={`M${cx + t.dx - w + drift} ${t.y - 1} Q${cx + t.dx + drift} ${t.y + sag} ${cx + t.dx + w + drift} ${t.y - 1}`} fill="none" stroke="#6B4A3F" strokeOpacity=".14" strokeWidth={9 - i * 0.7} strokeLinecap="round" />
            <path d={`M${cx + t.dx - w * 0.9 + drift} ${t.y - 9} Q${cx + t.dx + drift} ${t.y + sag - 12} ${cx + t.dx + w * 0.9 + drift} ${t.y - 9}`} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="3.4" strokeLinecap="round" />
          </g>
        );
      })}
    </motion.g>
  );
}

/* ── Ice-cream SCOOP (waffle sundaes): wide organic dome, churned marble
   streaks, crumbly scooped base seated on the rim. ─────────────────────── */
export function ScoopTop({ hex }: { hex: string }) {
  const cx = 300, baseY = 348, RX = 118, RY = 152;
  const shadow = darken(hex, 0.18);
  const deep = darken(hex, 0.3);
  const lite = lighten(hex, 0.45);
  const wob = [0, 0.02, -0.012, 0.03, -0.018, 0.016, 0.026, -0.014, 0.024, -0.018, 0.02, -0.012, 0];
  const pts = wob.map((w, i) => {
    const a = Math.PI - (i / (wob.length - 1)) * Math.PI;
    return [cx + Math.cos(a) * RX * (1 + w), baseY - Math.sin(a) * RY * (1 + w) * 0.985];
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [x, y] = pts[i];
    d += ` Q${px.toFixed(1)} ${py.toFixed(1)} ${((px + x) / 2).toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
    if (i === pts.length - 1) d += ` T${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const crumbs: [number, number][] = [[26, 10], [22, 6], [30, 13], [24, 8], [34, 12], [26, 7], [24, 11], [30, 8]];
  let x = cx + RX;
  d += ` L${x.toFixed(1)} ${baseY}`;
  for (const [w, dip] of crumbs) {
    const nx = Math.max(cx - RX, x - w);
    d += ` Q${((x + nx) / 2).toFixed(1)} ${(baseY + dip).toFixed(1)} ${nx.toFixed(1)} ${(baseY + (dip > 9 ? 3 : 1)).toFixed(1)}`;
    x = nx;
    if (x <= cx - RX) break;
  }
  d += " Z";
  const streaks: [number, number, number, number, number, number, string, number, number, number][] = [
    [cx - 74, 262, cx - 34, 250, cx - 2, 258, deep, 0.2, 6, 1],
    [cx + 12, 244, cx + 52, 238, cx + 84, 254, deep, 0.16, 5, 1],
    [cx - 88, 300, cx - 44, 292, cx - 8, 300, shadow, 0.24, 7, 1],
    [cx + 6, 296, cx + 54, 288, cx + 96, 302, shadow, 0.2, 6, 1],
    [cx - 62, 330, cx - 12, 324, cx + 40, 332, deep, 0.18, 6, 1],
    [cx - 58, 234, cx - 28, 224, cx + 4, 230, "#ffffff", 0.4, 4, 0],
    [cx - 84, 276, cx - 50, 268, cx - 18, 274, "#ffffff", 0.3, 3, 0],
    [cx + 26, 268, cx + 58, 262, cx + 86, 272, "#ffffff", 0.26, 3.5, 0],
    [cx - 30, 312, cx + 6, 306, cx + 42, 312, "#ffffff", 0.22, 3, 0],
  ];
  const dabs: [number, number, number, string, number][] = [
    [cx - 44, 246, 4, deep, 0.16], [cx + 30, 236, 3.4, deep, 0.14], [cx + 66, 284, 4.4, deep, 0.15],
    [cx - 70, 312, 3.6, deep, 0.14], [cx + 8, 276, 3, deep, 0.12], [cx - 20, 288, 2.6, "#ffffff", 0.3],
    [cx + 48, 250, 3, "#ffffff", 0.28], [cx - 52, 270, 2.4, "#ffffff", 0.26], [cx + 74, 316, 3.2, "#ffffff", 0.2],
    [cx - 6, 330, 2.8, "#ffffff", 0.22],
  ];
  return (
    <motion.g
      initial={{ scale: 0.5, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={SPRING.pipe}
      style={{ transformOrigin: "300px 348px" }}
    >
      <g filter="url(#csoft)">
        <ellipse cx={cx} cy={baseY + 6} rx="112" ry="14" fill="#3A2C2A" opacity=".13" />
        <path d={d} fill={hex} />
        <path d={d} fill="url(#ccreamShade)" />
      </g>
      <clipPath id="cscoopclip">
        <path d={d} />
      </clipPath>
      <g clipPath="url(#cscoopclip)">
        <ellipse cx={cx} cy={baseY - 18} rx={RX} ry="52" fill={shadow} opacity=".18" />
        <g filter="url(#csoftblur)">
          <ellipse cx={cx - 40} cy="302" rx="36" ry="24" fill={deep} opacity=".13" />
          <ellipse cx={cx + 46} cy="322" rx="32" ry="20" fill={deep} opacity=".11" />
          <ellipse cx={cx + 20} cy="252" rx="30" ry="18" fill={deep} opacity=".09" />
          {streaks.filter((s) => s[9]).map(([x0, y0, qx, qy, x1, y1, c, o, w], i) => (
            <path key={i} d={`M${x0} ${y0} Q${qx} ${qy} ${x1} ${y1}`} fill="none" stroke={c} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" />
          ))}
        </g>
        {streaks.filter((s) => !s[9]).map(([x0, y0, qx, qy, x1, y1, c, o, w], i) => (
          <path key={i} d={`M${x0} ${y0} Q${qx} ${qy} ${x1} ${y1}`} fill="none" stroke={c} strokeOpacity={o} strokeWidth={w} strokeLinecap="round" />
        ))}
        {dabs.map(([px, py, r, c, o], i) => (
          <circle key={i} cx={px} cy={py} r={r} fill={c} opacity={o} />
        ))}
        <g filter="url(#csoftblur)">
          <ellipse cx={cx - 62} cy={baseY - 4} rx="20" ry="9" fill={deep} opacity=".14" />
          <ellipse cx={cx + 8} cy={baseY - 2} rx="24" ry="9" fill={deep} opacity=".12" />
          <ellipse cx={cx + 74} cy={baseY - 5} rx="18" ry="8" fill={deep} opacity=".13" />
        </g>
        <ellipse cx={cx - 34} cy="248" rx="56" ry="44" fill="url(#croseHi)" opacity=".6" />
        <ellipse cx={cx - 12} cy="222" rx="20" ry="12" fill={lite} opacity=".55" />
        <ellipse cx={cx + 52} cy="300" rx="42" ry="52" fill={shadow} opacity=".12" />
      </g>
    </motion.g>
  );
}

/* ── Sculpted wax ROSE (White Tea & Rose): wrapped spiral bloom + cupped
   outer petals sagging over the mouth. ─────────────────────────────────── */
export function RoseTop({ hex }: { hex: string }) {
  const cx = 300, cy = 268, R = 78;
  const deep = darken(hex, 0.24);
  const dim = darken(hex, 0.1);
  const edge = lighten(hex, 0.42);
  const outer: [number, number, number, number, number][] = [
    [-96, 26, 52, 38, -38], [-58, 62, 54, 40, -16], [0, 74, 58, 40, 0],
    [58, 62, 54, 40, 16], [96, 26, 52, 38, 38], [-88, -28, 48, 36, -64], [88, -28, 48, 36, 64],
    [-50, -62, 46, 34, -28], [50, -62, 46, 34, 28],
  ];
  const wraps: [number, number, number][] = [
    [R - 12, -30, 205], [R - 26, 130, 190], [R - 40, 305, 200],
    [R - 52, 80, 185], [R - 62, 250, 190],
  ];
  return (
    <motion.g
      initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={SPRING.pipe}
      style={{ transformOrigin: "300px 300px" }}
    >
      <g filter="url(#csoft)">
        <ellipse cx={cx} cy="350" rx="112" ry="15" fill="#3A2C2A" opacity=".13" />
        {outer.map(([dx, dy, rx, ry, rot], i) => (
          <g key={i} transform={`translate(${cx + dx} ${cy + dy}) rotate(${rot})`}>
            <path d={`M${-rx} 0 Q${-rx} ${-ry} 0 ${-ry} Q${rx} ${-ry} ${rx} 0 Q${rx * 0.7} ${ry * 0.72} 0 ${ry * 0.8} Q${-rx * 0.7} ${ry * 0.72} ${-rx} 0 Z`} fill={dim} />
            <path d={`M${-rx * 0.86} ${-ry * 0.1} Q0 ${-ry * 0.95} ${rx * 0.86} ${-ry * 0.1}`} fill="none" stroke={edge} strokeOpacity=".6" strokeWidth="2.2" />
          </g>
        ))}
        <circle cx={cx} cy={cy} r={R} fill={hex} />
      </g>
      <g fill="none" strokeLinecap="round">
        {wraps.map(([r, a0, sweep], i) => {
          const a1 = ((a0 + sweep) * Math.PI) / 180, a0r = (a0 * Math.PI) / 180;
          const x0 = cx + Math.cos(a0r) * r, y0 = cy + Math.sin(a0r) * r;
          const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
          const large = sweep > 180 ? 1 : 0;
          return (
            <g key={i}>
              <path d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`} stroke={deep} strokeOpacity=".5" strokeWidth="3.4" />
              <path d={`M${x0.toFixed(1)} ${(y0 - 2.4).toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${(y1 - 2.4).toFixed(1)}`} stroke={edge} strokeOpacity=".5" strokeWidth="1.6" />
            </g>
          );
        })}
      </g>
      <g fill="none">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.4;
          const x = cx + Math.cos(a) * (R - 3), y = cy + Math.sin(a) * (R - 3);
          const px = Math.cos(a + Math.PI / 2) * 26, py = Math.sin(a + Math.PI / 2) * 26;
          return (
            <path key={i} d={`M${(x - px).toFixed(1)} ${(y - py).toFixed(1)} Q${(cx + Math.cos(a) * (R + 9)).toFixed(1)} ${(cy + Math.sin(a) * (R + 9)).toFixed(1)} ${(x + px).toFixed(1)} ${(y + py).toFixed(1)}`} stroke={deep} strokeOpacity=".32" strokeWidth="2.6" />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r="14" fill={hex} />
      <path d={`M${cx - 9} ${cy - 2} a9 8 0 1 1 9 9 a6 5.5 0 1 1 5 -8 a3.4 3 0 1 0 -4 4`} fill="none" stroke={deep} strokeWidth="3" strokeLinecap="round" />
      <clipPath id="croseclip">
        <circle cx={cx} cy={cy} r={R} />
      </clipPath>
      <g clipPath="url(#croseclip)">
        <ellipse cx={cx - 26} cy={cy - 34} rx="46" ry="34" fill="url(#croseHi)" opacity=".45" />
      </g>
    </motion.g>
  );
}

/* ── Drizzle that BELONGS to the cream: lattice follows the pile, runs flow
   into the crevices and down the flanks, ending in glossy beads. ────────── */
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

const DRIZZLE_ZIGS = [domeZig(300, 236, 60, 6, 11, 14), domeZig(300, 298, 112, 9, 12, 20)];
const DRIZZLE_RUNS = [
  { d: "M195 299 q-8 18 -2 33 q3 8 -2 14", ex: 191, ey: 346 },
  { d: "M405 301 q9 18 3 34 q-3 8 2 13", ex: 410, ey: 348 },
  { d: "M262 296 q-5 12 -1 22", ex: 261, ey: 318 },
  { d: "M340 297 q6 12 2 24", ex: 342, ey: 321 },
  { d: "M240 250 q-6 10 -3 19", ex: 237, ey: 269 },
  { d: "M360 250 q7 10 4 20", ex: 364, ey: 270 },
];

export function Drizzle({ hex }: { hex: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {DRIZZLE_ZIGS.map((d, i) => (
        <g key={i}>
          <path d={d} stroke="#3A2C2A" strokeOpacity=".16" strokeWidth="6.6" transform="translate(0 2.4)" />
          <motion.path
            d={d}
            stroke={hex}
            strokeWidth="5.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: i * 0.12 }}
          />
          <motion.path
            d={d}
            stroke="#fff"
            strokeOpacity=".42"
            strokeWidth="1.6"
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
            strokeWidth="5.6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...SPRING.drizzle, delay: 0.26 + i * 0.08 }}
          />
          <motion.circle
            cx={r.ex}
            cy={r.ey}
            r="4.8"
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
/** Where placed toppings sit: on the cream dome, on the bare wax surface at
 *  the mouth, or across the heart tin's creamy fill (melts, top-down view). */
export type ToppingSurface = "cream" | "wax" | "heart";
const SPOTS: Record<ToppingSurface, { x: number; y: number }[]> = {
  cream: [
    { x: 234, y: 262 }, { x: 366, y: 266 }, { x: 300, y: 232 },
    { x: 198, y: 306 }, { x: 402, y: 308 }, { x: 300, y: 300 },
  ],
  wax: [
    { x: 252, y: 338 }, { x: 348, y: 342 }, { x: 300, y: 332 },
    { x: 214, y: 346 }, { x: 386, y: 346 }, { x: 300, y: 348 },
  ],
  heart: [
    { x: 256, y: 414 }, { x: 346, y: 430 }, { x: 300, y: 476 },
    { x: 250, y: 472 }, { x: 352, y: 476 }, { x: 300, y: 404 },
  ],
};
const SCATTER_AREA: Record<ToppingSurface, { cy: number; rx: number; ry: number }> = {
  cream: { cy: 282, rx: 106, ry: 52 },
  wax: { cy: 344, rx: 106, ry: 9 },
  heart: { cy: 446, rx: 78, ry: 42 },
};

function placedShape(id: string, hex: string): React.ReactNode {
  switch (id) {
    case "strawberry": {
      const seeds: [number, number][] = [
        [-14, -6], [0, -9], [13, -5], [-8, 8], [7, 7], [-1, 21], [-19, 3], [18, 4],
      ];
      return (
        <g transform="rotate(-10)">
          <path d="M0 -26 C20 -26 30 -12 27 4 C24 20 12 32 0 38 C-12 32 -24 20 -27 4 C-30 -12 -20 -26 0 -26 Z" fill="url(#cberry)" />
          <path d="M-18 -14 C-12 -21 -3 -24 6 -22 C-2 -27 -14 -23 -18 -14 Z" fill="#fff" opacity=".5" />
          {seeds.map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="1.9" ry="2.8" fill="#FBE7A0" stroke="#C98B2E" strokeWidth=".5" transform={`rotate(${x * 1.4} ${x} ${y})`} />
          ))}
          <path d="M0 -23 C-5 -30 -14 -33 -23 -30 C-16 -24 -8 -22 -2 -22 Z" fill="#4C8A44" />
          <path d="M0 -23 C5 -30 14 -33 23 -30 C16 -24 8 -22 2 -22 Z" fill="#3F7A3A" />
          <path d="M-2 -24 C-3 -31 -1 -36 2 -40 C4 -34 4 -28 2 -23 Z" fill="#579750" />
          <path d="M2 -38 q3 -6 8 -8" stroke="#3F7A3A" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "blueberry":
      return (
        <g>
          <circle cx="0" cy="0" r="15" fill="url(#cbberry)" />
          <path d="M0 -6 l4.4 3.2 l-1.7 5.2 h-5.4 L-4.4 -2.8 z" fill="#26304F" opacity=".85" />
          <ellipse cx="-6" cy="-7" rx="4.6" ry="3" fill="#AEBCD8" opacity=".75" />
          <circle cx="21" cy="11" r="11.5" fill="url(#cbberry)" />
          <ellipse cx="17" cy="7" rx="3.4" ry="2.3" fill="#AEBCD8" opacity=".75" />
        </g>
      );
    case "orange-slice":
      return (
        <g transform="rotate(-12)">
          <circle cx="0" cy="0" r="19" fill="#E1801F" />
          <circle cx="0" cy="0" r="16.5" fill="#FBE7C4" />
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
            const r0 = 13;
            const x1 = Math.cos(a - 0.3) * r0, y1 = Math.sin(a - 0.3) * r0;
            const x2 = Math.cos(a + 0.3) * r0, y2 = Math.sin(a + 0.3) * r0;
            return <path key={i} d={`M0 0 L${x1.toFixed(1)} ${y1.toFixed(1)} A${r0} ${r0} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`} fill="url(#ccitrus)" />;
          })}
          <circle cx="0" cy="0" r="2.6" fill="#FBE7C4" />
          <ellipse cx="-7" cy="-8" rx="6.5" ry="4.2" fill="#fff" opacity=".4" />
        </g>
      );
    case "waffle": {
      const px: React.ReactNode[] = [];
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          px.push(<rect key={`${r}${c}`} x={-25 + c * 18} y={-25 + r * 18} width="14" height="14" rx="4.5" fill="url(#cpocket)" />);
      return (
        <g transform="rotate(-18)">
          <path d="M-29 18 Q0 28 29 18 L27 30 Q0 40 -27 30 Z" fill="#7E5626" />
          <rect x="-30" y="-30" width="60" height="54" rx="13" fill="url(#cwaffleG)" />
          {px}
          <rect x="-30" y="-30" width="60" height="54" rx="13" fill="none" stroke="#8F6228" strokeOpacity=".45" strokeWidth="1.8" />
          <path d="M-24 -27 q24 -6 48 0" stroke="#FFE9B8" strokeWidth="3" opacity=".5" fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "chocolate":
      return (
        <g transform="rotate(-6)">
          <rect x="-22" y="-15" width="44" height="32" rx="4" fill="url(#cchoc)" />
          <path d="M-22 1 H22 M0 -15 V17" stroke="#2E190E" strokeWidth="2.4" opacity=".7" />
          <rect x="-20" y="-13" width="18" height="12" rx="2" fill="#fff" opacity=".1" />
          <rect x="2" y="-13" width="18" height="12" rx="2" fill="#fff" opacity=".06" />
          <rect x="-20" y="-14" width="42" height="4" rx="2" fill="#fff" opacity=".16" />
        </g>
      );
    case "honey":
      return (
        <g>
          <ellipse cx="0" cy="0" rx="17" ry="14" fill="url(#choneyblob)" />
          <path d="M6 12 q4 9 0 17 q-2 4 1 8" stroke="#C9862F" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="7" cy="36" r="4.5" fill="url(#choneyblob)" />
          <ellipse cx="-5" cy="-5" rx="6.5" ry="4.5" fill="#fff" opacity=".55" />
        </g>
      );
    case "honeycomb": {
      const r = 8.6;
      const hexPath = (hx: number, hy: number) => {
        let p = "";
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 3;
          p += (i ? " L" : "M") + (hx + Math.cos(a) * r).toFixed(1) + " " + (hy + Math.sin(a) * r).toFixed(1);
        }
        return p + " Z";
      };
      const hs = Math.sqrt(3) * r, vs = 1.5 * r;
      const cells: React.ReactNode[] = [];
      for (let row = -1; row <= 1; row++)
        for (let col = -1; col <= 1; col++) {
          const hx = col * hs + (row & 1 ? hs / 2 : 0);
          const hy = row * vs;
          cells.push(
            <g key={`${row}${col}`}>
              <path d={hexPath(hx, hy)} fill="#C88A33" stroke="#F4D27A" strokeWidth="2" />
              <circle cx={hx} cy={hy} r="3" fill="#8A5A22" opacity=".45" />
            </g>,
          );
        }
      return (
        <g transform="rotate(-7)">
          <rect x="-25" y="-23" width="50" height="46" rx="10" fill="url(#choneyblob)" />
          <clipPath id="chcclip">
            <rect x="-25" y="-23" width="50" height="46" rx="10" />
          </clipPath>
          <g clipPath="url(#chcclip)">{cells}</g>
          <rect x="-25" y="-23" width="50" height="46" rx="10" fill="none" stroke="#9A6A2C" strokeWidth="2" strokeOpacity=".6" />
          <ellipse cx="-9" cy="-9" rx="11" ry="6" fill="#fff" opacity=".3" />
          <path d="M9 22 q4 9 0 16 q-2 4 1 7" stroke="url(#choneyblob)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          <circle cx="10" cy="46" r="4.5" fill="url(#choneyblob)" />
        </g>
      );
    }
    case "cinnamon-roll":
      return (
        <g>
          <ellipse cx="0" cy="0" rx="21" ry="19" fill="url(#ccinnabun)" />
          <g fill="none" stroke="#8A5A2E" strokeWidth="3.4" strokeOpacity=".82">
            <ellipse cx="1" cy="0" rx="5" ry="4.4" />
            <ellipse cx="0" cy="0" rx="11" ry="9.6" />
            <ellipse cx="-0.5" cy="0" rx="16.5" ry="14.6" />
          </g>
          <ellipse cx="0" cy="0" rx="21" ry="19" fill="none" stroke="#8A5A2E" strokeOpacity=".5" strokeWidth="1.6" />
          <path d="M-15 -5 q15 7 30 0" stroke="#FFF6EA" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity=".92" />
          <path d="M-11 4 q11 5 22 0" stroke="#FFF6EA" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
          <ellipse cx="-7" cy="-7" rx="6" ry="4" fill="#fff" opacity=".3" />
        </g>
      );
    case "apple":
      return (
        <g>
          <path d="M0 -11 q11 -4 16 6 q4 12 -6 18 q-9 4 -10 -3 q-1 7 -10 3 q-10 -6 -6 -18 q5 -10 16 -6 Z" fill="#D5473F" />
          <ellipse cx="-4" cy="-3" rx="5" ry="7" fill="#F2988C" opacity=".55" />
          <path d="M1 -11 q0 -6 3 -9" stroke="#6E4A2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M4 -19 q7 -3 10 2 q-6 5 -10 -2 Z" fill="#5E8A3A" />
        </g>
      );
    case "banana":
      return (
        <g transform="rotate(-6)">
          <circle cx="0" cy="0" r="17" fill="#EFDC8C" />
          <circle cx="0" cy="0" r="17" fill="none" stroke="#D9C06A" strokeWidth="2.2" />
          <circle cx="0" cy="0" r="12.5" fill="#F6EAB4" />
          <circle cx="-3" cy="-2" r="1.7" fill="#6E4A2E" />
          <circle cx="3.5" cy="-1" r="1.3" fill="#6E4A2E" />
          <circle cx="0" cy="4" r="1.4" fill="#6E4A2E" />
          <ellipse cx="-5" cy="-6" rx="5" ry="3" fill="#fff" opacity=".4" />
        </g>
      );
    case "wafer":
      return (
        <g>
          <ellipse cx="0" cy="2" rx="19" ry="15" fill="url(#choneyblob)" />
          <ellipse cx="0" cy="2" rx="19" ry="15" fill="none" stroke="#9A6A2C" strokeOpacity=".4" strokeWidth="1.4" />
          <ellipse cx="-6" cy="-4" rx="7" ry="4.6" fill="#fff" opacity=".42" />
          <circle cx="6" cy="-2" r="1" fill="#FBE7C4" opacity=".8" />
          <circle cx="1" cy="6" r="1.2" fill="#FBE7C4" opacity=".7" />
        </g>
      );
    case "graham":
      return (
        <g transform="rotate(-14)">
          <rect x="-20" y="-16" width="40" height="32" rx="3" fill="#B8552E" />
          <rect x="-22" y="-19" width="40" height="32" rx="3" fill="#CE6636" />
          <rect x="-22" y="-19" width="40" height="32" rx="3" fill="none" stroke="#8F3D1E" strokeOpacity=".5" strokeWidth="1.4" />
          <path d="M-16 -13 q17 -4 30 0" stroke="#F0A468" strokeWidth="2.4" opacity=".6" fill="none" strokeLinecap="round" />
          <circle cx="-8" cy="-6" r="1.1" fill="#F6D8B8" opacity=".7" />
          <circle cx="6" cy="-1" r="1.3" fill="#F6D8B8" opacity=".6" />
          <circle cx="-2" cy="6" r="1" fill="#F6D8B8" opacity=".65" />
        </g>
      );
    case "peppermint":
      return (
        <g transform="rotate(-20)">
          <path d="M-16 -10 L14 -14 L18 8 L-8 14 Z" fill="#FDF8F4" />
          <path d="M-16 -10 L14 -14 L18 8 L-8 14 Z" fill="none" stroke="#E3CFC8" strokeWidth="1.2" />
          <path d="M-10 -11 L-4 13 M0 -12.5 L6 12 M9 -13.5 L14 10" stroke="#C42C3E" strokeWidth="4" strokeLinecap="round" opacity=".85" />
          <ellipse cx="-4" cy="-6" rx="6" ry="3" fill="#fff" opacity=".6" />
        </g>
      );
    case "marshmallow":
      return (
        <g transform="rotate(-8)">
          <rect x="-16" y="-15" width="32" height="30" rx="5" fill="url(#ctoast)" stroke="#D8B98C" strokeWidth="1" />
          <path d="M-16 -8 Q0 -13 16 -8 L16 -15 Q16 -15 11 -15 L-11 -15 Q-16 -15 -16 -15 Z" fill="#8A5A33" opacity=".85" />
          <path d="M-13 -10 Q0 -14 13 -10" fill="none" stroke="#4A2E16" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
          <circle cx="-6" cy="-11" r="1.8" fill="#3A2314" />
          <circle cx="5" cy="-12" r="1.4" fill="#3A2314" />
          <circle cx="7" cy="5" r="1.3" fill="#C9A876" opacity=".8" />
          <circle cx="-7" cy="9" r="1.1" fill="#C9A876" opacity=".7" />
          <circle cx="1" cy="1" r="1" fill="#C9A876" opacity=".6" />
          <path d="M-16 8 Q0 12 16 8" fill="none" stroke="#E8D8B8" strokeWidth="1.6" opacity=".8" />
        </g>
      );
    case "pecan":
      return (
        <g transform="rotate(-18)">
          <path d="M0 -15 C11 -15 16 -7 16 2 C16 11 9 16 0 16 C-9 16 -16 11 -16 2 C-16 -7 -11 -15 0 -15 Z" fill="url(#cpecanG)" />
          <path d="M0 -13 V13" stroke="#5A3A1E" strokeWidth="2.4" opacity=".7" />
          <path d="M-3 -11 C-9 -6 -9 6 -4 11" stroke="#6E4A28" strokeWidth="1.3" fill="none" opacity=".55" />
          <path d="M3 -11 C9 -6 9 6 4 11" stroke="#6E4A28" strokeWidth="1.3" fill="none" opacity=".55" />
          <path d="M-8 -8 C-12 -3 -12 5 -8 9" stroke="#6E4A28" strokeWidth="1" fill="none" opacity=".4" />
          <path d="M8 -8 C12 -3 12 5 8 9" stroke="#6E4A28" strokeWidth="1" fill="none" opacity=".4" />
          <ellipse cx="-6" cy="-8" rx="5.5" ry="4" fill="#fff" opacity=".22" />
        </g>
      );
    case "cherry":
    default:
      return (
        <g>
          <path d="M2 -15 C10 -27 10 -39 4 -49" stroke="#5E7D3A" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M4 -49 q11 -3 17 6 q-11 5 -17 -6 z" fill="#6B8F45" />
          <circle cx="0" cy="0" r="18" fill={hex.startsWith("#") ? "url(#cberry)" : hex} />
          <path d="M0 -17 C3 -8 3 8 0 16" stroke="#8F1B2E" strokeWidth="2" opacity=".45" fill="none" />
          <ellipse cx="-7" cy="-8" rx="5.5" ry="4" fill="#fff" opacity=".6" />
          <circle cx="2" cy="-15" r="2" fill="#7A1526" />
        </g>
      );
  }
}

function ScatterTopping({ kind, seedIdx, surface = "cream" }: { kind: string; seedIdx: number; surface?: ToppingSurface }) {
  const r = rng(7 + seedIdx * 31);
  const n = kind === "sprinkles" ? 18 : kind === "crumble" ? 16 : 9;
  const area = SCATTER_AREA[surface];
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = 300 + Math.cos(a) * rad * area.rx;
    const y = area.cy + Math.sin(a) * rad * area.ry;
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

export function ToppingCluster({ ids, surface = "cream" }: { ids: { id: string; hex: string }[]; surface?: ToppingSurface }) {
  const spots = SPOTS[surface];
  let placedI = 0;
  return (
    <g>
      {ids.map((t, i) => {
        if (SCATTER.has(t.id)) {
          return <ScatterTopping key={`${t.id}-${i}`} kind={t.id} seedIdx={i} surface={surface} />;
        }
        const p = spots[placedI++ % spots.length];
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

/* ── Flame + braided wick + glow (reveal) ─────────────────────────────── */
export function Flame({ dy = 0, wickLen = 40 }: { dy?: number; wickLen?: number }) {
  // Perf: the flicker loop runs ALL DAY on the kiosk. No feGaussianBlur inside
  // the animated group (that forces a filter re-raster every frame) — the soft
  // edge is faked with a scaled low-opacity copy. Reduced motion: no flicker.
  const reduce = useReducedMotion();
  return (
    <g transform={dy ? `translate(0 ${dy})` : undefined}>
      <motion.circle
        cx="300" cy="118" r="78" fill="url(#cglow)"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <rect x="297.2" y="118" width="5.6" height={wickLen} rx="2.8" fill="#EFE4CE" />
      <path d="M300 124 l-2 5 l2 5 l-2 5 l2 5 l-2 5 l2 5" stroke="#C9B893" strokeWidth="1.2" fill="none" />
      <rect x="297.2" y="118" width="5.6" height="9" rx="2.8" fill="#4A3A2E" />
      <motion.g
        style={{ transformOrigin: "300px 124px", willChange: "transform" }}
        animate={
          reduce
            ? undefined
            : { scaleY: [1, 1.12, 0.96, 1.06, 1], scaleX: [1, 0.96, 1.04, 0.98, 1] }
        }
        transition={reduce ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* faked blur: enlarged translucent copy instead of a live filter */}
        <path
          d="M300 42 C325 72 324 102 300 126 C276 102 275 72 300 42 Z"
          fill="url(#cflameOut)"
          opacity=".35"
          transform="translate(300 84) scale(1.18) translate(-300 -84)"
        />
        <path d="M300 42 C325 72 324 102 300 126 C276 102 275 72 300 42 Z" fill="url(#cflameOut)" />
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
