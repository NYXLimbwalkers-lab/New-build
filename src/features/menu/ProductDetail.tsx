import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@/data/types";
import { CATEGORY_NAME } from "@/data/categories";
import { formatUSD } from "@/data/build";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "./ProductMedia";
import { SPRING } from "@/lib/motionPresets";

export function ProductDetail({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Sheet open={!!product} onClose={onClose} label={product?.name ?? "Product"}>
      {product && (
        <div className="px-6 pb-8 pt-2">
          <motion.div
            layoutId={`product-${product.id}`}
            transition={SPRING.glide}
            className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-b from-blush-soft/40 to-canvas-deep/30"
          >
            <ProductMedia product={product} active />
          </motion.div>

          <div className="mx-auto mt-6 max-w-md text-center">
            <p className="label-caps">{CATEGORY_NAME[product.category]}</p>
            <h2 className="mt-1 font-display text-3xl text-espresso">{product.name}</h2>

            {/* Looks-like / smells-like pairing chips */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border hairline bg-porcelain/70 px-3 py-1.5 text-xs text-cocoa">
                <span className="text-muted">looks like</span> · {product.looksLike}
              </span>
              <span className="rounded-full border hairline bg-blush-soft/40 px-3 py-1.5 text-xs text-cocoa">
                <span className="text-muted">smells like</span> · {product.smellsLike}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-6">
              <span className="label-caps">{product.size}</span>
              <span className="price text-2xl text-cocoa">{formatUSD(product.price)}</span>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              {/* TODO(Phase 2): real add-to-cart via commerce adapter. */}
              <Button variant="primary" size="lg" className="w-full">
                Add to Cart
              </Button>
              {product.recipe && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate(`/build?from=${product.id}`)}
                >
                  Customize at the Candle Bar
                </Button>
              )}
            </div>

            <p className="mt-6 text-xs text-muted">
              Hand-poured to order · {product.notes}
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}
