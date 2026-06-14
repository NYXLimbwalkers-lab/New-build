import Dexie, { type EntityTable } from "dexie";
import type { BuildConfig, SavedBuild } from "@/data/types";

/*
  Local-first storage (Dexie / IndexedDB). Holds saved builds now; the cart,
  offline kiosk order queue, and party sessions plug into the same DB in later
  phases (tables stubbed below with TODOs).
*/

export interface CartItem {
  id: string;
  kind: "product" | "build" | "bundle";
  refId: string; // productId, savedBuildId, or bundleId
  name: string;
  unitPrice: number;
  qty: number;
  config?: BuildConfig;
  addedAt: number;
}

export interface GiftInfo {
  wrap: boolean;
  note: string;
  recipient: string; // name (+ "ship to recipient" intent)
  receipt: boolean; // gift receipt = hide prices
}

// TODO(Phase 3): queued offline kiosk orders that sync when back online.
export interface QueuedOrder {
  id: string;
  items: CartItem[];
  total: number;
  mode: "storefront" | "kiosk" | "party";
  fulfillment?: "ship" | "pickup";
  pickupNumber?: number;
  gift?: GiftInfo;
  createdAt: number;
  synced: boolean;
}

// TODO(Phase 5): privacy-light analytics events (build steps, add-ons, abandons).
export interface AnalyticsEvent {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  mode: "storefront" | "kiosk" | "party";
  at: number;
}

export interface Favorite {
  id: string; // productId
  addedAt: number;
}

export interface UserReview {
  id: string;
  productId: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  at: number;
}

const db = new Dexie("delaja") as Dexie & {
  builds: EntityTable<SavedBuild, "id">;
  cart: EntityTable<CartItem, "id">;
  orders: EntityTable<QueuedOrder, "id">;
  events: EntityTable<AnalyticsEvent, "id">;
  favorites: EntityTable<Favorite, "id">;
  userReviews: EntityTable<UserReview, "id">;
};

db.version(1).stores({
  builds: "id, createdAt, mode",
  cart: "id, addedAt",
  orders: "id, createdAt, synced",
  events: "id, at, type",
});

db.version(2).stores({
  builds: "id, createdAt, mode",
  cart: "id, addedAt",
  orders: "id, createdAt, synced",
  events: "id, at, type",
  favorites: "id, addedAt",
});

db.version(3).stores({
  builds: "id, createdAt, mode",
  cart: "id, addedAt",
  orders: "id, createdAt, synced",
  events: "id, at, type",
  favorites: "id, addedAt",
  userReviews: "id, productId, at",
});

export { db };

/* ── Helpers ──────────────────────────────────────────────────────────── */

const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export async function saveBuild(
  config: BuildConfig,
  price: number,
  mode: SavedBuild["mode"] = "storefront",
): Promise<SavedBuild> {
  const build: SavedBuild = {
    id: uid(),
    name: config.name.trim() || "Untitled Creation",
    config,
    price,
    createdAt: Date.now(),
    mode,
  };
  await db.builds.add(build);
  return build;
}

export async function logEvent(
  type: string,
  payload?: Record<string, unknown>,
  mode: AnalyticsEvent["mode"] = "storefront",
) {
  try {
    await db.events.add({ id: uid(), type, payload, mode, at: Date.now() });
  } catch {
    // Analytics is best-effort; never block the UI.
  }
}
