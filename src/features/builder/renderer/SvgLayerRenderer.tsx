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
  CreamSwirl,
  Drizzle,
  Flame,
  GlowDefs,
  JarVessel,
  NameLabel,
  SurfaceShadow,
  ToppingCluster,
  WineGlass,
} from "./svgParts";

/*
  The default preview engine: semi-realistic, parametric candle art composited in
  recipe order with the Confiserie animations. Satisfies the swappable
  RendererProps contract — real transparent-PNG photo layers (PhotoLayerRenderer)
  replace this automatically once the layer library exists.
*/
export function SvgLayerRenderer({ config, revealed, showcase, className }: RendererProps) {
  const vessel = VESSEL_BY_ID[config.vesselId];
  const whip = config.whipId ? WHIP_BY_ID[config.whipId] : null;
  const drizzle = config.drizzleId ? DRIZZLE_BY_ID[config.drizzleId] : null;
  const drink = vessel?.gel ?? false;
  const layerHexes = useMemo(
    () =>
      [config.waxColorId, ...config.extraLayers].map(
        (id) => WAX_BY_ID[id]?.hex ?? "#F0D9AE",
      ),
    [config.waxColorId, config.extraLayers],
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
                "radial-gradient(circle at 50% 26%, rgba(248,216,154,0.4), transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

      <svg viewBox="0 0 600 740" className="absolute inset-0 h-full w-full">
        <GlowDefs />
        <SurfaceShadow />

        {drink ? (
          <WineGlass waxHex={layerHexes[0]} />
        ) : (
          <>
            <JarVessel layers={layerHexes} tin={vessel?.shape === "tin"} />
            <AnimatePresence mode="popLayout">
              {whip && <CreamSwirl key={`whip-${whip.id}`} hex={whip.hex} />}
            </AnimatePresence>
            <AnimatePresence>
              {drizzle && <Drizzle key={`dz-${drizzle.id}`} hex={drizzle.hex} />}
            </AnimatePresence>
            <ToppingCluster ids={toppings} />
          </>
        )}

        {config.name.trim() && <NameLabel name={config.name} />}

        <AnimatePresence>{revealed && <Flame key="flame" />}</AnimatePresence>
      </svg>

      <AnimatePresence>
        {revealed && (
          <motion.div
            key="shimmer"
            className="pointer-events-none absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-y-0 -left-1/3 w-1/3"
              style={{
                background:
                  "linear-gradient(105deg, transparent, rgba(227,207,168,0.5), transparent)",
              }}
              initial={{ x: "-50%" }}
              animate={{ x: "450%" }}
              transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showcase && (
        <div className="pointer-events-none absolute inset-0 ring-1 ring-gold/20" />
      )}
    </div>
  );
}
