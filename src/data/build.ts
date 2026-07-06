import {
  DRIZZLE_BY_ID,
  FINISHING_PRICES,
  MAX_LAYERS,
  SCENTS,
  SCENT_BY_ID,
  TOPPING_BY_ID,
  VESSEL_BY_ID,
  VESSELS,
  WAX_BY_ID,
  WAX_COLORS,
  WHIP_BY_ID,
} from "./ingredients";
import { PRODUCT_BY_ID } from "./products";
import type {
  BuildConfig,
  PriceBreakdown,
  ScentStrength,
  Vessel,
} from "./types";

/** The scent every new component starts with until the guest changes it. */
export const DEFAULT_SCENT = "vanilla";

/** A sensible, makeable starting build so a guest is never on a blank stage. */
export function defaultBuild(): BuildConfig {
  return {
    vesselId: "jar-14",
    waxColorId: "cream",
    extraLayers: [],
    layerScents: [DEFAULT_SCENT],
    strength: "medium",
    whipId: "whip-vanilla",
    whipScentId: DEFAULT_SCENT,
    topStyle: "pile",
    drizzleId: null,
    drizzleScentId: null,
    toppingIds: [],
    toppingScents: {},
    name: "",
    wick: "cotton",
    giftBox: false,
  };
}

/** Distinct scents actually in use across all present components. */
export function usedScents(config: BuildConfig): string[] {
  const ids = new Set<string>();
  const drink = isDrinkBuild(config);
  for (const s of config.layerScents ?? []) if (s) ids.add(s);
  if (!drink) {
    if (config.whipId && config.whipScentId) ids.add(config.whipScentId);
    if (config.drizzleId && config.drizzleScentId) ids.add(config.drizzleScentId);
    for (const t of config.toppingIds) {
      const s = config.toppingScents?.[t];
      if (s) ids.add(s);
    }
  }
  return [...ids];
}

/** USD price for a complete build — drives the live price pill. */
export function priceBuild(config: BuildConfig): PriceBreakdown {
  const vessel = VESSEL_BY_ID[config.vesselId];
  const base = vessel ? vessel.price : 24;
  const addons: PriceBreakdown["addons"] = [];

  // Each topping carries its own price.
  for (const id of config.toppingIds) {
    const t = TOPPING_BY_ID[id];
    if (t) addons.push({ label: t.name, amount: t.price });
  }

  // Each distinct fragrance beyond the first means another oil to hand-measure.
  const extraScents = Math.max(0, usedScents(config).length - 1);
  if (extraScents > 0) {
    addons.push({
      label: `Extra scents ×${extraScents}`,
      amount: extraScents * FINISHING_PRICES.scentBlend,
    });
  }

  if (config.extraLayers.length > 0) {
    addons.push({
      label: `Wax layers ×${config.extraLayers.length}`,
      amount: config.extraLayers.length * FINISHING_PRICES.layer,
    });
  }

  if (config.strength === "strong") {
    addons.push({ label: "Extra-strong scent", amount: FINISHING_PRICES.strongScent });
  }

  if (config.wick === "wood") {
    addons.push({ label: "Wood crackle wick", amount: FINISHING_PRICES.woodWick });
  }

  if (config.giftBox) {
    addons.push({ label: "Gift box", amount: FINISHING_PRICES.giftBox });
  }

  const total =
    base + addons.reduce((sum, a) => sum + a.amount, 0);

  return { base, addons, total: Math.round(total * 100) / 100 };
}

export const formatUSD = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * The full, human-readable recipe as [label, value] pairs — what she needs to
 * actually pour the candle: each layer's color + scent, the whip/drizzle/topping
 * scents, strength, wick, gift box. Shared by the cart, owner dashboard, and
 * party card so the build is never reduced to just a name.
 */
export function describeBuild(c: BuildConfig): [string, string][] {
  const lines: [string, string][] = [
    ["Vessel", VESSEL_BY_ID[c.vesselId]?.name ?? c.vesselId],
  ];
  const layers = [c.waxColorId, ...(c.extraLayers ?? [])];
  const layerScents = c.layerScents ?? [];
  const toppingScents = c.toppingScents ?? {};
  const sName = (id?: string | null) => (id ? SCENT_BY_ID[id]?.name ?? id : "");
  layers.forEach((colorId, i) => {
    const label =
      layers.length === 1
        ? "Wax"
        : i === 0
          ? "Base wax"
          : i === layers.length - 1
            ? "Top wax"
            : `Wax layer ${i + 1}`;
    const color = WAX_BY_ID[colorId]?.name ?? colorId;
    const scent = sName(layerScents[i] ?? DEFAULT_SCENT);
    lines.push([label, scent ? `${color} · ${scent}` : color]);
  });
  if (!isDrinkBuild(c)) {
    if (c.whipId) {
      const s = sName(c.whipScentId);
      const styleName = TOP_STYLE_LABEL[c.topStyle ?? "pile"];
      lines.push(["Whip", `${WHIP_BY_ID[c.whipId]?.name ?? c.whipId}${styleName ? ` · ${styleName}` : ""}${s ? ` · ${s}` : ""}`]);
    }
    if (c.drizzleId) {
      const s = sName(c.drizzleScentId);
      lines.push(["Drizzle", `${DRIZZLE_BY_ID[c.drizzleId]?.name ?? c.drizzleId}${s ? ` · ${s}` : ""}`]);
    }
    for (const t of c.toppingIds ?? []) {
      const s = sName(toppingScents[t]);
      lines.push(["Topping", `${TOPPING_BY_ID[t]?.name ?? t}${s ? ` · ${s}` : ""}`]);
    }
  }
  lines.push(["Strength", c.strength]);
  if (isMeltBuild(c)) lines.push(["Wick", "None — flameless wax melt"]);
  else lines.push(["Wick", c.wick === "wood" ? "Wood (crackle)" : "Cotton (silent)"]);
  if (c.giftBox) lines.push(["Gift box", "Yes"]);
  return lines;
}

/** Names for the whipped-top styles (builder chips + recipes + read-aloud). */
export const TOP_STYLE_LABEL: Record<NonNullable<BuildConfig["topStyle"]>, string> = {
  pile: "Piped swirls",
  swirl: "Soft-serve swirl",
  scoop: "Ice-cream scoop",
  rose: "Sculpted rose",
};

/**
 * One spoken/screen-reader sentence describing the whole candle — the live
 * preview is the product, so assistive tech must "see" it too.
 */
export function describeBuildSentence(c: BuildConfig): string {
  const vessel = VESSEL_BY_ID[c.vesselId]?.name ?? "candle";
  const layers = [c.waxColorId, ...(c.extraLayers ?? [])]
    .map((id) => WAX_BY_ID[id]?.name ?? id)
    .join(", ");
  const parts: string[] = [`${vessel} with ${layers} wax`];
  if (!isDrinkBuild(c)) {
    if (c.whipId) {
      parts.push(
        `${WHIP_BY_ID[c.whipId]?.name ?? "whipped"} ${TOP_STYLE_LABEL[c.topStyle ?? "pile"].toLowerCase()} on top`,
      );
    }
    if (c.drizzleId) parts.push(`${DRIZZLE_BY_ID[c.drizzleId]?.name ?? ""} drizzle`.trim());
    if (c.toppingIds.length) {
      parts.push(
        `topped with ${c.toppingIds.map((t) => TOPPING_BY_ID[t]?.name ?? t).join(", ")}`,
      );
    }
  }
  if (isMeltBuild(c)) parts.push("a flameless wax melt");
  return parts.join(", ") + ".";
}

/* ── Invisible validity rules — no hard errors, ever ──────────────────── */

/** Wax colors valid for the current vessel (gel colors only in the wine glass). */
export function validWaxColors(vesselId: string) {
  const vessel = VESSEL_BY_ID[vesselId];
  const isGel = vessel?.gel ?? false;
  return WAX_COLORS.filter((w) => (isGel ? w.gelOnly : !w.gelOnly));
}

/** Vessels valid for the current build (kept simple: all are offered). */
export function validVessels(): Vessel[] {
  return VESSELS;
}

/** Total topping "weight" vs the vessel's soft cap. */
export function toppingLoad(config: BuildConfig) {
  const vessel = VESSEL_BY_ID[config.vesselId];
  const cap = vessel?.toppingCap ?? 0;
  const used = config.toppingIds.reduce(
    (sum, id) => sum + (TOPPING_BY_ID[id]?.weight ?? 1),
    0,
  );
  return { used, cap, full: used >= cap };
}

/**
 * Gel "drink" vessels skip whip/drizzle/toppings. The builder hides those
 * steps; this helper lets any consumer ask the same question.
 */
export function isDrinkBuild(config: BuildConfig) {
  return VESSEL_BY_ID[config.vesselId]?.gel ?? false;
}

/**
 * Wax-MELT builds (heart tin): flameless — no wick, no whip/drizzle, but
 * embeds (toppings) sit right on the creamy fill.
 */
export function isMeltBuild(config: BuildConfig) {
  return VESSEL_BY_ID[config.vesselId]?.shape === "heart";
}

/**
 * Repair a build after a change so it's always producible:
 * - swap to a valid wax color if the vessel changed gel/soy path
 * - clear whip/drizzle/toppings on a gel drink
 */
export function reconcile(config: BuildConfig): BuildConfig {
  const next = { ...config };
  const valid = validWaxColors(next.vesselId);
  if (!valid.some((w) => w.id === next.waxColorId)) {
    next.waxColorId = valid[0]?.id ?? next.waxColorId;
  }
  // keep only valid extra layers, capped (base + up to MAX_LAYERS-1)
  next.extraLayers = (next.extraLayers ?? [])
    .filter((id) => valid.some((w) => w.id === id))
    .slice(0, MAX_LAYERS - 1);

  // Scent per wax layer — keep aligned to the layer count.
  const layerCount = 1 + next.extraLayers.length;
  const ls = [...(next.layerScents ?? [])];
  while (ls.length < layerCount) ls.push(ls[ls.length - 1] ?? DEFAULT_SCENT);
  ls.length = layerCount;
  next.layerScents = ls.map((s) => s || DEFAULT_SCENT);

  // Drizzle physically drapes over the whipped top — with no whip it would
  // hang in mid-air, so it quietly comes off (invisible rule, no hard error).
  if (!next.whipId) {
    next.drizzleId = null;
  }

  // Whip/drizzle carry a scent only when they're present.
  next.whipScentId = next.whipId ? next.whipScentId ?? DEFAULT_SCENT : null;
  next.drizzleScentId = next.drizzleId ? next.drizzleScentId ?? DEFAULT_SCENT : null;

  // Heal builds saved before the top-style feature.
  if (!next.topStyle) next.topStyle = "pile";

  // Topping scents — one per present topping, drop the rest.
  const ts: Record<string, string> = {};
  for (const t of next.toppingIds) ts[t] = next.toppingScents?.[t] ?? DEFAULT_SCENT;
  next.toppingScents = ts;

  if (isDrinkBuild(next)) {
    next.whipId = null;
    next.whipScentId = null;
    next.drizzleId = null;
    next.drizzleScentId = null;
    next.toppingIds = [];
    next.toppingScents = {};
    next.extraLayers = []; // a poured drink is a single fill
    next.layerScents = [next.layerScents[0] ?? DEFAULT_SCENT];
  }

  // Wax melts: flameless heart tin — embeds yes, whip/drizzle/wood-wick no.
  if (isMeltBuild(next)) {
    next.whipId = null;
    next.whipScentId = null;
    next.drizzleId = null;
    next.drizzleScentId = null;
    next.wick = "cotton"; // no wick upsell on a flameless melt
    next.extraLayers = [];
    next.layerScents = [next.layerScents[0] ?? DEFAULT_SCENT];
  }
  return next;
}

/** Load a menu favorite into a full, valid build ("Start from a Favorite"). */
export function buildFromProduct(productId: string): BuildConfig {
  const product = PRODUCT_BY_ID[productId];
  const base = defaultBuild();
  if (!product?.recipe) return base;
  // reconcile() fills in a default scent for every component the recipe adds.
  return reconcile({
    ...base,
    ...product.recipe,
    toppingIds: product.recipe.toppingIds ?? base.toppingIds,
    name: product.name,
  });
}

const STRENGTHS: ScentStrength[] = ["light", "medium", "strong"];

/** A tasteful random build for "Surprise Me" (always makeable). */
export function surpriseBuild(): BuildConfig {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  // Keep it to soy dessert vessels for a coherent, pretty result
  // (no gel drinks, no flameless melt tins in a surprise candle).
  const soyVessels = VESSELS.filter((v) => !v.gel && v.shape !== "heart");
  const vesselId = pick(soyVessels).id;
  const base = defaultBuild();

  const config: BuildConfig = {
    ...base,
    vesselId,
    waxColorId: pick(validWaxColors(vesselId)).id,
    strength: pick(STRENGTHS),
    // A surprise ALWAYS gets a whipped top — her signature look, and the
    // perch that drizzle + toppings visually need (owner's rule).
    whipId: pick(["whip-vanilla", "whip-strawberry", "whip-butter", "whip-chocolate"]),
    topStyle: pick(["pile", "pile", "swirl", "scoop"]),
    drizzleId: pick(["caramel", "chocolate", "berry", null]),
    toppingIds: [],
    name: "",
  };

  // Sometimes a layered parfait (0-2 extra layers).
  const layerColors = validWaxColors(vesselId);
  const nLayers = Math.floor(Math.random() * 3);
  config.extraLayers = Array.from({ length: nLayers }, () => pick(layerColors).id);

  // Add 1-3 random toppings within the cap.
  const allToppings = Object.keys(TOPPING_BY_ID);
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const id = pick(allToppings);
    if (!config.toppingIds.includes(id)) config.toppingIds.push(id);
  }

  // Scent every part — sometimes matching, sometimes a playful mix.
  const scentIds = SCENTS.map((s) => s.id);
  const oneScent = Math.random() < 0.4 ? pick(scentIds) : null;
  const aScent = () => oneScent ?? pick(scentIds);
  config.layerScents = Array.from({ length: 1 + config.extraLayers.length }, aScent);
  config.whipScentId = config.whipId ? aScent() : null;
  config.drizzleScentId = config.drizzleId ? aScent() : null;
  config.toppingScents = Object.fromEntries(config.toppingIds.map((t) => [t, aScent()]));

  return reconcile(config);
}
