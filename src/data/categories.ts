import type { Category } from "./types";

/** Mirror her real shop taxonomy. */
export const CATEGORIES: Category[] = [
  { id: "dessert", name: "Dessert Candles", blurb: "Whipped, drizzled, good enough to eat." },
  { id: "bakery", name: "Bakery", blurb: "Fresh from the oven, in wax." },
  { id: "fruity", name: "Fruity", blurb: "Bright, juicy, sun-ripe." },
  { id: "boozy", name: "Boozy & Drinks", blurb: "Gel-wax pours in a stemmed glass." },
  { id: "floral", name: "Floral", blurb: "Sculpted petals, soft and refined." },
  { id: "seasonal", name: "Seasonal & Limited", blurb: "Small-batch, made for the moment." },
  { id: "wax-melts", name: "Wax Melts", blurb: "Scoopable, flameless indulgence." },
  { id: "body-care", name: "Body Care", blurb: "Whipped body butters, same beloved scents." },
  { id: "accessories", name: "Accessories", blurb: "Carry the scent everywhere." },
];

export const CATEGORY_NAME: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.name]),
);
