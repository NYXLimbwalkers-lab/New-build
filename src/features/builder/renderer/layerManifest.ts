import type { IngredientKind } from "@/data/types";

/*
  LAYER LIBRARY MANIFEST.
  Describes the transparent-PNG photo layers cut from her real product shots,
  all on ONE fixed camera framing so any combination composites into a single
  studio-grade photo. Lives at /public/layers/manifest.json and is produced by
  the asset pipeline (see docs/ASSETS.md). When present, the app renders REAL
  photos; when absent, it falls back to the vector placeholder.
*/
export interface LayerEntry {
  /** Full-frame transparent PNG/WebP at the shared camera framing. */
  src: string;
  /**
   * If true, this is a NEUTRAL base layer to be recolored to the chosen
   * ingredient color at runtime (CSS mask tint). If false/omitted, src is a
   * color-specific real photo and is shown as-is.
   */
  tint?: boolean;
  /** Animation to play when the layer composites in. */
  enter?: "pour" | "pipe" | "drizzle" | "drop" | "fade";
}

export type LayerManifest = {
  /** e.g. manifest.vessel["jar-14"], manifest.whip["whip-vanilla"]. */
  [K in IngredientKind]?: Record<string, LayerEntry>;
} & {
  /** Optional baked hero composites for menu items (instant load). */
  heroes?: Record<string, string>;
  version?: string;
};

/** Vessels whose walls hide the wax — a parfait shows only its top pour. */
export const OPAQUE_VESSELS = new Set(["tin", "heart-tin"]);

/**
 * Look up a part layer, preferring the VESSEL-SCOPED key ("jar-14/cream") over the
 * flat one ("cream"). A wax fill or whipped top only aligns with the vessel it was
 * shot on, so the library ships per-vessel cuts; the flat key stays supported for
 * any part whose geometry is genuinely vessel-independent.
 */
export function layerFor(
  m: LayerManifest,
  kind: IngredientKind,
  vesselId: string,
  id: string,
): LayerEntry | undefined {
  const table = m[kind];
  return table?.[`${vesselId}/${id}`] ?? table?.[id];
}

let cache: Promise<LayerManifest | null> | null = null;

/** Load the layer manifest once. Resolves null if there is no library yet. */
export function loadLayerManifest(): Promise<LayerManifest | null> {
  if (cache) return cache;
  // no-cache = revalidate with ETag (a 304 costs ~nothing) — force-cache pinned users to
  // a STALE manifest after the library grew, silently locking new vessels out of photo
  // mode until their browser cache purged (visual-QA 2026-07-21). Offline still works:
  // the PWA service worker precaches this file per build.
  cache = fetch(`${import.meta.env.BASE_URL}layers/manifest.json`, {
    cache: "no-cache",
  })
    .then((r) => (r.ok ? (r.json() as Promise<LayerManifest>) : null))
    .catch(() => null);
  return cache;
}

/** Does the library contain real layers for every part of this build? */
export function manifestCovers(
  m: LayerManifest,
  parts: {
    vesselId: string;
    waxColorId: string;
    extraLayers?: string[];
    whipId: string | null;
    drizzleId: string | null;
    toppingIds: string[];
  },
): boolean {
  const v = parts.vesselId;
  if (!m.vessel?.[v]) return false;
  const extras = parts.extraLayers ?? [];
  if (extras.length === 0) {
    if (!layerFor(m, "wax", v, parts.waxColorId)) return false;
  } else if (OPAQUE_VESSELS.has(v)) {
    // only the LAST pour is visible through metal — the top color's full fill is honest
    if (!layerFor(m, "wax", v, extras[extras.length - 1])) return false;
  } else if (extras.length === 1) {
    // 2-layer glass parfait composites from real half-pour bands (@hb bottom, @ht top)
    if (!layerFor(m, "wax", v, `${parts.waxColorId}@hb`)) return false;
    if (!layerFor(m, "wax", v, `${extras[0]}@ht`)) return false;
  } else {
    return false; // 3+ layer glass parfaits: no band assets yet — vector draws the bands
  }
  if (parts.whipId && !layerFor(m, "whip", v, parts.whipId)) return false;
  if (parts.drizzleId && !layerFor(m, "drizzle", v, parts.drizzleId)) return false;
  for (const t of parts.toppingIds) if (!layerFor(m, "topping", v, t)) return false;
  return true;
}
