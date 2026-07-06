/*
  DéLa Já — Square checkout worker (Cloudflare Workers, free tier).

  Holds the Square secret so the static site never can. Receives an order
  draft from the SPA and returns a Square-hosted Payment Link URL.

  ── Deploy (one time, ~5 minutes) ─────────────────────────────────────────
  1. npm i -g wrangler && wrangler login
  2. wrangler deploy server/square-checkout-worker.js --name delaja-checkout
  3. wrangler secret put SQUARE_ACCESS_TOKEN     (from her Square Developer app)
  4. wrangler secret put SQUARE_LOCATION_ID      (Square Dashboard → Locations)
     Optional: wrangler secret put SQUARE_ENV    ("sandbox" while testing;
                                                  defaults to "production")
  5. Point the site at it:  VITE_SQUARE_CHECKOUT_URL=https://delaja-checkout.<acct>.workers.dev/checkout
  Full walkthrough: docs/SQUARE-SETUP.md
*/

const ALLOWED_ORIGINS = [
  "https://nyxlimbwalkers-lab.github.io",
  "https://delajacandles.com",
  "https://www.delajacandles.com",
  "http://localhost:5173",
];

const cors = (origin) => ({
  "access-control-allow-origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type",
});

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") ?? "";
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors(origin) });
    }
    if (request.method !== "POST") {
      return new Response("POST /checkout", { status: 405, headers: cors(origin) });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad json" }, 400, origin);
    }

    // ── Validate: never trust client math or shapes ──
    const orderNo = String(body.orderNo ?? "").slice(0, 24);
    const redirectUrl = String(body.redirectUrl ?? "");
    const items = Array.isArray(body.lineItems) ? body.lineItems.slice(0, 40) : [];
    if (!orderNo || items.length === 0) return json({ error: "empty order" }, 400, origin);
    if (!ALLOWED_ORIGINS.some((o) => redirectUrl.startsWith(o))) {
      return json({ error: "bad redirect" }, 400, origin);
    }
    const lineItems = [];
    for (const i of items) {
      const cents = Math.round(Number(i.amountCents));
      const qty = Math.round(Number(i.quantity));
      if (!Number.isFinite(cents) || cents < 50 || cents > 100000) return json({ error: "bad amount" }, 400, origin);
      if (!Number.isFinite(qty) || qty < 1 || qty > 99) return json({ error: "bad qty" }, 400, origin);
      lineItems.push({
        name: String(i.name ?? "Custom candle").slice(0, 120),
        quantity: String(qty),
        base_price_money: { amount: cents, currency: "USD" },
      });
    }

    const host =
      (env.SQUARE_ENV ?? "production") === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";

    const res = await fetch(`${host}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
        "content-type": "application/json",
        "square-version": "2025-05-21",
      },
      body: JSON.stringify({
        idempotency_key: `delaja-${orderNo}`,
        order: {
          location_id: env.SQUARE_LOCATION_ID,
          reference_id: orderNo,
          line_items: lineItems,
        },
        checkout_options: {
          redirect_url: redirectUrl,
          ask_for_shipping_address: true,
        },
        description: `DéLa Já order ${orderNo}`,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.log("square error", res.status, detail.slice(0, 400));
      return json({ error: "square rejected", status: res.status }, 502, origin);
    }
    const data = await res.json();
    return json({ url: data.payment_link?.url, id: data.payment_link?.id }, 200, origin);
  },
};

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors(origin) },
  });
}
