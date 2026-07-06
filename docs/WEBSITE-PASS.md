# WEBSITE PASS — the working brief

_STATUS: Phases A, B, C executed and verified live (2026-07-06). Remaining
follow-ups listed at the bottom. Execute top-to-bottom, commit per phase,
`npm run build` green before every commit. Token discipline: work directly, no
agent fan-outs; reuse the saved review findings (tasks/wuysbc5j8.output)._

## Phase A — Port the rig art into the live app (the moat becomes real)

1. **A1 — svgParts.tsx parity port.** Translate every polished piece from
   `scripts/preview-candle.mjs` (source of truth for LOOK) into
   `src/features/builder/renderer/svgParts.tsx`, keeping the Motion
   animations and component contract used by `SvgLayerRenderer`:
   piped-swirl cream pile (replaces old dome), soft-serve swirl, ice-cream
   scoop, sculpted rose, top-down heart tin, grounded wine w/ gel drips +
   rooted wick, clean tumbler jar, all toppings (strawberry, waffle quarter,
   chocolate chunk, honeycomb, honey blob, banana, wafer dome, graham slab,
   peppermint shard, toasted-marsh cube, citrus wheel, pecan half, cherry,
   blueberry, cinnamon roll, apple, scatters), no-whip topping anchoring,
   no unclipped halo ovals, flameless heart tin.
2. **A2 — top-style in the domain.** `BuildConfig.topStyle:
   "pile" | "swirl" | "scoop" | "rose"` (default "pile"), picker chips in the
   whip step, renderer switch, `reconcile()` default, no price change.
3. **A3 — heart-tin vessel.** Add to `VESSELS` (wax-melt line), flameless in
   renderer + reveal, topping placement on the wax surface.

## Phase B — Builder bug fixes (from the paid review + owner reports)

- **Owner-reported: can't change toppings in the builder** — reproduce in
  `StepContent.tsx` toppings step, fix toggle/selection.
- Stable layer keys (recolor in place, no re-pour on color swap).
- Drizzle/toppings anchor when no whip (port of rig fix) in svgParts.
- Kill `mode="wait"` gap in step paging (CandleBar.tsx:223) + lift WaxStep's
  active-layer state into useCandleBuild.
- Flame perf: no infinite feGaussianBlur repaint (bake soft edge / CSS
  overlay); honor prefers-reduced-motion.
- A11y: `role="img"` + live `describe(config)` on the preview, radiogroup
  semantics + roving tabindex on SelectTile grids, focus trap in Sheet,
  gold-ink contrast token.

## Phase C — Site-wide upgrade ("build it out fully")

- Home/hero: use real product photos + new vector art; hero composite cards.
- Menu: ProductCard vector fallbacks get the new art (recipes render real
  builds); category imagery; quiz polish.
- Product detail: gallery uses her real photos everywhere we have them.
- Kiosk/party: verify attract loop + reveal with new art; flameless melts.
- PWA/perf sanity; `npm run lint` clean.

## Ground rules

- Never invent prices — `TODO(confirm)` where unknown.
- Rig (`preview-candle.mjs`) stays the design source; keep parity when
  changing either side.
- Commit small, push each phase; update this file's checkboxes.


## Completed (2026-07-06, verified in the running app)

- A1 art port · A2 topStyle picker (pile/swirl/scoop/rose) · A3 heart-tin
  melt flow (flameless, embeds on the heart fill, surface-aware toppings).
- THE step-freeze bug fixed (AnimatePresence mode="wait" -> keyed remount)
  — this was the owner's "can't change toppings".
- motion 12.40 -> 12.42.2 (frozen SVG spring mounts: invisible whip/tin).
- A11y: spoken preview (role="img" + live sentence), Sheet focus trap,
  flame perf + reduced-motion, gold-ink contrast token, radiogroup labels.
- 9 new toppings registered + recipes mirror her real products.
- Showcase pass: 17 more products wired to her REAL photos (from the
  crawled library, IDed against her labels) — 29 CDN photos load on the
  menu; toasted-mellow/banana-pudding/body-butters got galleries.

## Follow-ups (not blocking)

- ~~HEADED crawl~~ DONE 2026-07-06: 30 products, 0 failures. Catalog fully
  reconciled — real prices/sizes everywhere, photo swaps fixed from each
  product page's own gallery, body butters split into her 3 real SKUs,
  4 new products added (Little Luxuries Tins, Bewitched Bloom, Enchanted
  Tea, Pawsome Melts). Heart-tin $12 CONFIRMED.
- OWNER ANSWERS (2026-07-06): Candle Bar base prices APPROVED; topping
  range $1.50–3 APPROVED; wicks = cotton only (zinc for gel) — wood-wick
  option REMOVED; Little Luxuries 7 oz; Whipped Kisses 14 oz; Pink Sugar
  4 oz jelly jar; Enchanted Tea 12 oz; body butters $14 (4 oz) / $24
  (8 oz); payments = SQUARE (confirmed from her dashboard).
- Still open: festive-peppermint price (seasonal, not on shop);
  "Lavender Lullabies" status; NEXT BIG ROCK: Square commerce adapter.
- Reveal ceremony shipped (two-beat light-it + synthesized sound+haptics).
- SelectTile roving tabindex (arrow keys); kiosk/party full pass with the
  new art; hero composites (manifest.heroes); commerce adapter (needs her
  Square/Woo account).
