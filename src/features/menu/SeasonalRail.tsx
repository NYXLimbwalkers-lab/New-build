import { useMemo } from "react";
import { motion } from "motion/react";
import { PRODUCTS } from "@/data/products";
import type { Product } from "@/data/types";
import { formatUSD } from "@/data/build";
import { ProductMedia } from "./ProductMedia";

/*
  Seasonal / limited rail, auto-surfaced by today's date (dynamic merchandising
  lifts conversion — deep plan, Part 4). Horizontal, gently parallaxed cards.
*/
export function SeasonalRail({ onOpen }: { onOpen: (p: Product) => void }) {
  const month = new Date().getMonth() + 1;
  const items = useMemo(
    () => PRODUCTS.filter((p) => p.seasonalMonths?.includes(month)),
    [month],
  );

  if (items.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-8 bg-gold/50" />
        <h2 className="font-display text-2xl text-espresso">In Season Now</h2>
        <span className="rounded-full bg-blush/40 px-2.5 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-plum">
          Small-batch
        </span>
      </div>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5">
        {items.map((p) => (
          <motion.button
            key={p.id}
            onClick={() => onOpen(p)}
            whileTap={{ scale: 0.98 }}
            className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-3xl border hairline bg-porcelain/70 text-left shadow-[var(--shadow-soft)]"
          >
            <div className="aspect-[4/3] w-full overflow-hidden">
              <ProductMedia product={p} />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-display text-base text-espresso">{p.name}</span>
              <span className="price text-cocoa">{formatUSD(p.price)}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
