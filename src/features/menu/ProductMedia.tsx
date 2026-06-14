import { motion } from "motion/react";
import { useState } from "react";
import type { Product } from "@/data/types";
import { buildFromProduct } from "@/data/build";
import { CandleRenderer } from "@/features/builder/renderer";

/*
  Shows HER REAL PHOTO for a product, with a gentle Ken-Burns drift + warm glow
  on hover (deepfake-free; the photo IS the product). Falls back to the candle
  renderer only when a product has no photo yet. The remote URLs are her live
  Jetpack/Smush CDN; `node scripts/fetch-assets.mjs` can localize them to
  /products for offline/kiosk once her domains are allowlisted.
*/
export function ProductMedia({
  product,
  active,
}: {
  product: Product;
  active?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (product.image && !broken) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        {/* calm shimmer skeleton until the photo decodes (perceived speed) */}
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-canvas-deep to-blush-soft/40" />
        )}
        <motion.img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setBroken(true)}
          onLoad={() => setLoaded(true)}
          className="h-full w-full object-cover"
          initial={false}
          animate={{ scale: active ? 1.06 : 1, opacity: loaded ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 26 }}
          draggable={false}
        />
        {/* warm rosy-gold glow bloom on hover */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background:
              "radial-gradient(circle at 50% 42%, rgba(246,216,154,0.28), transparent 62%)",
          }}
        />
      </div>
    );
  }

  // Fallback: cohesive vector candle until her photo is wired in.
  return <CandleRenderer config={buildFromProduct(product.id)} revealed={active} />;
}
