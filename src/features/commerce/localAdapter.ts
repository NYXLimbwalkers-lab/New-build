import { db } from "@/db/db";
import type { CommerceAdapter, OrderDraft, OrderResult } from "./types";

/*
  The default adapter: a made-to-order request queue in IndexedDB. Works fully
  offline (kiosk + spotty wifi), survives reloads, and is what the Owner
  dashboard reads. When a real backend is connected, a sync worker can drain
  `db.orders` where `synced === false`.
*/

const uid = () =>
  crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function orderNumber(): string {
  return `DJ-${1000 + Math.floor(Math.random() * 9000)}`;
}

/** Monotonic counter shown at the counter (100–999, wraps; never #0). */
function nextPickup(): number {
  let n = (Number(localStorage.getItem("delaja_pickup") || "99") + 1) % 1000;
  if (n < 100) n = 100; // keep it a friendly 3-digit number, never #0
  localStorage.setItem("delaja_pickup", String(n));
  return n;
}

export const localAdapter: CommerceAdapter = {
  id: "local",
  takesPayment: false,
  async placeOrder(draft: OrderDraft): Promise<OrderResult> {
    const pickupNumber =
      draft.fulfillment === "pickup" || draft.mode === "kiosk"
        ? nextPickup()
        : undefined;
    const orderNo = orderNumber();
    await db.orders.add({
      id: uid(),
      orderNo,
      items: draft.items,
      total: draft.total,
      mode: draft.mode,
      fulfillment: draft.fulfillment,
      pickupNumber,
      gift: draft.gift,
      contact: draft.contact,
      createdAt: Date.now(),
      synced: false,
    });
    return { orderNo, pickupNumber, synced: false };
  },
};
