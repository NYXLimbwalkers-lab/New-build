import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { db } from "@/db/db";
import { formatUSD } from "@/data/build";
import { addBuildToCart } from "@/features/cart/cart";
import { useCartUI } from "@/features/cart/CartContext";
import { CandleRenderer } from "@/features/builder/renderer";
import { Button } from "@/components/ui/Button";
import { STAGGER } from "@/lib/motionPresets";
import { usePoints } from "@/features/loyalty/loyalty";
import { useDocumentTitle } from "@/lib/useTitle";

/*
  "My Creations" — every candle you build/save persists locally and becomes a
  one-click reorderable object (reorder) or a starting point to tweak (edit).
*/
export function CreationsPage() {
  useDocumentTitle("My Creations");
  const navigate = useNavigate();
  const points = usePoints();
  const { setOpen } = useCartUI();
  const builds = useLiveQuery(
    () => db.builds.orderBy("createdAt").reverse().toArray(),
    [],
    [],
  );

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-8">
      <div className="mb-2 text-center">
        <p className="label-caps">Saved on this device</p>
        <h1 className="font-display text-4xl text-espresso sm:text-5xl">My Creations</h1>
        <p className="mt-3 inline-block rounded-full border border-gold/40 bg-blush-soft/40 px-4 py-1.5 text-sm text-cocoa">
          ✦ Candle Club: <span className="text-gold">{points} points</span>
        </p>
      </div>

      {builds.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-3xl border hairline bg-porcelain/60 p-10 text-center">
          <p className="font-serif text-xl text-plum">No creations yet.</p>
          <p className="mt-2 text-sm text-muted">
            Build one at the Candle Bar and it'll be saved here to reorder anytime.
          </p>
          <Button className="mt-6" variant="gold" onClick={() => navigate("/build")}>
            Step up to the Candle Bar
          </Button>
        </div>
      ) : (
        <motion.div
          variants={STAGGER.container}
          initial="initial"
          animate="animate"
          className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3"
        >
          {builds.map((b) => (
            <motion.div
              key={b.id}
              variants={STAGGER.item}
              className="flex flex-col overflow-hidden rounded-3xl border hairline bg-porcelain/70 shadow-[var(--shadow-soft)]"
            >
              <div className="aspect-square w-full overflow-hidden bg-gradient-to-b from-blush-soft/40 to-canvas-deep/30">
                <CandleRenderer config={b.config} />
              </div>
              <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
                <h3 className="font-display text-lg leading-snug text-espresso">{b.name}</h3>
                <span className="price text-cocoa">{formatUSD(b.price)}</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await addBuildToCart(b.config, b.price);
                      setOpen(true);
                    }}
                  >
                    Reorder
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/build?creation=${b.id}`)}
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => db.builds.delete(b.id)}
                    className="ml-auto self-center text-xs text-muted hover:text-rose"
                    aria-label={`Delete ${b.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
