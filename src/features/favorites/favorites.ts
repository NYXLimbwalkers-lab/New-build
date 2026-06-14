import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";

/*
  Wishlist / favorites — saved locally (IndexedDB). A heart on any product card
  toggles it; the menu board can filter to just saved.
*/
export async function toggleFavorite(productId: string) {
  const existing = await db.favorites.get(productId);
  if (existing) await db.favorites.delete(productId);
  else await db.favorites.add({ id: productId, addedAt: Date.now() });
}

/** Live set of favorited product ids. */
export function useFavorites(): Set<string> {
  const rows = useLiveQuery(() => db.favorites.toArray(), [], []);
  return new Set(rows.map((r) => r.id));
}
