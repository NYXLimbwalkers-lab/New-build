import { motion } from "motion/react";
import { BUNDLES, bundleCompareAt } from "@/data/bundles";
import { PRODUCT_BY_ID } from "@/data/products";
import { formatUSD } from "@/data/build";
import { addBundleToCart } from "@/features/cart/cart";
import { useCartUI } from "@/features/cart/CartContext";
import { ProductMedia } from "./ProductMedia";
import { Button } from "@/components/ui/Button";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { type: "spring", stiffness: 190, damping: 30 },
} as const;

/*
  Curated gift sets & bundles — convenience + a gentle saving (AOV lever).
*/
export function BundlesRail() {
  const { setOpen } = useCartUI();

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="mb-8 text-center">
        <span className="label-caps">Ready to gift</span>
        <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
          Sets &amp; Bundles
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {BUNDLES.map((b, i) => {
          const compareAt = bundleCompareAt(b);
          const save = Math.round((compareAt - b.price) * 100) / 100;
          const items = b.productIds.map((id) => PRODUCT_BY_ID[id]).filter(Boolean);
          return (
            <motion.div
              key={b.id}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.08 }}
              className="flex flex-col overflow-hidden rounded-3xl border hairline bg-porcelain/70 shadow-[var(--shadow-soft)]"
            >
              <div className="flex gap-1 bg-gradient-to-b from-blush-soft/40 to-canvas-deep/30 p-3">
                {items.map((p) => (
                  <div key={p.id} className="aspect-square flex-1 overflow-hidden rounded-2xl">
                    <ProductMedia product={p} />
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <h3 className="font-display text-xl text-espresso">{b.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{b.blurb}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="price text-lg text-cocoa">{formatUSD(b.price)}</span>
                  {save > 0 && (
                    <>
                      <span className="price text-sm text-muted line-through">
                        {formatUSD(compareAt)}
                      </span>
                      <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-emerald">
                        Save {formatUSD(save)}
                      </span>
                    </>
                  )}
                </div>
                <Button
                  className="mt-4"
                  variant="primary"
                  size="md"
                  onClick={async () => {
                    await addBundleToCart(b);
                    setOpen(true);
                  }}
                >
                  Add set to bag
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
