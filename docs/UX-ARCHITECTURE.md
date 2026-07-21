# UX Architecture — the "continuous gliding canvas"

The brief: it should all *slide and maneuver around* — you never notice a page
switch. This is the synthesized result of deep research into how the best
fluid/award-winning sites are built, tuned for a restrained patisserie aesthetic.

## The one structural decision

A page feels seamless when **the document never fully unloads**. A persistent
shell stays mounted; only inner content swaps; and the seam is hidden by a
transition. Everything else (smooth scroll, reveals, morphs) is polish on top.

- Shell: `src/shell/RootLayout.tsx` — mounts once, holds Lenis + chrome.
- Content swap: `src/shell/TransitionOutlet.tsx`.

## Smooth scroll (the "glide")

**Lenis**, with `autoRaf:false`, driven from Motion's single `frame` loop so
smooth-scroll and every `useScroll`/spring tick share **one RAF** — this removes
micro-jitter. `lerp: 0.08` is the luxury sweet spot. Reduced-motion → native scroll.
(`src/lib/SmoothScroll.tsx`)

## Route transitions (no page blink)

Hybrid, never double-driven:

- **Primary — View Transitions API** via react-router's `viewTransition` prop.
  `::view-transition` CSS in `index.css` does a soft crossfade + rise, and a
  shared `view-transition-name: product-hero` morphs a product image card→detail.
- **Fallback — Motion `AnimatePresence mode="wait"`** keyed on pathname, only
  when the browser lacks View Transitions (feature-detected).

## The builder Stage (never reloads)

The live candle preview lives **outside** `AnimatePresence`; only the step panels
are inside it and swipe. Drag `x` is a `useMotionValue` that drives a subtle stage
parallax with **zero React re-renders**. Swipe paging uses the canonical
`swipePower = |offset| × velocity`. (`src/features/builder/CandleBar.tsx`)

## Motion language (graceful, not bouncy)

Named springs in `src/lib/motionPresets.ts`, tuned to verified physics — damping
ratio ζ ≈ 0.9–1.0 (minimal overshoot). `MotionConfig reducedMotion="user"`
app-wide. Pour/pipe/drizzle/drop have their own physics so each ingredient
"behaves" like the real thing.

## Gestures & micro-interactions

- **Bottom sheets** (`components/ui/Sheet.tsx`): drag-to-dismiss at velocity
  > 500px/s OR drag > ~45%; backdrop opacity tracks `y`; iOS sheet easing.
- **Tactile tiles** (`components/ui/SelectTile.tsx`): press `scale(0.97)`,
  magnetic cursor-follow (mouse only), `layoutId` selection ring that glides
  between tiles, a haptic tick on touch, ≥48px hit area.

## Performance guardrails (60fps, kiosk-safe)

- Animate **transform/opacity only** (GPU compositor fast path).
- Scroll/parallax via motion values, never React state.
- Layered preview is decode-gated (`lib/preloadImage.ts`) so layers never jank
  on insert; PNG layers will be WebP/AVIF; renderer memoizes layer lists.
- `content-visibility`/`contain` ready for long pages; one RAF loop only.

## Accessibility

`prefers-reduced-motion` honored at CSS, Lenis, and Motion layers. The builder is
a **wizard** (ordered list + `aria-current="step"` + a shared `aria-live` region +
focus management), not a tablist. Dialogs use `role="dialog"`/`aria-modal` + Escape.
