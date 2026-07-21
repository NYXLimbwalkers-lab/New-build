import type { CartItem, ContactInfo, GiftInfo } from "@/db/db";

/*
  The commerce seam. Everything that "places an order" goes through a single
  CommerceAdapter so the rest of the app never knows whether it's talking to the
  local IndexedDB queue, Square, or WooCommerce. To ship real payments you write
  ONE new adapter and flip getAdapter() — no UI changes.
*/

export interface OrderDraft {
  items: CartItem[];
  total: number;
  mode: "storefront" | "kiosk" | "party";
  fulfillment?: "ship" | "pickup";
  gift?: GiftInfo;
  contact?: ContactInfo;
}

export interface OrderResult {
  /** Human-facing order number (e.g. "DJ-1042"). */
  orderNo: string;
  /** Counter pickup number for kiosk/in-store flows. */
  pickupNumber?: number;
  /** A hosted-checkout / payment link if the adapter defers payment. */
  paymentUrl?: string;
  /** Did the order reach a remote backend, or is it queued locally? */
  synced: boolean;
}

export interface CommerceAdapter {
  readonly id: string;
  /** Whether this adapter takes payment now (vs. pay-at-pickup / send a link). */
  readonly takesPayment: boolean;
  placeOrder(draft: OrderDraft): Promise<OrderResult>;
}
