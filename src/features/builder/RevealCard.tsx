import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { BuildConfig } from "@/data/types";
import { formatUSD } from "@/data/build";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { CandleRenderer } from "./renderer";
import { buildShareCard, shareOrDownload } from "@/lib/shareCard";
import { addProductToCart } from "@/features/cart/cart";
import { PRODUCT_BY_ID } from "@/data/products";

/*
  The reveal moment — wick lights, glow blooms, shimmer sweeps — then a
  foil-pressed boutique SAVE/SHARE card. Treat the digital like a gift.
*/
export function RevealCard({
  open,
  config,
  price,
  onClose,
  onAddToCart,
}: {
  open: boolean;
  config: BuildConfig;
  price: number;
  onClose: () => void;
  onAddToCart: () => void;
}) {
  const name = config.name.trim() || "Your Creation";
  const stageRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [addedPair, setAddedPair] = useState(false);
  const pair = PRODUCT_BY_ID["banana-pudding"]; // matching scoopable wax melt

  async function share() {
    setSharing(true);
    try {
      // Auto-render the candle into a shareable boutique card (PNG).
      const svg = stageRef.current?.querySelector("svg");
      if (svg) {
        const blob = await buildShareCard(svg as SVGSVGElement, {
          name,
          price: formatUSD(price),
        });
        if (blob) {
          await shareOrDownload(blob, name);
          return;
        }
      }
      // Fallback: text share.
      const text = `I just made "${name}" at the DéLa Já Candle Bar 🕯️`;
      if (navigator.share) await navigator.share({ title: name, text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* user dismissed */
    } finally {
      setSharing(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} position="center" label="Your candle is ready">
      <div className="p-6 text-center">
        <p className="mb-4 font-display text-2xl text-espresso">
          Ribbon it up — it's yours ✦
        </p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="mx-auto max-w-xs overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-porcelain to-blush-soft/40 p-5 shadow-[var(--shadow-lift)]"
        >
          <p className="label-caps !tracking-[0.3em] text-gold">DéLa Já · made just for you</p>
          <div className="my-3" ref={stageRef}>
            <CandleRenderer config={config} revealed showcase />
          </div>
          <h3 className="font-display text-2xl text-espresso">{name}</h3>
          <p className="price mt-1 text-lg text-cocoa">{formatUSD(price)}</p>
          <div className="mt-2 h-px w-16 mx-auto bg-gold/40" />
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
            Hand-poured · small-batch
          </p>
        </motion.div>

        {/* gentle "complete the set" at the conversion moment */}
        {pair && (
          <div className="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-2xl border hairline bg-porcelain/60 p-3 text-left">
            <span className="flex-1 text-sm text-cocoa">
              Pairs beautifully with a{" "}
              <span className="text-espresso">{pair.name}</span> wax melt
            </span>
            <button
              onClick={() => {
                addProductToCart(pair);
                setAddedPair(true);
              }}
              disabled={addedPair}
              className="shrink-0 rounded-full bg-cocoa px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-canvas hover:bg-espresso disabled:opacity-50"
            >
              {addedPair ? "Added ✓" : `Add ${formatUSD(pair.price)}`}
            </button>
          </div>
        )}

        <div className="mx-auto mt-5 flex max-w-xs flex-col gap-3">
          <Button variant="primary" size="lg" onClick={onAddToCart}>
            Add to Cart · {formatUSD(price)}
          </Button>
          <Button variant="gold" size="md" onClick={share} disabled={sharing}>
            {sharing ? "Creating your card…" : "Save & Share"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep tweaking
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
