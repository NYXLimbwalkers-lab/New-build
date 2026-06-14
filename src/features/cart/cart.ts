import { useLiveQuery } from "dexie-react-hooks";
import { db, logEvent, type CartItem } from "@/db/db";
import type { BuildConfig, Product } from "@/data/types";
import type { AppMode } from "@/lib/mode";

/*
  Local-first cart (Dexie). Works offline + on the kiosk; a Phase-2 commerce
  adapter will sync this to WooCommerce/Square at checkout.
*/
const FREE_SHIP_THRESHOLD = 75;

const uid = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export async function addProductToCart(product: Product, mode: AppMode = "storefront") {
  // Merge with an existing identical product line.
  const existing = await db.cart.where("refId").equals(product.id).first();
  if (existing && existing.kind === "product") {
    await db.cart.update(existing.id, { qty: existing.qty + 1 });
  } else {
    const item: CartItem = {
      id: uid(),
      kind: "product",
      refId: product.id,
      name: product.name,
      unitPrice: product.price,
      qty: 1,
      addedAt: Date.now(),
    };
    await db.cart.add(item);
  }
  logEvent("add_to_cart", { kind: "product", refId: product.id }, mode);
}

export async function addBuildToCart(
  config: BuildConfig,
  price: number,
  mode: AppMode = "storefront",
) {
  const item: CartItem = {
    id: uid(),
    kind: "build",
    refId: uid(),
    name: config.name.trim() || "Custom Creation",
    unitPrice: price,
    qty: 1,
    config,
    addedAt: Date.now(),
  };
  await db.cart.add(item);
  logEvent("add_to_cart", { kind: "build", price }, mode);
}

export const setQty = (id: string, qty: number) =>
  qty <= 0 ? db.cart.delete(id) : db.cart.update(id, { qty });

export const removeFromCart = (id: string) => db.cart.delete(id);
export const clearCart = () => db.cart.clear();

export interface CartSummary {
  items: CartItem[];
  count: number;
  subtotal: number;
  toFreeShipping: number;
  freeShippingPct: number;
  qualifiesFreeShipping: boolean;
}

/** Live cart summary — updates anywhere the cart changes, no manual refresh. */
export function useCart(): CartSummary {
  const items = useLiveQuery(() => db.cart.orderBy("addedAt").toArray(), [], []);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const toFreeShipping = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  return {
    items,
    count,
    subtotal: Math.round(subtotal * 100) / 100,
    toFreeShipping: Math.round(toFreeShipping * 100) / 100,
    freeShippingPct: Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100),
    qualifiesFreeShipping: subtotal >= FREE_SHIP_THRESHOLD,
  };
}

export { FREE_SHIP_THRESHOLD };
