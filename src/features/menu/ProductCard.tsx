import { motion } from "motion/react";
import { useState } from "react";
import type { Product } from "@/data/types";
import { formatUSD } from "@/data/build";
import { ProductMedia } from "./ProductMedia";
import { SPRING } from "@/lib/motionPresets";
import { useMagnetic } from "@/lib/useMagnetic";
import { cn } from "@/lib/cn";

const BADGE_LABEL: Record<string, string> = {
  bestseller: "Bestseller",
  new: "New",
  "staff-pick": "Staff Pick",
  seasonal: "Seasonal",
};

/*
  Patisserie-case product card. Renders a cohesive candle preview (SVG engine,
  offline-safe) that lights with a soft flame-flicker + glow on hover/tap. The
  preview carries a shared `layoutId` so it MORPHS into the detail sheet hero.
*/
export function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (p: Product) => void;
}) {
  const [hot, setHot] = useState(false);
  const mag = useMagnetic<HTMLButtonElement>();

  return (
    <motion.button
      ref={mag.ref}
      type="button"
      onClick={() => onOpen(product)}
      onHoverStart={() => setHot(true)}
      onHoverEnd={() => setHot(false)}
      onPointerMove={mag.onPointerMove}
      onPointerLeave={mag.onPointerLeave}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING.glide}
      style={mag.style}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border hairline text-left",
        "bg-porcelain/70 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]",
      )}
      aria-label={`${product.name}, ${formatUSD(product.price)}`}
    >
      {/* arched patisserie-case window */}
      <div className="relative aspect-square w-full overflow-hidden rounded-b-[2.5rem] bg-gradient-to-b from-blush-soft/40 to-canvas-deep/30">
        {/* badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            {product.badges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-porcelain/80 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.16em] text-plum shadow-sm backdrop-blur"
              >
                {BADGE_LABEL[b]}
              </span>
            ))}
          </div>
        )}
        <motion.div
          layoutId={`product-${product.id}`}
          className="h-full w-full"
          transition={SPRING.glide}
          style={{ viewTransitionName: hot ? "product-hero" : undefined }}
        >
          <ProductMedia product={product} active={hot} />
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col gap-1 px-5 pb-5 pt-4">
        <h3 className="font-display text-lg leading-snug text-espresso">
          {product.name}
        </h3>
        <p className="text-xs text-muted">{product.smellsLike}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="label-caps !tracking-[0.2em]">{product.size}</span>
          <span className="price text-lg text-cocoa">
            {formatUSD(product.price)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
