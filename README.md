# DéLa Já — The Candle Patisserie

A premium, buttery-smooth web app for **DéLa Já Candles & Wax Melts** (Great
Falls, SC — veteran-founded, mom-owned, hand-poured). Customers pick a candle off
a gorgeous dessert-case menu, or step up to **The Candle Bar** and build their own
— whipped, drizzled and finished in front of them with a live preview.

One codebase, three modes:

| Route            | Mode       | Status |
| ---------------- | ---------- | ------ |
| `/`              | Storefront | ✅ Phase 0–1 |
| `/build`         | The Candle Bar | ✅ Phase 1 |
| `/kiosk`         | In-store touch display | 🟡 Phase 3 scaffold (attract loop + auto-reset live) |
| `/party/:id`     | RV mobile party | 🟡 Phase 4 scaffold |

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · **Motion** (motion.dev) · **Lenis**
smooth scroll · Dexie/IndexedDB (local-first) · installable PWA.

## The "continuous canvas" UX

Built so you never notice a page switch (see `docs/UX-ARCHITECTURE.md`):

- **Persistent shell** (`src/shell/RootLayout.tsx`) mounts once; only content transitions.
- **Lenis smooth scroll** driven by Motion's single `frame` loop (one RAF, no jitter).
- **View Transitions API** for route crossfade/slide + shared product-image morph,
  with a Motion `AnimatePresence` fallback for older browsers.
- **Persistent builder Stage** outside `AnimatePresence`; steps swipe beneath it.
- Physics springs throughout, GPU transform/opacity only, full `prefers-reduced-motion`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build (PWA)
npm run preview
```

## Her real photos (asset pipeline)

The app uses **her real catalog and photography** — see `docs/ASSETS.md`.

1. Add her domains to this environment's network egress allowlist
   (`delajacandles.com`, `i0.wp.com`, `b4130177.smushcdn.com`).
2. `node scripts/fetch-assets.mjs` — crawls her shop + downloads every photo.
3. Build the transparent-PNG **layer library** (`public/layers/`) + `manifest.json`.
   The live preview then composites her real photos; until then a vector candle
   stands in. The renderer is swappable (`src/features/builder/renderer/`).

## How to add things

**A new ingredient layer** — add it to `src/data/ingredients.ts` (id, name, price,
color), drop its transparent PNG in `public/layers/<kind>/<id>.webp`, and add the
`manifest.json` entry. It appears in the builder and composites live.

**A new menu item** — add it to `src/data/products.ts` with her real name/size/
price, set `image` to a real photo, and optionally a `recipe` so "Start from a
Favorite" loads it into the bar.

## Project layout

```
src/
  data/         real catalog, ingredient library, pricing + build rules
  db/           Dexie (saved builds, cart, offline queue, analytics)
  lib/          smooth scroll, motion presets, magnetic hook, haptics, helpers
  components/ui base components (Button, Card, Chip, Sheet, PricePill, SelectTile)
  shell/        persistent app shell (header, footer, transition outlet)
  features/
    menu/       dessert-case menu board, cards, detail, seasonal rail, hero
    builder/    The Candle Bar + swappable preview renderer
  routes/       Storefront, Builder, Kiosk, Party
scripts/        asset crawler
docs/           ASSETS.md, UX-ARCHITECTURE.md
```

Made with warmth for a small-batch, made-to-order candle maker.
