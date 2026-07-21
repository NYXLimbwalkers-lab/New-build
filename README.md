# DéLa Já — The Candle Patisserie

A premium, buttery-smooth web app for **DéLa Já Candles & Wax Melts** (Great
Falls, SC — veteran-founded, mom-owned, hand-poured). Customers shop a dessert-
case menu or build their own candle at **The Candle Bar**, with a live preview.
One codebase, three modes; installable PWA; local-first (works offline).

## Routes / modes

| Route          | Purpose |
| -------------- | ------- |
| `/`            | Storefront (menu, bundles, scent quiz, search, reviews) |
| `/build`       | The Candle Bar (live builder) — `?from=<product>` / `?creation=<id>` |
| `/creations`   | Saved builds — reorder & edit; Candle Club points |
| `/about`       | Brand story |
| `/admin`       | Owner dashboard — orders, analytics, no-code catalog editing |
| `/kiosk`       | Locked in-store kiosk (fullscreen, wake-lock, attract, order ticket) |
| `/party/:id`   | Mobile candle party — host books + QR; guests build + Make&Take card |

## Feature highlights

- **The Candle Bar:** persistent live preview (semi-realistic, render-verified
  SVG engine), multi-layer wax (+$ per layer) with a scent per part (each wax
  layer, the whip, the drizzle, and every topping),
  whipped top, zigzag drizzle, scatter/placed toppings, distinct vessels (jar,
  tin, dessert glass, wine), tap-a-part editing, name-on-vessel, **one-tap
  "Make one for me"**, reveal + auto-rendered shareable PNG card.
- **Shop:** category + scent filters, sort, seasonal rail, wishlist (♥),
  customer reviews + ratings, Sets & Bundles, search with deep links.
- **Cart & checkout:** slide-out cart, free-shipping bar, gifting (recipient,
  message, wrap, gift receipt), ship/pickup, order number, **Candle Club** points.
- **Accessibility:** "Aa" panel — Bigger Text, High Contrast, Read Aloud;
  18px base, large tap targets, labeled controls, skip-link, reduced-motion.
- **PWA:** installable, offline, "Install app" prompt.
- **SEO:** per-route titles + meta, Open Graph, Product JSON-LD.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · **Motion** · **Lenis** · Dexie/
IndexedDB · `qrcode` · `@resvg/resvg-js` (dev render rig). Code-split routes,
vendor chunking. See `docs/UX-ARCHITECTURE.md`, `docs/ASSETS.md`,
`docs/ROADMAP.md`, `docs/AUDIT-AND-NEXT.md`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build (PWA)
npm run preview
```

Live preview auto-deploys to GitHub Pages on push (`.github/workflows`).

## Going live — the two things that need you

Everything is built behind clean seams; these two need real credentials/access:

1. **Her real photos** → add her domains to the environment's network egress
   allowlist (`delajacandles.com`, `i0.wp.com`, `b4130177.smushcdn.com`), run
   `node scripts/fetch-assets.mjs`, then build the transparent-PNG layer library
   (`docs/ASSETS.md`). The preview renderer swaps from vector to real photos
   automatically. AI cut/relight pipeline target: `generativelanguage.googleapis.com`
   (Gemini "Nano Banana") + `sdk.photoroom.com` (cutouts).
2. **Payments / real checkout** → Square or WooCommerce credentials. All order
   placement (storefront + kiosk) already flows through one seam,
   `src/features/commerce/` (`CommerceAdapter`). Going live = add one adapter
   file (e.g. `squareAdapter.ts`) and set `VITE_COMMERCE=square` — no UI changes.
   The default `local` adapter queues real made-to-order requests in IndexedDB.

## Add a product / ingredient

- **Product:** add to `src/data/products.ts` (name, size, price, scent family,
  `image`, optional `recipe` for "Start from a Favorite").
- **Ingredient layer:** add to `src/data/ingredients.ts`, drop a transparent PNG
  in `public/layers/<kind>/<id>.webp`, add the `manifest.json` entry.

Made with warmth for a small-batch, made-to-order candle maker.
