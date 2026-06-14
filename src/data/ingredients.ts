import type {
  Drizzle,
  Scent,
  Topping,
  Vessel,
  WaxColor,
  WhipColor,
} from "./types";

/*
  The ingredient library = the menu of parts for the Candle Bar.
  Phase 1 ships a deliberately SMALL but complete set to prove the full loop
  end-to-end; the structures below are built to expand — drop in more entries
  (and matching layer art) without touching the builder. See README.
*/

export const VESSELS: Vessel[] = [
  { id: "jar-14", name: "Glass Jar · 14 oz", shape: "jar", gel: false, price: 24, toppingCap: 5 },
  { id: "jar-12", name: "Glass Jar · 12 oz", shape: "jar", gel: false, price: 22, toppingCap: 4 },
  { id: "tin", name: "Tin · 7 oz", shape: "tin", gel: false, price: 18, toppingCap: 3 },
  { id: "dessert-glass", name: "Dessert Glass", shape: "dessert", gel: false, price: 23, toppingCap: 5 },
  { id: "wine", name: "Stemmed Wine Glass", shape: "wine", gel: true, price: 29.5, toppingCap: 0 },
];

export const WAX_COLORS: WaxColor[] = [
  { id: "ivory", name: "Ivory", hex: "#F3E9DD" },
  { id: "cream", name: "Vanilla Cream", hex: "#F4E4C9" },
  { id: "honey", name: "Honey", hex: "#E8C98A" },
  { id: "caramel", name: "Caramel", hex: "#D9A86A" },
  { id: "strawberry", name: "Strawberry", hex: "#EBB7BE" },
  { id: "orange-cream", name: "Orange Cream", hex: "#F1C79A" },
  { id: "cocoa", name: "Cocoa", hex: "#9C6B4F" },
  // Gel "drink" colors — only valid in the wine glass.
  { id: "garnet-gel", name: "Garnet (Gel)", hex: "#7A1F3D", gelOnly: true },
  { id: "blue-gel", name: "Twilight (Gel)", hex: "#3E5A8A", gelOnly: true },
  { id: "rose-gel", name: "Rosé (Gel)", hex: "#C77F8E", gelOnly: true },
];

export const SCENTS: Scent[] = [
  { id: "vanilla", name: "Vanilla Bean", family: "Dessert" },
  { id: "marshmallow", name: "Toasted Marshmallow", family: "Dessert" },
  { id: "cheesecake", name: "Strawberry Cheesecake", family: "Dessert" },
  { id: "snickerdoodle", name: "Snickerdoodle", family: "Bakery" },
  { id: "maple", name: "Maple Bourbon", family: "Bakery" },
  { id: "honey-butter", name: "Salted Honey Butter", family: "Bakery" },
  { id: "strawberry", name: "Ripe Strawberry", family: "Fruity" },
  { id: "orange", name: "Orange Cream", family: "Fruity" },
  { id: "blackberry", name: "Blackberry", family: "Fruity" },
  { id: "white-tea", name: "White Tea", family: "Fresh" },
  { id: "linen", name: "Fresh Linen", family: "Fresh" },
  { id: "sandalwood", name: "Sandalwood", family: "Woody" },
  { id: "driftwood", name: "Driftwood & Amber", family: "Woody" },
  { id: "merlot", name: "Black Cherry Merlot", family: "Boozy" },
  { id: "margarita", name: "Blackberry Margarita", family: "Boozy" },
];

export const WHIP_COLORS: WhipColor[] = [
  { id: "whip-vanilla", name: "Vanilla", hex: "#FBF3E4" },
  { id: "whip-butter", name: "Buttercream", hex: "#F6E4B8" },
  { id: "whip-strawberry", name: "Strawberry", hex: "#F4CAD2" },
  { id: "whip-chocolate", name: "Chocolate", hex: "#B08054" },
  { id: "whip-mint", name: "Mint", hex: "#CFE4D2" },
  { id: "whip-lavender", name: "Lavender", hex: "#D8CCE6" },
];

export const DRIZZLES: Drizzle[] = [
  { id: "caramel", name: "Caramel", hex: "#B5763C" },
  { id: "chocolate", name: "Chocolate", hex: "#5A3825" },
  { id: "berry", name: "Berry Syrup", hex: "#9C2F52" },
  { id: "honey", name: "Honey", hex: "#D9A441" },
];

export const TOPPINGS: Topping[] = [
  { id: "strawberry", name: "Strawberry", hex: "#D94C5E", price: 2, weight: 2 },
  { id: "blueberry", name: "Blueberry", hex: "#4A5B93", price: 2, weight: 1 },
  { id: "orange-slice", name: "Orange Slice", hex: "#E89B3C", price: 2, weight: 2 },
  { id: "waffle", name: "Waffle Piece", hex: "#D9A86A", price: 3, weight: 2 },
  { id: "sprinkles", name: "Sprinkles", hex: "#E8A0C0", price: 1.5, weight: 1 },
  { id: "pecan", name: "Pecans", hex: "#8A5A33", price: 2.5, weight: 1 },
  { id: "crumble", name: "Crumble", hex: "#C89B62", price: 2, weight: 1 },
  { id: "candy", name: "Candy", hex: "#5BB5C4", price: 2, weight: 1 },
  { id: "marshmallow", name: "Marshmallow", hex: "#FBF6EE", price: 2, weight: 2 },
  { id: "cherry", name: "Cherry on Top", hex: "#C42C3E", price: 2, weight: 1 },
];

/* Finishing add-on prices (also referenced by the Phase 2 upsell prompts). */
export const FINISHING_PRICES = {
  woodWick: 1.5,
  giftBox: 5,
  scentBlend: 2, // adding a 2nd/3rd scent
  strongScent: 1.5,
} as const;

/* Lookup maps */
export const VESSEL_BY_ID = Object.fromEntries(VESSELS.map((v) => [v.id, v]));
export const WAX_BY_ID = Object.fromEntries(WAX_COLORS.map((w) => [w.id, w]));
export const SCENT_BY_ID = Object.fromEntries(SCENTS.map((s) => [s.id, s]));
export const WHIP_BY_ID = Object.fromEntries(WHIP_COLORS.map((w) => [w.id, w]));
export const DRIZZLE_BY_ID = Object.fromEntries(DRIZZLES.map((d) => [d.id, d]));
export const TOPPING_BY_ID = Object.fromEntries(TOPPINGS.map((t) => [t.id, t]));

export const SCENT_FAMILIES = [
  "Dessert",
  "Bakery",
  "Fruity",
  "Fresh",
  "Woody",
  "Boozy",
] as const;
