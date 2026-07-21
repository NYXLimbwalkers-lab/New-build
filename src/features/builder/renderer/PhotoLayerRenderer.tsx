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
import { layerFor, OPAQUE_VESSELS, type LayerEntry, type LayerManifest } from "./layerManifest";

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
    const v = config.vesselId;
    const vessel = manifest.vessel?.[v];
    if (vessel) out.push({ entry: { ...vessel, enter: vessel.enter ?? "fade" }, key: `v-${v}` });

    // Every wax layer, bottom→top (a parfait must not collapse to one fill).
    // Keys are SLOT-based (not color-based) so a color swap recolors the
    // mounted layer in place instead of replaying the whole pour animation.
    // Glass 2-layer parfaits composite from real half-pour bands (@hb/@ht);
    // opaque vessels show only their LAST pour (metal hides the rest).
    const extras = config.extraLayers ?? [];
    const waxSlots: { colorId: string; lookup: string }[] =
      extras.length === 0
        ? [{ colorId: config.waxColorId, lookup: config.waxColorId }]
        : OPAQUE_VESSELS.has(v)
          ? [{ colorId: extras[extras.length - 1], lookup: extras[extras.length - 1] }]
          : extras.length === 1
            ? [
                { colorId: config.waxColorId, lookup: `${config.waxColorId}@hb` },
                { colorId: extras[0], lookup: `${extras[0]}@ht` },
              ]
            : []; // 3+ glass layers never reach photo mode (manifestCovers gates)
    waxSlots.forEach(({ colorId, lookup }, li) => {
      const wax = layerFor(manifest, "wax", v, lookup);
      if (wax)
        out.push({
          entry: { ...wax, enter: wax.enter ?? "pour" },
          hex: WAX_BY_ID[colorId]?.hex,
          key: `wax-${li}`,
        });
    });

    if (config.whipId) {
      const whip = layerFor(manifest, "whip", v, config.whipId);
      if (whip) out.push({ entry: { ...whip, enter: whip.enter ?? "pipe" }, hex: WHIP_BY_ID[config.whipId]?.hex, key: "whip" });
    }
    if (config.drizzleId) {
      const dz = layerFor(manifest, "drizzle", v, config.drizzleId);
      if (dz) out.push({ entry: { ...dz, enter: dz.enter ?? "drizzle" }, hex: DRIZZLE_BY_ID[config.drizzleId]?.hex, key: "dz" });
    }
    for (const id of config.toppingIds) {
      const t = layerFor(manifest, "topping", v, id);
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
