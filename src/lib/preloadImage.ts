/*
  Image preloader + in-memory cache that DECODES off the main thread before an
  image is shown — so layers never cause a decode-on-insert paint stall when
  they animate in (the classic layered-preview jank). See research: img.decode()
  resolves only when the bitmap is paint-ready.

  Our Phase-1 preview is SVG (instant, no decode), but the contract is here and
  used by product imagery + ready for the real transparent-PNG layer pipeline.
*/
const cache = new Map<string, Promise<HTMLImageElement>>();

export function preloadAndDecode(src: string): Promise<HTMLImageElement> {
  const hit = cache.get(src);
  if (hit) return hit;
  const p = (async () => {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    try {
      await img.decode();
    } catch {
      // decode() can reject on some states; the <img> still renders as fallback.
    }
    return img;
  })();
  cache.set(src, p);
  return p;
}

/** Resolve once ALL layers are decoded and safe to animate in. */
export function preloadLayers(srcs: string[]): Promise<unknown> {
  return Promise.all(srcs.map(preloadAndDecode));
}
