# Square go-live — everything is built; two values turn it on

The site takes real payments through **Square Payment Links** (hosted
checkout on Square's own page — no card data ever touches our site). All
code is done: `src/features/commerce/squareAdapter.ts` (client) +
`server/square-checkout-worker.js` (the tiny server that holds her secret).

## What SHE does (5 minutes, one time)

1. Go to **developer.squareup.com** → sign in with the same Square account
   she already uses → "Create your first application" → name it
   `DeLa Ja Website`.
2. In the app's **Credentials** page, copy the **Production Access Token**.
3. In **Square Dashboard → Account & Settings → Locations**, copy the
   **Location ID** for her main location.
4. Send both values (token + location id) — securely, not in a group chat.

## What WE do with them (5 minutes)

```bash
npm i -g wrangler && wrangler login          # free Cloudflare account
wrangler deploy server/square-checkout-worker.js --name delaja-checkout
wrangler secret put SQUARE_ACCESS_TOKEN      # paste her token
wrangler secret put SQUARE_LOCATION_ID       # paste her location id
```

Then build the site with:

```bash
VITE_COMMERCE=square \
VITE_SQUARE_CHECKOUT_URL=https://delaja-checkout.<account>.workers.dev/checkout \
npm run build
```

(For GitHub Pages: add those two as repo **Actions variables** and inject
them in `.github/workflows/deploy-preview.yml`'s build step.)

## How the flow behaves

- **Storefront/party checkout** → order recorded in her Admin queue → guest
  is redirected to Square's payment page → returns to the site with
  `?paid=DJ-xxxx`.
- **Kiosk** → unchanged pay-at-the-counter ticket (no card redirect
  in-store).
- **Worker down / offline** → order still lands in the local queue
  (`synced:false`) — she can invoice from the Square dashboard. No order is
  ever lost.
- Sandbox testing: `wrangler secret put SQUARE_ENV` → `sandbox`, use the
  sandbox token, pay with Square's test card `4111 1111 1111 1111`.

## Security notes

- The access token lives ONLY in the Cloudflare Worker secret store.
- The worker re-validates every line item (price bounds, quantity bounds,
  origin allow-list, redirect allow-list) — it never trusts client math.
- Idempotency key = order number, so a double-click can't double-charge.
