import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import {
  DRIZZLE_BY_ID,
  TOPPING_BY_ID,
  VESSEL_BY_ID,
  WAX_BY_ID,
  WHIP_BY_ID,
} from "@/data/ingredients";
import { cn } from "@/lib/cn";
import type { RendererProps } from "./types";
import {
  DessertGlass,
  Drizzle,
  Flame,
  GlowDefs,
  JarVessel,
  TinVessel,
  ToppingCluster,
  WaxFill,
  WhipTopping,
  WineGlass,
  dessertGeometry,
  jarGeometry,
  tinGeometry,
  wineGeometry,
  type VesselGeometry,
} from "./svgParts";

/*
  The DEFAULT preview engine: layered SVG art composited in recipe order on ONE
  fixed camera framing. It satisfies the swappable RendererProps contract, so a
  future three.js / transparent-PNG engine can drop in without touching the
  step flow. Each layer animates with the Confiserie motion presets (pour, pipe,
  drizzle, drop) and only transform/opacity move (GPU fast path).
*/
function geometryFor(shape: string): { geo: VesselGeometry; node: React.ReactNode } {
  switch (shape) {
    case "wine":
      return { geo: wineGeometry(), node: <WineGlass /> };
    case "tin":
      return { geo: tinGeometry(), node: <TinVessel /> };
    case "dessert":
      return { geo: dessertGeometry(), node: <DessertGlass /> };
    case "jar":
    default:
      return { geo: jarGeometry(shape === "jar-tall"), node: <JarVessel /> };
  }
}

export function SvgLayerRenderer({
  config,
  revealed,
  showcase,
  className,
}: RendererProps) {
  const vessel = VESSEL_BY_ID[config.vesselId];
  const wax = WAX_BY_ID[config.waxColorId];
  const whip = config.whipId ? WHIP_BY_ID[config.whipId] : null;
  const drizzle = config.drizzleId ? DRIZZLE_BY_ID[config.drizzleId] : null;

  const { geo, node } = useMemo(
    () => geometryFor(vessel?.shape ?? "jar"),
    [vessel?.shape],
  );

  const toppings = useMemo(
    () =>
      config.toppingIds
        .map((id) => TOPPING_BY_ID[id])
        .filter(Boolean)
        .map((t) => ({ id: t.id, hex: t.hex })),
    [config.toppingIds],
  );

  return (
    <div className={cn("relative aspect-square w-full select-none", className)}>
      {/* warm rosy-gold glow bloom on reveal — pre-painted, only opacity animates */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            key="glow"
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                "radial-gradient(circle at 50% 38%, rgba(246,216,154,0.45), rgba(232,196,200,0.18) 40%, transparent 68%)",
            }}
          />
        )}
      </AnimatePresence>

      <svg viewBox="0 0 400 470" className="absolute inset-0 h-full w-full">
        <GlowDefs />
        {/* contact shadow on the marble surface */}
        <ellipse cx="200" cy="410" rx="120" ry="22" fill="url(#surfaceShadow)" />

        {/* recipe spine: vessel → wax → whip → drizzle → toppings → flame */}
        <g key={vessel?.shape}>{node}</g>

        {wax && <WaxFill key={`wax-${wax.id}-${vessel?.id}`} geo={geo} hex={wax.hex} gel={vessel?.gel} />}

        <AnimatePresence mode="popLayout">
          {whip && <WhipTopping key={`whip-${whip.id}`} geo={geo} hex={whip.hex} />}
        </AnimatePresence>

        <AnimatePresence>
          {drizzle && <Drizzle key={`drizzle-${drizzle.id}`} geo={geo} hex={drizzle.hex} />}
        </AnimatePresence>

        <ToppingCluster geo={geo} ids={toppings} />

        {/* Live foil label on the vessel — the name appears as you type it. */}
        {config.name.trim() && (
          <NameLabel name={config.name} geo={geo} />
        )}

        <AnimatePresence>{revealed && <Flame key="flame" geo={geo} />}</AnimatePresence>
      </svg>

      {/* shimmer sweep on reveal */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            key="shimmer"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-1/3"
              style={{
                background:
                  "linear-gradient(105deg, transparent, rgba(227,207,168,0.55), transparent)",
              }}
              initial={{ x: "-50%" }}
              animate={{ x: "450%" }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showcase && (
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-gold/20" />
      )}
    </div>
  );
}

function NameLabel({ name, geo }: { name: string; geo: VesselGeometry }) {
  const { top, w, bottom } = geo.fill;
  const labelW = Math.min(w * 0.82, 150);
  const labelH = 44;
  const cx = 200;
  const cy = top + (bottom - top) * 0.54;
  const text = name.trim().length > 16 ? name.trim().slice(0, 15) + "…" : name.trim();
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <rect
        x={cx - labelW / 2}
        y={cy - labelH / 2}
        width={labelW}
        height={labelH}
        rx="8"
        fill="#FFFAF7"
        fillOpacity="0.92"
        stroke="#C8A15A"
        strokeWidth="1"
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="17"
        fill="#3A2C2A"
      >
        {text}
      </text>
    </motion.g>
  );
}
