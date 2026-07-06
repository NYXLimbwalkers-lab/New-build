/*
  Domain types for DéLa Já — The Candle Patisserie.
  Every dessert candle = a stack of swappable parts (the "recipe spine"):
    vessel → base wax + color → scent → whipped topping → drizzle → toppings → finishing
  These types are shared by the menu, the Candle Bar builder, the preview engine,
  and the (stubbed) commerce adapters.
*/

export type ScentFamily =
  | "Dessert"
  | "Bakery"
  | "Fruity"
  | "Fresh"
  | "Woody"
  | "Boozy";

export type CategoryId =
  | "dessert"
  | "bakery"
  | "fruity"
  | "boozy"
  | "floral"
  | "seasonal"
  | "wax-melts"
  | "body-care"
  | "accessories";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export interface Product {
  id: string;
  name: string;
  size: string; // e.g. "14 oz" or "—"
  price: number; // USD
  category: CategoryId;
  scentFamily: ScentFamily;
  looksLike: string;
  smellsLike: string;
  notes: string;
  /** Hero image — remote source URL from her site (Appendix A). */
  image?: string;
  /** Additional angles for the detail gallery (falls back to [image]). */
  images?: string[];
  badges?: ("bestseller" | "new" | "staff-pick" | "seasonal")[];
  /** Month numbers (1-12) this item should be surfaced on the seasonal rail. */
  seasonalMonths?: number[];
  /** Optional starting build so "Start from a Favorite" can load it into the Bar. */
  recipe?: Partial<BuildConfig>;
}

/* ── Ingredient library ───────────────────────────────────────────────── */

export type IngredientKind =
  | "vessel"
  | "wax"
  | "whip"
  | "drizzle"
  | "topping";

export interface Vessel {
  id: string;
  name: string;
  /** "wine" is the gel-only path; "heart" is the flameless wax-melt tin. */
  shape: "jar" | "wine" | "tin" | "dessert" | "heart";
  /** Whether this vessel uses gel wax (the "drink" path). */
  gel: boolean;
  price: number; // base price for a build in this vessel
  /** Soft cap on number of toppings this vessel can hold elegantly. */
  toppingCap: number;
}

/** How the whipped top is formed — all styles pipe from the same whip colors. */
export type TopStyle = "pile" | "swirl" | "scoop" | "rose";

export interface WaxColor {
  id: string;
  name: string;
  /** Display tint for the poured wax fill. */
  hex: string;
  /** Restrict to gel vessels if true (drink colors). */
  gelOnly?: boolean;
}

export interface Scent {
  id: string;
  name: string;
  family: ScentFamily;
}

export interface WhipColor {
  id: string;
  name: string;
  hex: string;
}

export interface Drizzle {
  id: string;
  name: string;
  hex: string;
}

export interface Topping {
  id: string;
  name: string;
  /** Primary color used by the SVG/PNG layer. */
  hex: string;
  price: number;
  /** Relative "weight" toward the vessel's soft topping cap. */
  weight: number;
}

export type WickType = "cotton" | "wood";
export type ScentStrength = "light" | "medium" | "strong";

/* ── A complete build ─────────────────────────────────────────────────── */

export interface BuildConfig {
  vesselId: string;
  waxColorId: string; // base (bottom) wax layer color
  /** Extra wax layers poured ABOVE the base, bottom→top. Each +price. */
  extraLayers: string[];
  /**
   * Scent of each wax layer, index-aligned to [waxColorId, ...extraLayers].
   * Length always equals the number of wax layers — she scents each pour.
   */
  layerScents: string[];
  strength: ScentStrength;
  whipId: string | null;
  /** Scent of the whipped topping (null when there's no whip). */
  whipScentId: string | null;
  /** Shape of the whipped top: piped pile, soft-serve swirl, ice-cream scoop,
   *  or sculpted rose. Only meaningful when whipId is set. */
  topStyle: TopStyle;
  drizzleId: string | null;
  /** Scent of the drizzle (null when there's no drizzle). */
  drizzleScentId: string | null;
  toppingIds: string[];
  /** Optional scent per topping (toppingId → scentId). */
  toppingScents: Record<string, string>;
  name: string;
  wick: WickType;
  giftBox: boolean;
}

export interface PricedAddon {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  base: number;
  addons: PricedAddon[];
  total: number;
}

/** A build the customer named & saved (persisted to IndexedDB). */
export interface SavedBuild {
  id: string;
  name: string;
  config: BuildConfig;
  price: number;
  createdAt: number;
  /** Where it was made — for analytics (AOV by mode). */
  mode: "storefront" | "kiosk" | "party";
}
