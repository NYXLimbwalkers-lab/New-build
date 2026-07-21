# Asset Pipeline — Real Photos → Live Composite

The preview engine composites **her real product photos**, cut into transparent
layers, on one fixed camera framing. This doc is the path from "her website" to
"photoreal candle that updates as you tap."

> **Nothing here is simulated.** The catalog is her real catalog; the imagery is
> her real photography. The vector candle in the app is only a placeholder shown
> until the layer library below exists.

## 0. Unblock network access (one-time)

This environment blocks outbound hosts by default. Add these to the environment's
**network egress allowlist** (Claude Code on the web → Environment → Network):

```
delajacandles.com
i0.wp.com
i1.wp.com
i2.wp.com
b4130177.smushcdn.com
```

(Add `scontent.cdninstagram.com`, `*.tiktokcdn.com` too if you want her social
video/photo grabbed.)

Verify: `curl -sI https://delajacandles.com/shop/ | head -1` should be `200`.

## 1. Crawl her real catalog + photos

```bash
node scripts/fetch-assets.mjs
```

Downloads every product photo + the shop catalog into `assets/raw/` and writes
`assets/raw/catalog.json`. Re-runnable (skips cached files). Use this to also
**verify the seeded prices/sizes** in `src/data/products.ts` against the live
shop.

## 2. Build the transparent-PNG layer library

> **BUILT 2026-07-21 — the generative chain pipeline.** Hand-cutting her raw
> shots looked posterized (see `assets/raw/poc/`). The shipped pipeline instead
> CHAIN-EDITS generated studio states with Gemini image gen (her real photo as
> brand/vessel reference): empty vessel → +wax color → +whip → +drizzle/+topping,
> each state an edit of its parent so consecutive states stay pixel-consistent.
> Layers are then extracted as diff-cuts between consecutive states:
>
> ```bash
> OPENROUTER_API_KEY=... python3 scripts/gen_layers.py     # states → assets/gen/
> python3 scripts/extract_layers.py                        # layers + manifest → public/layers/
> ```
>
> Hard-won rules encoded in those scripts (each one a shipped visual bug):
> - a whip must be generated over CONTRASTING wax — a diff can only see contrast
> - every topping owns a distinct position; only the cherry may claim the center
> - toppings are cut with their whip "nest" ring stripped, or they stamp vanilla
>   whip onto whatever whip color is really underneath
> - the backdrop is a vivid-magenta chroma key — the one color no candle here
>   will ever use — keyed on sampled min(R,B)−G so her reds/pinks are untouched;
>   clear glass keys to TRUE transparency and the contact shadow is rebuilt as
>   soft black from darkness inside the key
> - `CHAIN.json` records each state's true diff parent; manifest keys are
>   vessel-scoped (`"jar-14/cream"`) because fills only align with the vessel
>   they were shot on
> - re-running `gen_layers.py` only fills missing files — delete a state to
>   regenerate it; balance-check openrouter.ai credits first (~$0.05/image)

Each ingredient becomes a **full-frame transparent PNG/WebP at ONE shared camera
framing** (same angle, light, surface) so any stack reads as a single photo.

Two ways to produce them:

- **AI cut/relight (recommended first pass):** take her raw shots from
  `assets/raw/`, remove backgrounds, separate the candle into its parts (vessel,
  wax fill, whipped top, drizzle, each topping), relight to one consistent setup,
  upscale. Export at the shared framing. (This is an _offline_ step run with an
  image model — it is **not** done at runtime; live per-tap AI is too slow/
  inconsistent for a kiosk.)
- **Photoshoot (truest):** shoot each vessel/whip-color/drizzle/topping once on
  the same rig, knock out the background.

Place results under `public/layers/` by kind:

```
public/layers/
  vessel/   jar-14.webp  jar-12.webp  tin.webp  dessert-glass.webp  wine.webp
  wax/      cream.webp   honey.webp   ...        (or a neutral base + tint)
  whip/     whip-vanilla.webp  whip-strawberry.webp  ...
  drizzle/  caramel.webp  chocolate.webp  berry.webp  honey.webp
  topping/  strawberry.webp  blueberry.webp  sprinkles.webp  cherry.webp  ...
```

## 3. Declare them in the manifest

Create `public/layers/manifest.json`. The app loads this automatically and
switches from the vector placeholder to **real photos** for any build the
library fully covers (`manifestCovers`).

```jsonc
{
  "version": "1",
  "vessel":  { "jar-14": { "src": "/layers/vessel/jar-14.webp", "enter": "fade" } },
  "wax":     { "cream":  { "src": "/layers/wax/cream.webp", "enter": "pour" } },
  "whip":    { "whip-vanilla": { "src": "/layers/whip/whip-vanilla.webp", "enter": "pipe" } },
  "drizzle": { "caramel": { "src": "/layers/drizzle/caramel.webp", "enter": "drizzle" } },
  "topping": { "strawberry": { "src": "/layers/topping/strawberry.webp", "enter": "drop" } }
}
```

- `enter`: `pour | pipe | drizzle | drop | fade` — which Confiserie animation plays.
- `tint: true`: mark a **neutral** layer to be recolored to the chosen ingredient
  color at runtime (CSS alpha-mask tint) — use when you have one base shape and
  want many colors from it. Omit it when each color is its own real photo.

## 4. (Optional) baked hero composites

Pre-render popular menu items to a single image for instant card load and add
them under `manifest.heroes["product-id"] = "/layers/heroes/waffles.webp"`.

## Adding a NEW ingredient or menu item later

1. Add the ingredient to `src/data/ingredients.ts` (id, name, price, color).
2. Drop its transparent-PNG layer in `public/layers/<kind>/<id>.webp`.
3. Add the manifest entry. Done — it appears in the builder and composites live.

For a new menu item: add it to `src/data/products.ts` (real name/size/price), set
its `image` to a localized real photo, and optionally a `recipe` so
"Start from a Favorite" loads it into the bar.
