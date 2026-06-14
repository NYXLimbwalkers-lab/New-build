import { PRODUCT_BY_ID } from "./products";

/*
  Curated bundles — convenience + a gentle saving (AOV lever). Each references
  real products; `price` is the discounted set price, `compareAt` the sum.
*/
export interface Bundle {
  id: string;
  name: string;
  blurb: string;
  productIds: string[];
  price: number;
}

export const BUNDLES: Bundle[] = [
  {
    id: "date-night-duo",
    name: "Date Night Duo",
    blurb: "Chocolate-covered strawberries + a boozy pour for two.",
    productIds: ["choc-strawberries", "berry-intoxicating"],
    price: 47,
  },
  {
    id: "sweet-tooth-trio",
    name: "Sweet Tooth Trio",
    blurb: "Three dessert bestsellers, beautifully boxed.",
    productIds: ["waffles-ice-cream", "toasted-mellow", "orange-dreamsicle"],
    price: 69,
  },
  {
    id: "treat-yourself",
    name: "Treat Yourself",
    blurb: "A creamy candle and a matching whipped body butter.",
    productIds: ["strawberry-cheesecake-milkshake", "body-butters"],
    price: 29,
  },
];

export function bundleCompareAt(b: Bundle): number {
  return Math.round(
    b.productIds.reduce((s, id) => s + (PRODUCT_BY_ID[id]?.price ?? 0), 0) * 100,
  ) / 100;
}
