import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import type { Product } from "@/data/types";
import { CATEGORY_NAME } from "@/data/categories";
import { formatUSD } from "@/data/build";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { ProductMedia } from "./ProductMedia";
import { addProductToCart } from "@/features/cart/cart";
import { useCartUI } from "@/features/cart/CartContext";
import { RatingStars } from "@/components/ui/RatingStars";
import { TrustBadges } from "@/components/TrustBadges";
import { getRating, getReviews } from "@/data/reviews";
import { SPRING } from "@/lib/motionPresets";

export function ProductDetail({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { setOpen } = useCartUI();

  async function addToCart() {
    if (!product) return;
    await addProductToCart(product);
    onClose();
    setOpen(true);
  }

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

            {(() => {
              const rating = getRating(product.id);
              return rating ? (
                <a
                  href="#reviews"
                  className="mt-2 inline-flex items-center gap-2 text-cocoa"
                >
                  <RatingStars value={rating.avg} size={15} />
                  <span className="text-xs text-muted underline-offset-2 hover:underline">
                    {rating.avg} · {rating.count} reviews
                  </span>
                </a>
              ) : null;
            })()}

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
              <Button variant="primary" size="lg" className="w-full" onClick={addToCart}>
                Add to Cart · {formatUSD(product.price)}
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

            <TrustBadges compact className="mt-6" />
          </div>

          {/* Specs & care */}
          <div className="mx-auto mt-8 max-w-md">
            <h3 className="label-caps mb-3 text-center">The details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Spec k="Size" v={product.size !== "—" ? product.size : "Single"} />
              <Spec k="Scent family" v={product.scentFamily} />
              <Spec k="Wax" v={product.category === "boozy" ? "Gel" : "Soy blend"} />
              <Spec k="Wick" v="Lead-free cotton" />
              <Spec k="Made" v="Hand-poured to order" />
              <Spec k="Ships" v="In 5–7 days" />
            </dl>
            <p className="mt-4 rounded-2xl border hairline bg-porcelain/50 p-3 text-xs leading-relaxed text-muted">
              <span className="text-cocoa">Candle care:</span> on first burn, let the
              wax pool to the edges. Keep the wick trimmed to ¼". Burn no more than 4
              hours at a time.
            </p>
          </div>

          {/* Reviews */}
          <Reviews productId={product.id} />
        </div>
      )}
    </Sheet>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b hairline py-1.5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-cocoa">{v}</dd>
    </div>
  );
}

function Reviews({ productId }: { productId: string }) {
  const reviews = getReviews(productId);
  const rating = getRating(productId);

  return (
    <div id="reviews" className="mx-auto mt-10 max-w-md scroll-mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl text-espresso">Reviews</h3>
        {rating && (
          <span className="flex items-center gap-2">
            <RatingStars value={rating.avg} size={15} />
            <span className="text-sm text-cocoa">
              {rating.avg} · {rating.count}
            </span>
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border hairline bg-porcelain/50 p-5 text-center font-serif text-plum">
          No reviews yet — be the first to share the love.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border hairline bg-porcelain/50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RatingStars value={r.rating} size={13} />
                  {r.verified && (
                    <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] text-emerald">
                      Verified
                    </span>
                  )}
                </span>
                <span className="text-[0.65rem] text-muted">{r.name}</span>
              </div>
              <p className="mt-1.5 font-display text-base text-espresso">{r.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-plum">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
