# ASSET PIPELINE — live state & resume breadcrumb

_Last updated: 2026-07-05. Read this first if a session was interrupted (5-hour
limit, context reset, tmp cleanup). Everything here is durable in git; the tmp
POC files are regenerable._

## Goal (owner-confirmed)

Turn DéLa Já's **real candle photos** into **clean, low-detail, TRACED-CARTOON
illustrations** — few flat colors, crisp shapes, but silhouettes/ingredients
clearly matching her real products; consistent with the app's existing vector
art (`svgParts.tsx`). Every ingredient must be its **own separate, interchangeable
transparent layer** at one shared camera framing, so whip fits every vessel,
toppings fit every whip, etc. (feeds `PhotoLayerRenderer` via
`public/layers/manifest.json`). Sources allowed: her photos cartoonized **+**
free CC0/CC-BY lookalike 2D/3D assets — but **everything passes through the same
cartoonize + palette-snap step** so the set looks unified. Never fabricate prices.

## Environment already set up on this Mac (don't redo)

- `.venv/` (python3.12, gitignored) — `rembg` (models: birefnet-general, u2net,
  sam), `vtracer`, `onnxruntime`, `pillow`. Invoke via `./.venv/bin/rembg`,
  `./.venv/bin/python -c "import vtracer"`.
- ImageMagick 7 (`magick`), Node + `@resvg/resvg-js` (SVG→PNG), `playwright@1.61.1`
  + cached Chromium.
- rembg models cached in `~/.u2net/` (birefnet ≈ 973 MB already downloaded).

## Crawl status (task 2)

- `npm run fetch:assets` → 12 CDN images (HTML pages 403, Cloudflare challenge).
- `npm run crawl:assets` (new, `scripts/crawl-assets.mjs`, Playwright) → **headless
  cleared enough to pull 205 real `wp-content/uploads` photos** into
  `assets/raw/images/` (gitignored), BUT the individual `/product/` HTML pages
  still 403'd (33 challenge failures) → **0 structured products** (names/prices/
  sizes not captured). `assets/raw/catalog.json` has social embeds (FB + IG).
- **TODO:** run `HEADED=1 npm run crawl:assets` to clear product pages and get
  real names/prices/sizes. Her photo **labels also reveal data** — e.g. Chocolate
  Covered Strawberries label reads **14 oz / 396.89 g**, contradicting the seeded
  `8 oz` in `src/data/products.ts`. Prefer label/live truth over seed guesses.

## Cartoonize R&D

- **Attempt 1 (rejected — "smudged"):** rembg cutout → vtracer `colormode=color
  mode=spline filter_speckle=12 color_precision=6 layer_difference=24`. Traced
  photo gradients → painterly blobs. **Lesson: flatten/quantize HARD before
  tracing; far fewer colors; higher speckle filter; add a clean outline.**
- **POC files (tmp, regenerable):** `…/scratchpad/poc/{crop,cutout,alpha}.png`
  (crop.png = cropped candle, cutout.png = clean birefnet cutout 1180×1440),
  `POC_cutout.png` (great), `POC_cartoonC.png` (the smudged v1).
- Comparison artifact published (real→cutout→cartoon).

## Running Fable workflow (resume if interrupted)

- **Run ID:** `wf_4712977a-1a4` — "interchangeable-ingredient-layers".
- **Script:** `…/workflows/scripts/interchangeable-ingredient-layers-wf_4712977a-1a4.js`
- Produces: winning clean-cartoon recipe (by eye), separated parts POC
  (glass/whip/strawberry/chocolate), free lookalike asset URLs per ingredient,
  and a final registration + build plan.
- **Resume:** `Workflow({ scriptPath: "<that path>", resumeFromRunId:
  "wf_4712977a-1a4" })` — completed agents return cached results instantly.
- Earlier R&D + "100× builder" review workflow output (durable):
  `…/tasks/wuysbc5j8.output` (JSON: research/review/pipelinePlan/builderPlan).

## Renderer contract to feed (don't redesign — see docs/ASSETS.md, HANDOFF §2)

- `public/layers/manifest.json` → `PhotoLayerRenderer`; `manifestCovers()` gates,
  else falls back to `SvgLayerRenderer`. Layer PNGs are square, `object-contain`.
- **Known bug to fix before shipping tinted layers:** `PhotoLayerRenderer.tsx`
  ~66–81 tint path paints a flat `backgroundColor` through a mask → kills all
  shading (plasticky). Use luminosity/multiply composite instead.
- Other confirmed builder bugs (from review): photo path currently 100% dead (no
  manifest yet); "levitating" drizzle/toppings when no whip present
  (`svgParts.tsx`); infinite flame paint on kiosk; preview not screen-reader
  described.

## Next steps (in order)

1. Consume Fable workflow output → lock the cartoonize recipe.
2. Build `scripts/candlize.mjs` (`npm run build:layers`): photo/asset →
   cutout → cartoonize → palette-snap+outline → square-frame → `public/layers/`
   + regenerate `manifest.json`. Idempotent, one command per new candle.
3. Produce the first complete build's 6–8 layers so one candle goes photo-real
   in-app; verify with `node scripts/preview-candle.mjs` + eyes.
4. `HEADED=1` crawl → reconcile `src/data/products.ts` (real names/sizes/prices;
   fix the 8oz→14oz type issues; **no invented prices**, leave `TODO(confirm)`).
5. Keep `npm run build` green; commit + push each step.
