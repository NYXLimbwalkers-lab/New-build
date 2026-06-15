# HANDOFF — DéLa Já — The Candle Patisserie

You are taking over an in-progress build. Read this whole file first. It is the
source of truth for **what we're making, why, how it's built, where we are, and
what to do next.** When in doubt, match what already exists.

---

## 0. Operating rules (do not skip)

- **Branch:** all work goes on `claude/hit-hub-new-repo-opya6r`. Commit in small,
  descriptive steps. Push often. Keep the existing draft PR updated. Never push
  to `main`.
- **Always keep it shippable:** `npm run build` (tsc + vite) and `npm run lint`
  must pass before every commit. The app is local-first and must keep working
  offline.
- **Don't fabricate commercial data.** Real names/sizes/prices come from her live
  site or the owner. If unknown, leave a clear `TODO(confirm)` — never invent a
  price.
- **Verify visuals with your eyes.** There is a render loop:
  `node scripts/preview-candle.mjs` rasterizes the candle to
  `candle-preview.png` — open/Read it and iterate. Do multiple iterations before
  declaring something "looks good."
- You are running **locally on the Mac** now (`uname` → Darwin), so the network
  is open. Use it. The previous sessions ran in a locked-down cloud container and
  could not fetch her assets — that limitation is gone for you.

---

## 1. The vision

A premium, "buttery-smooth," next-world web app for **DéLa Já Candles & Wax
Melts** (Great Falls, SC — veteran-founded, mom-owned, hand-poured, small-batch,
made-to-order). Design language: **"Confiserie"** — a French-patisserie boutique
feel (Didone display type, warm palette, gold hairlines, soft stacked shadows,
glassmorphism, fluid motion). It should feel like one continuous canvas — you
"slide and maneuver around" and never notice page switches. It must be usable by
a child or an elderly first-timer (big targets, plain words, read-aloud, high
contrast, reduced-motion all supported).

**One codebase, three modes** (same components, route/flag-driven):
- **Storefront** `/` — shop her catalog + build your own.
- **Kiosk** `/kiosk` — locked in-store full-screen: attract loop, idle auto-reset,
  fullscreen + wake-lock, order-ticket-to-counter.
- **Party** `/party/:sessionId?` — host booking + QR; guests join on phones and
  build candles ("make & take").

**The moat is the Candle Bar** — a live, persistent candle preview that never
reloads while you design: choose vessel → pour & scent each wax layer → whip →
drizzle → toppings → finish, with live pricing, a "reveal/light it" moment, save/
share card, and reorder.

---

## 2. The asset vision — THIS is the current focus

Her real product **photos and videos are SOURCE MATERIAL**, not just menu
thumbnails. The end goal is to turn them into **stylized, composable layers** the
Candle Bar renderer stacks live as the user builds — think hand-cut transparent
cutouts and/or **stylized "low-poly"/vector renderings** derived from her real
candles, all shot/normalized to **one shared camera framing** so any combination
composites into a single believable image. So there are really two payoffs:

1. **Menu** — every product shows her real photo (and gallery / video where she
   has them).
2. **Builder** — a **layer library** (`public/layers/`) of per-ingredient images
   (vessels, wax colors, whip colors, drizzles, toppings) so the live preview is
   real/photoreal instead of the current vector placeholder.

### How the renderer consumes assets (already built — don't redesign, feed it)

`src/features/builder/renderer/` is a **swappable renderer** behind one contract
(`RendererProps` in `renderer/types.ts`):
- `index.tsx` (`CandleRenderer`) is the ONLY selector. It loads
  `public/layers/manifest.json`; if present and it `manifestCovers(config)` the
  build, it uses **`PhotoLayerRenderer`** (real layers); otherwise it falls back
  to **`SvgLayerRenderer`** (the vector placeholder). The step flow never changes.
- `PhotoLayerRenderer.tsx` stacks transparent layers in recipe order
  (vessel → every wax layer bottom→top → whip → drizzle → each topping), each
  animating in with a Confiserie motion (`pour | pipe | drizzle | drop | fade`).
  A layer can be a color-specific real image, OR a **neutral base recolored at
  runtime** via CSS alpha-mask if its manifest entry has `tint: true`.
- `layerManifest.ts` defines `LayerEntry { src, tint?, enter? }`, loads the
  manifest, and `manifestCovers()` checks every part (incl. all wax layers) is
  present.

So to make the builder real you produce layer art + a `manifest.json`. **No
runtime AI** — all stylization is an offline step; the kiosk must be instant.

### The exact vocabulary your layers must cover

From `src/data/ingredients.ts` (ids the manifest keys to):
- **vessels:** `jar-14`, `jar-12`, `tin`, `dessert-glass`, `wine` (gel/drink).
- **wax colors (soy):** `ivory`, `cream`, `honey`, `caramel`, `strawberry`,
  `orange-cream`, `cocoa`. **gel-only:** `garnet-gel`, `blue-gel`, `rose-gel`.
- **whip colors:** `whip-vanilla`, `whip-butter`, `whip-strawberry`,
  `whip-chocolate`, `whip-mint`, `whip-lavender`.
- **drizzles:** `caramel`, `chocolate`, `berry`, `honey`.
- **toppings:** `strawberry`, `blueberry`, `orange-slice`, `waffle`, `sprinkles`,
  `pecan`, `crumble`, `candy`, `marshmallow`, `cherry`.

Wax can be done as a **single neutral base per vessel with `tint:true`** (then
all wax colors come from one shape) — efficient first pass. Whip likewise can be
a neutral pipe + tint. Toppings/drizzles read best as their own real cutouts.

Full pipeline spec is in **`docs/ASSETS.md`** — follow it.

---

## 3. The blocker you must beat (and how)

Her site returns **HTTP 403 to plain scripts** — it is behind **WordPress/
Cloudflare bot protection**. This is NOT a network problem (it 403s even on an
open home connection). `scripts/fetch-assets.mjs` already: sends full
browser-like headers, downloads known `i0.wp.com` CDN images directly (the CDN
usually bypasses the challenge), and prints `cf-mitigated/server` diagnostics.

Order of attack:
1. `npm run fetch:assets` — grabs whatever the CDN serves + known images.
2. If product **HTML pages** still 403 (so you can't discover the full catalog
   and every gallery image), **drive a real headless browser** so you pass the
   challenge like a human:
   `npx playwright install chromium`, then write a Playwright crawler that:
   - visits `/shop/` (+ pagination), every `/product/<slug>/`, and
     `/product-category/*`;
   - waits out the Cloudflare challenge, reads the rendered DOM;
   - collects product **name, price, size, description, scent**, every
     `wp-content/uploads` / `i0.wp.com` image (full-size, de-Photon the query),
     and any `<video>`/`.mp4` sources;
   - saves originals to `assets/raw/` and writes `assets/raw/catalog.json`.
3. Her socials (for video/extra photos): TikTok `@dla.j.candles.wax`, Instagram
   `@delajacandles`, Facebook. Use `yt-dlp` for videos if needed; record embed
   URLs in `catalog.json`.

`assets/raw/` is gitignored (large). Commit the small `catalog.json` (use
`git add -f` if needed) and the processed `public/layers/` library — NOT the raw
dumps. Menu photos can also just reference her live `i0.wp.com` URLs (they load
in browsers); committing binaries isn't required for the menu.

---

## 4. Current state — what's already built & working

Stack: **Vite 6 + React 19 + TS + Tailwind v4 (CSS-first `@theme`) + Motion
(`motion/react`) + Lenis + Dexie/IndexedDB + react-router-dom v7 + vite-plugin-
pwa.** Code-split routes, persistent shell, View Transitions w/ Motion fallback.

Done and verified (build passes):
- **Design system / Confiserie theme** (`src/index.css`), shared UI in
  `src/components/ui/` (Button, Chip, SelectTile, Sheet, PricePill, RatingStars,
  Card), `TrustBadges`.
- **Catalog & domain** in `src/data/` — `products.ts` (her catalog; some have
  real `image`/`images` CDN URLs), `ingredients.ts` (the parts vocabulary above),
  `build.ts` (pricing, `reconcile`, `describeBuild`, `usedScents`, `surpriseBuild`,
  `buildFromProduct`), `bundles.ts`, `party.ts`, `categories.ts`, `reviews.ts`
  (PLACEHOLDER seed reviews — clearly flagged).
- **The Candle Bar** (`src/features/builder/`): persistent stage, swipeable steps,
  tap-a-part hotspots, "Make one for me", first-run **GuidedTour**, **per-part
  scent** (see §5), **multi-layer wax** (+$3/layer), reveal + share card,
  reorder, **BuildRecipe** (full recipe shown in cart/admin/party/creations).
- **Renderer** (`src/features/builder/renderer/`): vector placeholder + photo
  compositor + manifest, as described in §2.
- **Commerce** (`src/features/commerce/`): a single `CommerceAdapter` seam
  (`localAdapter` writes a made-to-order queue to IndexedDB; `getAdapter()`
  chooses by `VITE_COMMERCE`). Storefront + kiosk place orders through it. Going
  live = one adapter file (Square/Woo) + env flag, no UI changes.
- **Cart** (`src/features/cart/`): drawer, free-ship bar, gifting, fulfillment
  (ship/pickup), **required contact + shipping address**, order number, pickup
  number, loyalty points, cross-sell. Hardened: empty-cart/double-submit/error
  guards.
- **Menu** (`src/features/menu/`): MenuBoard (filters/sort/quiz), ProductCard,
  ProductDetail (gallery, reviews, JSON-LD, read-aloud), ProductMedia (real photo
  + skeleton + vector fallback), Hero, HomeSections, Seasonal/Bundles rails,
  SearchOverlay, ScentQuiz.
- **Routes:** StorefrontHome, BuilderPage, CreationsPage, AdminPage (Orders /
  Analytics / **Leads** / Catalog — CSV export, no-code price/hide overrides),
  AboutPage, HelpPage, KioskPage, PartyPage.
- **Marketing:** EmailCapture + **CandleClub** ("Candle of the Month" interest
  capture → real de-duped leads in IndexedDB, surfaced in Admin).
- **a11y/PWA** (`src/lib/`): A11yProvider (big text / high contrast / read-aloud),
  toasts, install prompt, smooth scroll, haptics, share card rasterizer.
- **DB** (`src/db/db.ts`): Dexie tables (builds, cart, orders, events, favorites,
  userReviews, parties, overrides, leads). **v7 migration reconciles legacy
  builds.**
- **Deploy:** GitHub Pages via Actions, base path `/New-build/`.

Just-completed **audit** (3 agents) fixed: builder crash on pre-refactor saved
builds (initial config now reconciled), checkout/kiosk error+empty+double-submit
guards, pickup numbers never `#0`, persisted order number, WaxStep nested-button
a11y, `builder_reveal` analytics, photo renderer multi-layer compositing, reorder
re-pricing. See `docs/AUDIT-AND-NEXT.md`, `docs/ROADMAP.md`, `docs/UX-ARCHITECTURE.md`.

---

## 5. Important recent change — scent is PER PART

Per the owner: each component she pours has its own scent. `BuildConfig` (in
`src/data/types.ts`) replaced the old global `scents[]` blend with:
`layerScents: string[]` (index-aligned to `[waxColorId, ...extraLayers]`),
`whipScentId`, `drizzleScentId`, `toppingScents: Record<string,string>`. Scent is
chosen **inline where you pick each part** (wax step picks each layer's color +
its scent; whip/drizzle/toppings steps each have their own scent picker). The
standalone "scent" step is gone. `reconcile()` keeps all of this aligned; pricing
charges per **distinct** fragrance used. Keep this model.

---

## 6. Your task list (in order)

1. Confirm you're local: `uname` (Darwin), `npm install`, `npm run build` passes.
2. `npm run fetch:assets`; if HTML pages 403, build the **Playwright** crawler
   (§3) and capture her full catalog + every photo + videos.
3. **Fix the menu:** reconcile `src/data/products.ts` with her real catalog
   (names, sizes, prices, scents, categories), set each product's real
   `image`/`images`, add missing real products (e.g. **Lavender Lullabies**, the
   wax-melt line). Don't invent prices.
4. **Build the layer library** for the Candle Bar per `docs/ASSETS.md`: produce
   stylized/cut transparent layers (and/or low-poly vector renders) from her real
   photos at one shared framing, covering the §2 vocabulary, write
   `public/layers/manifest.json`. The renderer auto-switches to real photos.
   Iterate with `node scripts/preview-candle.mjs` and your eyes.
5. Optional: baked hero composites for instant menu cards (`manifest.heroes`).
6. Commit + push each step; keep `npm run build` green and the PR updated.

Start by running `uname`, `npm install`, `npm run build`, then `npm run
fetch:assets`, and report what came back before the heavy crawl.
