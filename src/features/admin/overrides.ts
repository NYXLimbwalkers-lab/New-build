import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/db";
import type { Product } from "@/data/types";

/*
  No-code catalog overrides (price / visibility) applied over the seed catalog.
  Persisted locally now; a Phase-2 commerce adapter syncs these to WooCommerce/
  Square so the owner edits once and it propagates everywhere.
*/
export function useOverrides(): Map<string, { price?: number; hidden?: boolean }> {
  const rows = useLiveQuery(() => db.overrides.toArray(), [], []);
  return new Map(rows.map((r) => [r.id, { price: r.price, hidden: r.hidden }]));
}

export function applyOverride(
  p: Product,
  ov: Map<string, { price?: number; hidden?: boolean }>,
): Product & { hidden?: boolean } {
  const o = ov.get(p.id);
  if (!o) return p;
  return { ...p, price: o.price ?? p.price, hidden: o.hidden };
}

export async function setOverride(id: string, patch: { price?: number; hidden?: boolean }) {
  const existing = (await db.overrides.get(id)) ?? { id };
  await db.overrides.put({ ...existing, ...patch });
}
