# Photo-Layer Pipeline — Handoff Notes (2026-07-21)

Written for the next Claude (or human) who touches the candle imagery. Read this before
regenerating anything — every rule below exists because its absence shipped a visible bug.

## What this is

The Candle Bar builder composites **real-photo transparent layers** instead of the old SVG
placeholder ("the shitty svg food candles"). The layers are NOT hand-cut from photos (that
was tried — see `assets/raw/poc/`, it looked posterized). They are **generated** with Gemini
image-gen (Nano Banana, via OpenRouter) as *chain-edited studio states*, then cut into
transparent WebPs by pixel-diff, then self-verified. The app picks photo vs vector per build
automatically (`src/features/builder/renderer/index.tsx` → `manifestCovers`).

**Current state: 186 layers, 5 vessels, zero QC flags, everything pushed.**

| vessel | photo coverage |
| --- | --- |
| jar-14, jar-12, dessert-glass | full: 7 waxes (+ @hb/@ht parfait bands), 6 whips, 4 drizzles, 19 toppings |
| tin | full chain, no bands (opaque — a parfait shows only its top pour, renderer handles it) |
| wine | **vector only, on purpose** — see "wine" below |

2-layer glass parfaits render from real bands (verified live). 3+ layers fall back to vector.

## The two scripts (the whole pipeline)

```bash
# 1. generate chain states → assets/gen/<vessel>/*.png   (~$0.10/image — SEE COST WARNING)
OPENROUTER_API_KEY=... python3 scripts/gen_layers.py [--vessel jar-14] [--only wax]

# 2. cut layers + write manifest → public/layers/        (free, needs pillow/numpy/scipy;
python3 scripts/extract_layers.py                        #  ~/Desktop/NOVA/.venv works)
```

Both are idempotent: gen skips existing files (delete a state to regenerate it), extract
rebuilds everything from whatever states exist. `extract` exits 2 with a printed list when
seam-QC flags states — delete those files, rerun gen, re-extract, repeat until exit 0.

## The chain (why states depend on each other)

```
A (empty vessel, from her real photo as brand ref)
├─ wax-<color>      = fill A to just above the label      (single-fill cut, diff vs A)
│   └─ waxh-<color> = DRAIN the full to below the label   (@hb = diff A→half, @ht = diff half→full)
├─ whip-<color>     = crown over CONTRASTING wax (cocoa for light whips, cream for chocolate)
└─ drizzle/topping-<id> = edit of whip-vanilla
```
`assets/gen/<vessel>/CHAIN.json` records each state's true diff parent — never guess it.

## Hard-won rules (each one was a shipped bug first)

1. **Backdrop = vivid magenta FF00FF** — the one color no candle uses (owner's rule). Keyed
   on sampled `min(R,B)−G`, so her reds/pinks survive. A cream backdrop made ivory wax
   invisible to the diff. Clear glass keys to REAL transparency; contact shadow is rebuilt
   as soft black; despill neutralizes bounce.
2. **A diff only sees contrast** — whips are shot over contrasting wax. Vanilla-over-cream
   produced swiss cheese with cocoa bleeding through the holes.
3. **The model can't count** — "fill to 37%" poured ~90%. Fill lines anchor to the LABEL
   ("below the label" / "just above the label"), and `validate_bands()` is the hard gate.
4. **Parfait halves are DRAIN edits of the finished fulls** — never chain fulls *through*
   halves (framing drifts and every whip/topping shot over those fulls must regenerate).
5. **Band overlap is ideal; only a VOID is a defect** — the top band's cut dips below the
   fill line and buries the half-state's meniscus/wick stubs. Bands also stretch 4px
   horizontally (diff dies at the glass walls) and grow 28px downward.
6. **Framing drift can't be caught after the fact** — a state that redraws the vessel
   passes hole-based QC while visually DOUBLING the glass. `_framing_ok()` in gen kills it
   at generation time (silhouette IoU vs A ≥ 0.93, auto-retry).
7. **Every topping owns a named position; only the cherry gets the exact center** (the
   first pass fused a cherry into a strawberry). Garnish is small, fresh-looking, resting
   ON the swirls — the whip "nest" ring is stripped at cut time or it stamps vanilla whip
   onto other whip colors. White toppings (marshmallow) keep their collar.
8. **Seam-QC is truth-based**: every composite is diffed against the state PHOTO it came
   from; solid-in-truth + empty-in-composite = flagged. Tolerance 500px, bands 2500px (the
   wavy poured interface is organic and accepted by eye).
9. **manifest.json is fetched with `no-cache`** — `force-cache` pinned browsers to stale
   manifests and silently locked new vessels out of photo mode.

## Cost discipline (learned the expensive way)

Real cost is **~$0.08–0.10 per image** (multi-image inputs bill input tokens). Estimating
at $0.045 emptied the OpenRouter account TWICE on 2026-07-21 — which also takes down
NOVA's cloud brain (same key, `~/Desktop/NOVA/.env`). **Always**:
```bash
curl -s https://openrouter.ai/api/v1/credits -H "Authorization: Bearer $OPENROUTER_API_KEY"
```
before a batch, and budget `images × $0.10`.

## Wine (don't waste money retrying the same way)

The framing gate rejected 9/9 chain-edit attempts at gel fills — the model redraws tall
stemware at a new angle every time. Wine deliberately stays on the vector renderer.
If someone wants it: try ONE-SHOT generation (not a chain edit) with the pro image model
(`google/gemini-3-pro-image`, ~3× cost, better instruction-following), passing A as the
framing reference; keep the IoU gate on. ~$0.40 to find out.

## Open queue (nice-to-haves, none blocking)

- Rosy magenta-bounce tint on light waxes seen through glass (worst: dessert-glass cream).
  Idea: a wax-region hue-vs-target-hex gate in gen, same retry pattern as `_framing_ok`.
- 3+ layer parfait bands (needs a third band scheme; 2-layer covers the common case).
- Wine gels via pro model (above).
- Baked `manifest.heroes` composites for instant menu cards (nothing reads them yet).
- New ingredient = one line in the tables in `gen_layers.py` + rerun both scripts
  (~$0.10–0.60); it inherits every rule above automatically.

## Where the app-side logic lives

- `src/features/builder/renderer/index.tsx` — photo-vs-vector choice (only place)
- `src/features/builder/renderer/layerManifest.ts` — `layerFor` (vessel-scoped keys like
  `"jar-14/cream"`, `@hb`/`@ht` band keys), `manifestCovers`, `OPAQUE_VESSELS`
- `src/features/builder/renderer/PhotoLayerRenderer.tsx` — stacking + parfait band slots

Related but separate: NOVA's Store tab syncs the CATALOG (products.ts) via
`~/Desktop/NOVA/core/candlesite.py` → branch `nova/catalog` → PR. This pipeline never
touches the catalog. Session context lives in NOVA's memory:
`~/.claude/projects/-/memory/nova-candle-site.md`.
