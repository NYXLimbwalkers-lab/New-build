import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";
import { toast } from "@/lib/toast";

/*
  Wishlist / favorites — saved locally (IndexedDB). A heart on any product card
  toggles it; the menu board can filter to just saved.
*/
export async function toggleFavorite(productId: string) {
  const existing = await db.favorites.get(productId);
  if (existing) {
    await db.favorites.delete(productId);
    toast("Removed from saved");
  } else {
    await db.favorites.add({ id: productId, addedAt: Date.now() });
    toast("Saved to favorites ♥");
  }
}

/** Live set of favorited product ids. */
export function useFavorites(): Set<string> {
  const rows = useLiveQuery(() => db.favorites.toArray(), [], []);
  return new Set(rows.map((r) => r.id));
}
