import { localAdapter } from "./localAdapter";
import type { CommerceAdapter, OrderDraft, OrderResult } from "./types";

/*
  SQUARE adapter — hosted checkout via Square Payment Links.

  The site is a static SPA (GitHub Pages), so the Square access token can
  never live in the browser. A tiny worker (server/square-checkout-worker.js,
  deploy-ready for Cloudflare Workers' free tier) holds the secret and turns
  an order draft into a Square-hosted checkout URL.

  Flow:
    1. Record the order in the LOCAL made-to-order queue first — offline-safe,
       and the Owner dashboard keeps seeing every order either way.
    2. Ask the worker for a Square Payment Link for the same line items.
    3. Hand the paymentUrl back; the cart redirects the guest to Square.
  Kiosk orders skip payment links entirely — in-store is pay-at-the-counter,
  the printed ticket IS the flow.

  Config (set both to go live — see docs/SQUARE-SETUP.md):
    VITE_COMMERCE=square
    VITE_SQUARE_CHECKOUT_URL=https://<worker>.workers.dev/checkout
*/

const ENDPOINT = import.meta.env.VITE_SQUARE_CHECKOUT_URL as string | undefined;

export const squareAdapter: CommerceAdapter = {
  id: "square",
  takesPayment: true,

  async placeOrder(draft: OrderDraft): Promise<OrderResult> {
    // In-store kiosk pays at the counter — the local ticket queue is the flow.
    if (draft.mode === "kiosk" || !ENDPOINT) {
      return localAdapter.placeOrder(draft);
    }

    // 1. Local record first: her dashboard sees the order even if Square
    //    (or the network) hiccups after this point.
    const local = await localAdapter.placeOrder(draft);

    try {
      // 2. Minimal, price-explicit payload — the worker never trusts totals,
      //    it rebuilds the link from these line items.
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderNo: local.orderNo,
          redirectUrl: `${window.location.origin}${import.meta.env.BASE_URL}?paid=${local.orderNo}`,
          lineItems: draft.items.map((i) => ({
            name: i.name.slice(0, 120),
            quantity: Math.max(1, Math.min(99, Math.round(i.qty))),
            amountCents: Math.round(i.unitPrice * 100),
          })),
        }),
      });
      if (!res.ok) throw new Error(`checkout worker ${res.status}`);
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("no url");
      // 3. Same order number everywhere; payment happens on Square's page.
      return { ...local, paymentUrl: url, synced: true };
    } catch {
      // Payment link failed — the order is still safely queued locally;
      // she can send an invoice from the Square dashboard instead.
      return local;
    }
  },
};
