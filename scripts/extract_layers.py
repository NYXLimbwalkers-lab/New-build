#!/usr/bin/env python3
"""extract_layers.py — cut the generated chain states (assets/gen, from gen_layers.py) into
transparent WebP layers under public/layers/ and write public/layers/manifest.json.

  vessel  = outer-silhouette cut of A (background flood-filled away from the frame border,
            the soft contact shadow kept as partial alpha)
  wax     = pixels of wax-<id> that differ from A          (full fill incl. glass refraction)
  whip    = pixels of whip-<id> that differ from wax-cream
  drizzle = pixels of drizzle-<id> that differ from whip-vanilla
  topping = pixels of topping-<id> that differ from whip-vanilla

Manifest keys are VESSEL-SCOPED ("jar-14/cream") because a wax fill or whipped top only
aligns with the vessel it was shot on; the renderer falls back to the flat key. Only kinds
with a complete extraction are declared, so manifestCovers() stays honest.

Also writes assets/gen/<vessel>-selfcheck.png — a deliberately CROSS-COLOR composite
(cocoa wax + vanilla whip + caramel drizzle + strawberry & cherry) to eyeball seams.

  python3 scripts/extract_layers.py            # needs pillow + numpy
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "assets" / "gen"
PUB = ROOT / "public" / "layers"
BG = np.array([0xFB, 0xF4, 0xF0], dtype=np.float32)
SIZE = 1024
ENTER = {"vessel": "fade", "wax": "pour", "whip": "pipe", "drizzle": "drizzle", "topping": "drop"}
# scatter-type toppings are many small pieces — the standard median+erode cleanup would eat them
SCATTER = {"sprinkles", "crumble"}


def load(p: Path) -> np.ndarray:
    return np.asarray(Image.open(p).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS), np.float32)


def flood_bg(img: np.ndarray, tol: float = 22.0) -> np.ndarray:
    """Background mask: pixels close to BG, 4-connected to the frame border (so bg-colored
    highlights INSIDE the vessel are never cut). Pure numpy BFS on a boolean grid."""
    near = np.linalg.norm(img - BG, axis=-1) < tol
    bg = np.zeros_like(near)
    bg[0, :] = near[0, :]; bg[-1, :] = near[-1, :]
    bg[:, 0] |= near[:, 0]; bg[:, -1] |= near[:, -1]
    while True:
        grown = bg.copy()
        grown[1:, :] |= bg[:-1, :]; grown[:-1, :] |= bg[1:, :]
        grown[:, 1:] |= bg[:, :-1]; grown[:, :-1] |= bg[:, 1:]
        grown &= near
        if (grown == bg).all():
            return bg
        bg = grown


def vessel_alpha(img: np.ndarray) -> np.ndarray:
    """Subject alpha for the empty-vessel frame: solid inside the silhouette, and the soft
    contact shadow surviving as partial alpha proportional to its darkness."""
    bg = flood_bg(img)
    subject = ~bg
    lab, n = ndimage.label(subject)
    if n > 1:   # a stray backdrop blob (generation artifact) is not the vessel — keep the
        sizes = ndimage.sum(subject, lab, range(1, n + 1))    # largest component only
        subject = lab == (int(np.argmax(sizes)) + 1)
    a = subject.astype(np.float32)
    # keep the contact shadow — but ONLY near the vessel itself; a random dark patch
    # elsewhere in the backdrop must not survive as a floating smudge (visual-QA 2026-07-21)
    near = ndimage.binary_dilation(subject, iterations=40)
    dark = np.clip((BG.mean() - img.mean(axis=-1)) / 60.0, 0.0, 1.0) * near
    a = np.maximum(a, dark * 0.9)
    return np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(1.2)), np.float32) / 255.0


WHIP_IVORY = np.array([0xFB, 0xF3, 0xE4], dtype=np.float32)


def diff_alpha(parent: np.ndarray, state: np.ndarray, scatter: bool = False,
               fill_holes: bool = False, strip_whip_collar: bool = False) -> np.ndarray:
    """Mask of `state` pixels that changed vs `parent`.

    fill_holes: a naive diff goes to ZERO wherever new content happens to match what it
      covered (vanilla whip over cream wax → Swiss cheese, the wax bleeding through in the
      composite). Enclosed diff-holes are part of the new object by construction, so fill
      them (visual-QA finding, 2026-07-21).
    strip_whip_collar: a topping/drizzle state deforms the whip AROUND the new object, so
      its diff carries a ring of parent-whip pixels — which then stamps vanilla whip onto
      whatever whip color is actually underneath. Remove whip-ivory-colored pixels from the
      mask's outer ring only (never the interior, or white toppings like marshmallow would
      vanish)."""
    d = np.linalg.norm(state - parent, axis=-1)
    raw = d > 26.0
    m = Image.fromarray((raw * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MedianFilter(3 if scatter else 9))
    mask = np.asarray(m) > 127
    if fill_holes:
        mask = ndimage.binary_fill_holes(mask)
    if strip_whip_collar:
        ring = mask & ~ndimage.binary_erosion(mask, iterations=18)
        whippy = np.linalg.norm(state - WHIP_IVORY, axis=-1) < 34.0
        # the nest SHADOW ring too: near-neutral dark pixels (a berry is dark but saturated,
        # a shadow is dark and gray — chroma tells them apart)
        v = state.max(axis=-1)
        chroma = v - state.min(axis=-1)
        shadowy = (v < 110) & (chroma < 28)
        mask = mask & ~(ring & (whippy | shadowy))
        # anything left dangling (a detached fleck of collar) goes too
        lab, n = ndimage.label(mask)
        if n > 1:
            sizes = ndimage.sum(mask, lab, range(1, n + 1))
            mask = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 400])
    out = Image.fromarray((mask * 255).astype(np.uint8))
    if not scatter and not fill_holes:
        out = out.filter(ImageFilter.MinFilter(5))     # cut slightly INSIDE the changed region
    out = out.filter(ImageFilter.GaussianBlur(1.5))    # feathered seam
    return np.asarray(out, np.float32) / 255.0


def save(img: np.ndarray, alpha: np.ndarray, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    rgba = np.dstack([img, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba).save(out, "WEBP", quality=90)


def main() -> int:
    manifest: dict = {"version": "2", "vessel": {}, "wax": {}, "whip": {}, "drizzle": {}, "topping": {}}
    for vd in sorted(p for p in GEN.iterdir() if p.is_dir()):
        v = vd.name
        if not (vd / "A.png").exists():
            continue
        A = load(vd / "A.png")
        save(A, vessel_alpha(A), PUB / "vessel" / f"{v}.webp")
        manifest["vessel"][v] = {"src": f"/layers/vessel/{v}.webp", "enter": "fade"}
        # CHAIN.json (written by gen_layers.py) records each state's TRUE diff parent. A
        # chain-declared whip was shot over CONTRASTING wax, so its diff is complete and
        # needs no hole-filling; legacy states (no chain entry) get the hole-fill rescue.
        chain = {}
        if (vd / "CHAIN.json").exists():
            chain = json.loads((vd / "CHAIN.json").read_text())
        legacy = {"wax": "A.png", "whip": "wax-cream.png",
                  "drizzle": "whip-vanilla.png", "topping": "whip-vanilla.png"}
        cache: dict[str, np.ndarray] = {"A.png": A}

        def parent_for(state: Path, kind: str) -> np.ndarray | None:
            name = chain.get(state.name) or legacy.get(kind)
            if not name or not (vd / name).exists():
                return None
            if name not in cache:
                cache[name] = load(vd / name)
            return cache[name]

        for state in sorted(vd.glob("*-*.png")):
            kind, pid = state.stem.split("-", 1)
            parent = parent_for(state, kind)
            if kind not in legacy or parent is None:
                print(f"  !! {v}/{state.stem}: no parent state, skipped")
                continue
            img = load(state)
            a = diff_alpha(parent, img, scatter=pid in SCATTER,
                           fill_holes=kind == "wax" or (kind == "whip" and state.name not in chain),
                           strip_whip_collar=kind in ("drizzle", "topping"))
            if kind == "whip":
                pid = f"whip-{pid}"                     # ids in ingredients.ts carry the prefix
            save(img, a, PUB / kind / f"{v}--{pid}.webp")
            manifest[kind][f"{v}/{pid}"] = {"src": f"/layers/{kind}/{v}--{pid}.webp", "enter": ENTER[kind]}
            print(f"  ok {v}/{kind}/{pid}  coverage={float(a.mean()):.3f}")
        # cross-color self-checks: seams show here or nowhere. Two builds — colliding
        # center toppings (worst case) and zone-separated toppings (the honest average).
        for name, tops in (("selfcheck", ("strawberry", "cherry")),
                           ("selfcheck2", ("blueberry", "orange-slice"))):
            check = Image.new("RGBA", (SIZE, SIZE), (0xFB, 0xF4, 0xF0, 255))
            for kind, pid in (("vessel", v), ("wax", f"{v}--cocoa"),
                              ("whip", f"{v}--whip-vanilla"), ("drizzle", f"{v}--caramel"),
                              *(("topping", f"{v}--{t}") for t in tops)):
                p = PUB / kind / f"{pid}.webp"
                if p.exists():
                    check.alpha_composite(Image.open(p).convert("RGBA"))
            check.save(GEN / f"{v}-{name}.png")
            print(f"  wrote {v}-{name}.png")
    (PUB / "manifest.json").write_text(json.dumps(manifest, indent=1))
    counts = {k: len(vv) for k, vv in manifest.items() if isinstance(vv, dict)}
    print("manifest:", counts)
    return 0


if __name__ == "__main__":
    sys.exit(main())
