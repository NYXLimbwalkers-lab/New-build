# WEBSITE PASS — the working brief

_The prompt for the full site upgrade. Execute top-to-bottom, commit per phase,
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
