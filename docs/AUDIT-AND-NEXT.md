# Audit + The Next 100 (Round 2) — research-driven

This round = a full re-audit of the build + a 16-agent research swarm (configurator
layout, candle realism, competitors across candle/fragrance/cosmetics/food/3D,
typography, spacing, color, motion, components). The findings were strikingly
unanimous. This doc records the verdicts and the prioritized next work.

## The big verdicts (high confidence — many independent agents agreed)

1. **Stay 2D real-photo layer compositing.** For a small maker with existing
   photos, layered transparent-PNG compositing is photoreal by definition, fast,
   cheap, kiosk-safe — and is literally the path Nike By You started on. 3D
   (three.js) is overkill and a *thermal risk* on a fanless kiosk. Our
   `PhotoLayerRenderer` + manifest already implement the right approach.
2. **Recolor with `mix-blend-mode: color` over a GRAYSCALE base** (not flat
   multiply) so the photo's shadows/highlights survive → realistic recolor.
3. **The vector candle can only ever be "polished illustration," not photoreal.**
   Real photos are the only route to "looks like her candles."
4. **Exact AI services to allowlist** to build the layer library from her photos:
   - `generativelanguage.googleapis.com` — Gemini 2.5 Flash Image ("Nano Banana"),
     best at *consistent* "same candle, swap topping/color" edits.
   - `sdk.photoroom.com` + `image-api.photoroom.com` — clean transparent cutouts.
   - ~**$30/month** for 500 images. (Flux Kontext via `api.bfl.ai` is the alt.)
5. **The Candle Bar layout was right in the bones; it needed cleanliness** — done
   this round (sticky mobile price/CTA, docked price, recipe summary, lighter
   panels, quiet secondary toolbar). Not a sidebar rebuild.

## Shipped this round
- ✅ Candle Bar redesign: persistent preview, **sticky mobile price+CTA bar**,
  **running recipe summary**, lighter (less-boxy) panels, quiet Favorite/Surprise/
  Undo toolbar, docked desktop price.
- ✅ Global type polish: 17px body / 1.6, display serif negative tracking + tight
  line-height (couture feel).

## The Next 100 (Round 2) — prioritized

### A. Realism / preview (the #1 lever) — needs the allowlist
1. Allowlist the AI hosts above; 2. crawl her real photos; 3. pick each candle
part into transparent PNG layers (vessel, wax, whip, drizzle, each topping);
4. grayscale wax/whip base layers; 5. wire `mix-blend-mode: color` recolor in
PhotoLayerRenderer; 6. baked hero composites for menu items; 7. decode-gated
preload; 8. all products get a real photo (only ~10/24 do now);
9. one fixed camera framing for every layer; 10. fallback chain photo→vector.

### B. Candle Bar UX (Nike/Tylko/Vacheron steals)
11. Per-zone editing — tap a part of the candle to jump to that step (Nike
"Builder's Tray"); 12. animated highlight pointing at the part being edited;
13. end-of-build **auto-rendered shareable hero snapshot** (Nike — build = content);
14. live name/label rendered ON the vessel (eCreamery/Function of Beauty/Vacheron),
not just on the reveal card; 15. "Start from a favorite" made more prominent;
16. save build to URL (shareable recipe link); 17. save to account + reorder;
18. progress affordance / rotation hint; 19. color-coded scent pyramid
(top/heart/base) à la Experimental Perfume Club; 20. named, evocative
ingredient cards with mini scent descriptions (Maison 21G); 21. cap toppings with
a friendly meter (See's "up to N"); 22. occasion/gift finishing step (Purdy's
sleeve); 23. kiosk: bigger targets (≥48px), guided linear flow, always-visible
Back/Home, 30–60s idle reset (some done).

### C. Premium visual polish (specific values from research)
24. Warm-tinted, stacked, low-opacity shadows (not pure black);
25. nested-radius formula on cards-within-cards; 26. one CTA accent color used
exclusively; 27. flatter buttons, lift via tone not heavy shadow; 28. price:
tabular-nums, regular weight, de-emphasized currency glyph; 29. lock ONE image
aspect ratio (4:5 or 1:1) across the whole product grid; 30. unified color-grade
on all product photos; 31. generous section spacing (96–160px desktop / 48–64
mobile); 32. body measure 66ch; 33. WCAG AA contrast audit (espresso text ≥4.5:1,
never gold text, gold ≤10% accents); 34. `:focus-visible` rings everywhere;
35. skeleton shimmer loaders (not spinners); 36. LCP ≤2.5s, `fetchpriority=high`
on hero, AVIF/WebP; 37. motion 200–300ms ease-out, no spring overshoot on luxury
transitions; 38. respect `prefers-reduced-motion` (done) + crossfade fallbacks.

### C2. Continues the original 100-item ROADMAP.md
Reviews app (real), search facets, PDP gallery/zoom/video, express pay + real
checkout, accounts/loyalty/subscriptions, kiosk lockdown, party booking/QR,
admin CMS + analytics, email/SMS flows, bundles, AR — all still tracked in
`docs/ROADMAP.md` (waves 2–6).

## Recommended order
1. **Unblock realism** (allowlist → real photos → layer library → mix-blend recolor).
2. Candle Bar steals (per-zone edit, label-on-vessel, share snapshot).
3. Visual polish pass (shadows, aspect-ratio lock, contrast, type rhythm).
4. Then continue ROADMAP waves (commerce, accounts, kiosk, party).
