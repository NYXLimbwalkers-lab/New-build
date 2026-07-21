#!/usr/bin/env python3
"""gen_layers.py — generate the candle photo-layer SOURCE states with Gemini image gen.

The photo library (docs/ASSETS.md) needs every part as a full-frame image at ONE shared
camera framing. Hand-cutting her raw photos was tried and looked posterized (assets/raw/poc).
This pipeline instead CHAIN-EDITS generated studio states — empty vessel → +wax → +whip →
+drizzle/+topping — so consecutive states are pixel-consistent and each part can be
extracted as a clean diff-cut by extract_layers.py.

Background is a vivid-magenta chroma key — the one color no dessert candle uses (owner's
rule, 2026-07-21) — so extraction can never confuse backdrop with wax, and clear glass keys
to TRUE transparency. Her real product photo is passed as identity reference for the
vessel/brand. Idempotent: existing files are skipped, so re-running only fills gaps.

  OPENROUTER_API_KEY=... python3 scripts/gen_layers.py [--vessel jar-14] [--only wax]

Cost: ~$0.05/image on google/gemini-3.1-flash-image; a full vessel chain is ~37 images.
"""
from __future__ import annotations

import base64
import concurrent.futures as cf
import json
import mimetypes
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "gen"
REF = ROOT / "assets" / "raw" / "poc" / "final_compare.png"   # her real jar + brand, best single ref
MODEL = "google/gemini-3.1-flash-image"
# The backdrop is a chroma key, and the ONE rule of a chroma key is that its color must
# never appear on the subject. Candles here are creams/honeys/browns/soft pinks/dusty
# blues/pale greens — vivid magenta is the color no dessert candle will ever be (the
# owner's call, 2026-07-21: 'think of colors we might not use in a candle'). A cream
# backdrop cost us weak ivory-wax diffs and near-white cut ambiguity.
BG = ("uniform flat vivid magenta (hex FF00FF) studio background filling the whole frame, evenly "
      "lit edge to edge with no vignetting, with a single very soft natural contact shadow "
      "directly under the vessel. The magenta backdrop color must NOT appear anywhere on the "
      "candle, vessel, label, or garnish itself — no magenta reflections or color cast on the subject")
CAM = "perfectly centered, straight-on front view at eye level, soft even diffused studio light, square 1:1 image"

# ---- the ingredient vocabulary (ids + hexes MUST mirror src/data/ingredients.ts) ----
VESSELS = {
    "jar-14": "clear glass straight-sided jar, 14 oz size (roughly as wide as it is tall), occupying the lower 62% of frame height, base at 12% from the bottom edge",
    "tin": "seamless brushed-silver metal tin, 7 oz size (wide and low, about half as tall as it is wide), occupying the lower 45% of frame height, base at 12% from the bottom edge",
}
LABEL = "a clear round sticker label on the front reading only 'DéLa Já Candles / Great Falls, SC / Hand-poured Candle' in elegant small dark lettering (NO product name)"
WAXES = {  # non-gel colors
    "ivory": "F3E9DD", "cream": "F4E4C9", "honey": "E8C98A", "caramel": "D9A86A",
    "strawberry": "EBB7BE", "orange-cream": "F1C79A", "cocoa": "9C6B4F",
}
WHIPS = {
    "whip-vanilla": ("FBF3E4", "soft ivory vanilla"), "whip-butter": ("F6E4B8", "warm buttercream yellow"),
    "whip-strawberry": ("F4CAD2", "pale strawberry pink"), "whip-chocolate": ("B08054", "milk chocolate brown"),
    "whip-mint": ("CFE4D2", "pale mint green"), "whip-lavender": ("D8CCE6", "pale lavender purple"),
}
DRIZZLES = {
    "caramel": ("B5763C", "glossy caramel"), "chocolate": ("5A3825", "dark chocolate"),
    "berry": ("9C2F52", "deep berry-red syrup"), "honey": ("D9A441", "translucent golden honey"),
}
# Each topping gets a SIGNATURE position (roughly a clock face seen from the front, cherry
# owning the center peak) so any picked combination scatters instead of stacking — the first
# pass put strawberry AND cherry at center and they fused into one chimera (visual-QA
# 2026-07-21). GARNISH keeps every piece small and SITTING ON the swirls: pressed-in
# garnish deforms the whip around it, and that deformation ring pollutes the diff-cut.
GARNISH = ("The garnish is SMALL — no wider than one-sixth of the vessel diameter — and rests "
           "shallowly ON TOP of the whipped swirls without pressing them down or deforming them. "
           "It must NOT sit at the exact center peak. It looks impeccably FRESH, glossy, juicy "
           "and appetizing, food-magazine quality — never dried, dull, waxy, or shriveled.")
TOPPINGS = {
    "strawberry": ("one glistening whole strawberry with fresh green cap, resting low on the front-right "
                   "slope of the whip, touching the rim — clearly AWAY from the center peak, which stays empty"),
    "blueberry": "a cluster of three plump dewy blueberries on the mid-left",
    "orange-slice": "one fresh juicy orange slice with vibrant glistening flesh, leaning upright at the upper right, behind the swirls",
    "waffle": "one crisp waffle quarter wedged upright at the back, slightly left of center",
    "sprinkles": "colorful pastel round sprinkles scattered evenly across the whole whipped top",
    "pecan": "two glazed pecan halves side by side at the front center, low against the rim",
    "crumble": "golden streusel crumble scattered lightly over the back-left quarter",
    "candy": "one teal-blue wrapped hard candy resting on the rim at the far left",
    "marshmallow": "two toasted marshmallows, golden-browned tops, at the upper left",
    "cherry": "one glossy maraschino cherry with stem, alone at the exact center on the highest swirl",
    "chocolate": "one thick chocolate chunk leaning against the swirls just right of the center peak",
    "honey": "one small golden honey dollop between the swirls at the front left",
    "honeycomb": "one hexagonal honeycomb wedge upright at the mid-left, behind the swirls",
    "banana": "two banana slices fanned at the lower left, against the rim",
    "wafer": "one rolled vanilla wafer cookie angled upright at the mid-right",
    "graham": "one graham cracker slab leaning at the back right, behind the swirls",
    "peppermint": "one shard of red-and-white peppermint bark upright at the right, between rim and peak",
    "cinnamon-roll": "one miniature glazed cinnamon roll resting low at the lower right against the rim",
    "apple": "three thin red-skinned apple slices fanned at the front, just right of center, low",
}
KEEP = ("Keep EVERYTHING else pixel-identical: same vessel, same label, same fill, same lighting, "
        "same camera framing, same flat vivid magenta (FF00FF) background. The magenta backdrop "
        "color must never appear ON the candle or garnish. Photorealistic, no wick, no text "
        "besides the label.")


def _data_url(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "image/jpeg"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def _gen(out: Path, prompt: str, refs: list[Path]) -> str:
    if out.exists():
        return f"skip {out.name}"
    content = [{"type": "text", "text": prompt}] + [
        {"type": "image_url", "image_url": {"url": _data_url(r)}} for r in refs]
    body = json.dumps({"model": MODEL, "modalities": ["image", "text"],
                       "messages": [{"role": "user", "content": content}]}).encode()
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions", data=body,
        headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
                 "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    images = ((d.get("choices") or [{}])[0].get("message") or {}).get("images") or []
    if not images:
        return f"FAIL {out.name}: {json.dumps(d.get('error') or d)[:200]}"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(images[0]["image_url"]["url"].split(",", 1)[1]))
    return f"ok   {out.name}"


def _gen_retry(out: Path, prompt: str, refs: list[Path], tries: int = 3) -> str:
    """A flaky network mid-batch must not kill the run (it did, 2026-07-21) — the chain is
    resumable anyway, but one bad socket shouldn't cost the whole wave."""
    import time
    for i in range(tries):
        try:
            res = _gen(out, prompt, refs)
        except Exception as e:  # noqa: BLE001
            res = f"FAIL {out.name}: {e}"
        # a "completion" with no image (soft refusal / hiccup) is as retryable as a socket error
        if not res.startswith("FAIL") or i == tries - 1:
            return res
        time.sleep(5 * (i + 1))
    return f"FAIL {out.name}: unreachable"


def _wave(jobs: list[tuple[Path, str, list[Path]]]) -> bool:
    """Run one dependency wave with bounded concurrency. Returns True if all succeeded/skipped."""
    ok = True
    with cf.ThreadPoolExecutor(max_workers=5) as ex:
        for res in ex.map(lambda j: _gen_retry(*j), jobs):
            print(res, flush=True)
            ok &= not res.startswith("FAIL")
    return ok


def _write_chain(vd: Path) -> None:
    """CHAIN.json — each state's true diff parent, so extract_layers.py never has to guess.
    (The first library was cut with guessed parents; a whip shot over cocoa but diffed
    against cream would be garbage. States absent from CHAIN.json get legacy handling.)"""
    chain = {}
    for wid in WAXES:
        chain[f"wax-{wid}.png"] = "A.png"
    for wid in WHIPS:
        chain[f"whip-{wid.removeprefix('whip-')}.png"] = (
            "wax-cream.png" if wid == "whip-chocolate" else "wax-cocoa.png")
    for did in DRIZZLES:
        chain[f"drizzle-{did}.png"] = "whip-vanilla.png"
    for tid in TOPPINGS:
        chain[f"topping-{tid}.png"] = "whip-vanilla.png"
    (vd / "CHAIN.json").write_text(json.dumps(chain, indent=1))


def main() -> int:
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    vessels = ([sys.argv[sys.argv.index("--vessel") + 1]] if "--vessel" in sys.argv
               else list(VESSELS))
    for v in vessels:
        vd = OUT / v
        base = VESSELS[v]
        material = "metal tin (opaque)" if v == "tin" else "clear glass (wax visible through it with natural refraction)"
        # wave 1: the empty vessel (chain root)
        if not _wave([(vd / "A.png",
                       f"Studio product photography. Using the attached reference photo for the brand and glass style: "
                       f"a photorealistic studio shot of ONLY the EMPTY {base}, with {LABEL}, {CAM}, {BG}.",
                       [REF])]):
            return 1
        # wave 2: every wax color as an edit of A
        if only in (None, "wax") and not _wave([
            (vd / f"wax-{wid}.png",
             f"Edit the attached photo: fill the empty vessel with smooth {wid.replace('-', ' ')} colored candle wax "
             f"(hex {hx}) up to 75% of the vessel's interior height, flat softly-glossy wax surface, {material}. {KEEP}",
             [vd / "A.png"]) for wid, hx in WAXES.items()]):
            return 1
        # wave 3: every whip color as an edit of a CONTRASTING wax state. The whip layer is
        # extracted as a diff against its parent, and a diff can only see what CONTRASTS: a
        # vanilla whip shot over cream wax came out as swiss cheese (visual-QA 2026-07-21),
        # with true see-through gaps indistinguishable from same-color whip body. Light whips
        # are therefore shot over cocoa, the chocolate whip over cream — every gap then reads
        # as parent-wax (excluded) and every whip pixel as diff (kept), with no hole-filling.
        if only in (None, "whip") and not _wave([
            (vd / f"whip-{wid.removeprefix('whip-')}.png",
             f"Edit the attached photo: add generous hand-piped whipped-cream style wax rosette swirls in {desc} "
             f"(hex {hx}), piped as a SYMMETRIC crown that rises clearly ABOVE the vessel rim — tallest at the "
             f"exact center, tapering evenly to both sides, overhanging the rim equally all the way around, "
             f"like a professionally decorated dessert candle. {KEEP}",
             [vd / ("wax-cream.png" if wid == "whip-chocolate" else "wax-cocoa.png")])
            for wid, (hx, desc) in WHIPS.items()]):
            return 1
        # wave 4: drizzles + toppings as edits of the VANILLA whip state
        w4 = []
        if only in (None, "drizzle"):
            w4 += [(vd / f"drizzle-{did}.png",
                    f"Edit the attached photo: drizzle thin ribbons of {desc} syrup (hex {hx}) over the whipped "
                    f"swirls, a few drips running toward the rim. The syrup clings to the swirls it touches "
                    f"without moving or deforming them. {KEEP}",
                    [vd / "whip-vanilla.png"]) for did, (hx, desc) in DRIZZLES.items()]
        if only in (None, "topping"):
            w4 += [(vd / f"topping-{tid}.png",
                    f"Edit the attached photo: place {desc}. {GARNISH} {KEEP}",
                    [vd / "whip-vanilla.png"]) for tid, desc in TOPPINGS.items()]
        if w4 and not _wave(w4):
            return 1
        _write_chain(vd)
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
