import { motion, AnimatePresence } from "motion/react";
import { useMemo } from "react";
import {
  DRIZZLE_BY_ID,
  TOPPING_BY_ID,
  VESSEL_BY_ID,
  WAX_BY_ID,
  WHIP_BY_ID,
} from "@/data/ingredients";
import { describeBuildSentence, isMeltBuild } from "@/data/build";
import { cn } from "@/lib/cn";
import type { RendererProps } from "./types";
import {
  CreamSwirl,
  DessertGlass,
  Drizzle,
  Flame,
  GlowDefs,
  HeartTin,
  JarVessel,
  NameLabel,
  RoseTop,
  ScoopTop,
  SurfaceShadow,
  SwirlTop,
  TinVessel,
  ToppingCluster,
  WineGlass,
} from "./svgParts";

/*
  The default preview engine: semi-realistic, parametric candle art composited in
  recipe order with the Confiserie animations. Satisfies the swappable
  RendererProps contract — real transparent-PNG photo layers (PhotoLayerRenderer)
  replace this automatically once the layer library exists.
*/

/** Relative visual size per vessel — a 7 oz tin must not render as big as a
 *  14 oz jar. The WHOLE composition (vessel, wax, whip, toppings, flame)
 *  scales together about the ground point, so every part stays seated. */
const VESSEL_SIZE: Record<string, number> = {
  "jar-14": 1,
  "jar-12": 0.91,
  tin: 0.76,
  "dessert-glass": 0.94,
  wine: 1, // 15 oz, but tall & slender — its shape carries the size story
  "heart-tin": 1, // top-down flat-lay; scale language doesn't apply
};
export function SvgLayerRenderer({ config, revealed, showcase, className }: RendererProps) {
  const vessel = VESSEL_BY_ID[config.vesselId];
  const whip = config.whipId ? WHIP_BY_ID[config.whipId] : null;
  const drizzle = config.drizzleId ? DRIZZLE_BY_ID[config.drizzleId] : null;
  const drink = vessel?.gel ?? false;
  const melt = isMeltBuild(config);
  const topStyle = config.topStyle ?? "pile";
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

  // Scoop and rose tops peak lower than the piped pile — the wick reaches
  // down into them; on a gel drink the whole flame roots at the gel surface.
  const wickLen = whip && (topStyle === "scoop" || topStyle === "rose") ? 88 : 40;
  const Top =
    topStyle === "swirl" ? SwirlTop : topStyle === "scoop" ? ScoopTop : topStyle === "rose" ? RoseTop : CreamSwirl;

  return (
    <div
      className={cn("relative aspect-square w-full select-none", className)}
      role="img"
      aria-label={describeBuildSentence(config)}
    >
      <AnimatePresence>
        {revealed && !melt && (
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

      <svg viewBox="0 0 600 740" className="absolute inset-0 h-full w-full" aria-hidden>
        <GlowDefs />
        <g
          transform={
            (VESSEL_SIZE[config.vesselId] ?? 1) !== 1
              ? `translate(300 650) scale(${VESSEL_SIZE[config.vesselId]}) translate(-300 -650)`
              : undefined
          }
        >
          {!melt && <SurfaceShadow />}

          {drink ? (
            <WineGlass waxHex={layerHexes[0]} />
          ) : melt ? (
            <>
              <HeartTin topColor={layerHexes[layerHexes.length - 1]} />
              <ToppingCluster ids={toppings} surface="heart" />
            </>
          ) : (
            <>
              {vessel?.shape === "tin" ? (
                <TinVessel topColor={layerHexes[layerHexes.length - 1]} />
              ) : vessel?.shape === "dessert" ? (
                <DessertGlass layers={layerHexes} />
              ) : (
                <JarVessel layers={layerHexes} />
              )}
              <AnimatePresence mode="popLayout">
                {whip && <Top key={`whip-${whip.id}-${topStyle}`} hex={whip.hex} />}
              </AnimatePresence>
              <AnimatePresence>
                {drizzle && <Drizzle key={`dz-${drizzle.id}`} hex={drizzle.hex} />}
              </AnimatePresence>
              <ToppingCluster ids={toppings} surface={whip ? "cream" : "wax"} />
            </>
          )}

          <AnimatePresence>
            {revealed && !melt && (
              <Flame key="flame" dy={drink ? 96 : 0} wickLen={wickLen} />
            )}
          </AnimatePresence>
        </g>

        {/* name plate stays unscaled — always readable, even on the 7 oz tin */}
        {config.name.trim() && !melt && <NameLabel name={config.name} />}
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
