import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import {
  DRIZZLE_BY_ID,
  TOPPING_BY_ID,
  WAX_BY_ID,
  WHIP_BY_ID,
} from "@/data/ingredients";
import { SPRING } from "@/lib/motionPresets";
import { cn } from "@/lib/cn";
import type { RendererProps } from "./types";
import type { LayerEntry, LayerManifest } from "./layerManifest";

/*
  REAL-PHOTO compositing engine. Stacks full-frame transparent-PNG photo layers
  cut from her real product shots, in recipe order, each animating in with the
  Confiserie motion. Color-specific layers show as-is; neutral layers tagged
  `tint` are recolored to the chosen ingredient color via a CSS mask (GPU-only
  transform/opacity animate, so it stays 60fps). Same swappable contract as the
  vector renderer — chosen automatically when the layer library exists.
*/
interface EnterSpec {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: Transition;
  style?: CSSProperties;
}

const ENTER: Record<string, EnterSpec> = {
  pour: { initial: { opacity: 0, scaleY: 0.6 }, animate: { opacity: 1, scaleY: 1 }, transition: SPRING.pour, style: { transformOrigin: "50% 100%" } },
  pipe: { initial: { opacity: 0, scale: 0.4, y: 24 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: SPRING.pipe },
  drizzle: { initial: { opacity: 0, y: -16 }, animate: { opacity: 1, y: 0 }, transition: SPRING.drizzle },
  drop: { initial: { opacity: 0, y: -50 }, animate: { opacity: 1, y: 0 }, transition: SPRING.drop },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: SPRING.gentle },
};

function Layer({
  entry,
  z,
  hex,
  layoutKey,
}: {
  entry: LayerEntry;
  z: number;
  hex?: string;
  layoutKey: string;
}) {
  const anim = ENTER[entry.enter ?? "fade"];

  return (
    <motion.div
      key={layoutKey}
      className="absolute inset-0"
      style={{ zIndex: z, willChange: "transform, opacity", ...(anim.style ?? {}) }}
      initial={anim.initial}
      animate={anim.animate}
      exit={{ opacity: 0 }}
      transition={anim.transition}
    >
      {entry.tint && hex ? (
        // Recolor a neutral layer to the chosen color via its own alpha mask.
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: hex,
            WebkitMaskImage: `url(${entry.src})`,
            maskImage: `url(${entry.src})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      ) : (
        <img
          src={entry.src}
          alt=""
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}
    </motion.div>
  );
}

export function PhotoLayerRenderer({
  config,
  manifest,
  revealed,
  showcase,
  className,
}: RendererProps & { manifest: LayerManifest }) {
  const layers = useMemo(() => {
    const out: { entry: LayerEntry; hex?: string; key: string }[] = [];
    const vessel = manifest.vessel?.[config.vesselId];
    if (vessel) out.push({ entry: { ...vessel, enter: vessel.enter ?? "fade" }, key: `v-${config.vesselId}` });

    // Every wax layer, bottom→top (a parfait must not collapse to one fill).
    [config.waxColorId, ...(config.extraLayers ?? [])].forEach((colorId, li) => {
      const wax = manifest.wax?.[colorId];
      if (wax)
        out.push({
          entry: { ...wax, enter: wax.enter ?? "pour" },
          hex: WAX_BY_ID[colorId]?.hex,
          key: `wax-${li}-${colorId}`,
        });
    });

    if (config.whipId) {
      const whip = manifest.whip?.[config.whipId];
      if (whip) out.push({ entry: { ...whip, enter: whip.enter ?? "pipe" }, hex: WHIP_BY_ID[config.whipId]?.hex, key: `whip-${config.whipId}` });
    }
    if (config.drizzleId) {
      const dz = manifest.drizzle?.[config.drizzleId];
      if (dz) out.push({ entry: { ...dz, enter: dz.enter ?? "drizzle" }, hex: DRIZZLE_BY_ID[config.drizzleId]?.hex, key: `dz-${config.drizzleId}` });
    }
    for (const id of config.toppingIds) {
      const t = manifest.topping?.[id];
      if (t) out.push({ entry: { ...t, enter: t.enter ?? "drop" }, hex: TOPPING_BY_ID[id]?.hex, key: `top-${id}` });
    }
    return out;
  }, [config, manifest]);

  return (
    <div className={cn("relative aspect-square w-full select-none", className)}>
      <AnimatePresence>
        {revealed && (
          <motion.div
            key="glow"
            className="pointer-events-none absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background:
                "radial-gradient(circle at 50% 38%, rgba(246,216,154,0.4), transparent 65%)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {layers.map((l, i) => (
          <Layer key={l.key} layoutKey={l.key} entry={l.entry} z={i + 1} hex={l.hex} />
        ))}
      </AnimatePresence>

      {showcase && (
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-gold/20" />
      )}
    </div>
  );
}
