import {
  FINISHING_PRICES,
  TOPPING_BY_ID,
  VESSEL_BY_ID,
  VESSELS,
  WAX_COLORS,
} from "./ingredients";
import { PRODUCT_BY_ID } from "./products";
import type {
  BuildConfig,
  PriceBreakdown,
  ScentStrength,
  Vessel,
} from "./types";

/** A sensible, makeable starting build so a guest is never on a blank stage. */
export function defaultBuild(): BuildConfig {
  return {
    vesselId: "jar-14",
    waxColorId: "cream",
    scents: [{ scentId: "vanilla", ratio: 100 }],
    strength: "medium",
    whipId: "whip-vanilla",
    drizzleId: null,
    toppingIds: [],
    name: "",
    wick: "cotton",
    giftBox: false,
  };
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

  // Blending extra scents.
  const extraScents = Math.max(0, config.scents.length - 1);
  if (extraScents > 0) {
    addons.push({
      label: `Scent blend ×${extraScents}`,
      amount: extraScents * FINISHING_PRICES.scentBlend,
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
  if (isDrinkBuild(next)) {
    next.whipId = null;
    next.drizzleId = null;
    next.toppingIds = [];
  }
  return next;
}

/** Load a menu favorite into a full, valid build ("Start from a Favorite"). */
export function buildFromProduct(productId: string): BuildConfig {
  const product = PRODUCT_BY_ID[productId];
  const base = defaultBuild();
  if (!product?.recipe) return base;
  return reconcile({
    ...base,
    ...product.recipe,
    scents: product.recipe.scents ?? base.scents,
    toppingIds: product.recipe.toppingIds ?? base.toppingIds,
    name: product.name,
  });
}

const STRENGTHS: ScentStrength[] = ["light", "medium", "strong"];

/** A tasteful random build for "Surprise Me" (always makeable). */
export function surpriseBuild(): BuildConfig {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

  // Keep it to soy dessert vessels for a coherent, pretty result.
  const soyVessels = VESSELS.filter((v) => !v.gel);
  const vesselId = pick(soyVessels).id;
  const base = defaultBuild();

  const config: BuildConfig = {
    ...base,
    vesselId,
    waxColorId: pick(validWaxColors(vesselId)).id,
    strength: pick(STRENGTHS),
    whipId: pick(["whip-vanilla", "whip-strawberry", "whip-butter", null]),
    drizzleId: pick(["caramel", "chocolate", "berry", null]),
    toppingIds: [],
    name: "",
  };

  // Add 1-3 random toppings within the cap.
  const allToppings = Object.keys(TOPPING_BY_ID);
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const id = pick(allToppings);
    if (!config.toppingIds.includes(id)) config.toppingIds.push(id);
  }
  return reconcile(config);
}
