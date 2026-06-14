import { motion } from "motion/react";
import type { BuildConfig } from "@/data/types";
import { formatUSD } from "@/data/build";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { CandleRenderer } from "./renderer";

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

  async function share() {
    const text = `I just made "${name}" at the DéLa Já Candle Bar 🕯️`;
    try {
      if (navigator.share) await navigator.share({ title: name, text });
      else await navigator.clipboard.writeText(text);
    } catch {
      /* user dismissed */
    }
  }

  return (
    <Sheet open={open} onClose={onClose} position="center" label="Your candle is ready">
      <div className="p-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="mx-auto max-w-xs overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-porcelain to-blush-soft/40 p-5 shadow-[var(--shadow-lift)]"
        >
          <p className="label-caps !tracking-[0.3em] text-gold">DéLa Já · made to order</p>
          <div className="my-3">
            <CandleRenderer config={config} revealed showcase />
          </div>
          <h3 className="font-display text-2xl text-espresso">{name}</h3>
          <p className="price mt-1 text-lg text-cocoa">{formatUSD(price)}</p>
          <div className="mt-2 h-px w-16 mx-auto bg-gold/40" />
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted">
            Hand-poured · small-batch
          </p>
        </motion.div>

        <div className="mx-auto mt-6 flex max-w-xs flex-col gap-3">
          <Button variant="primary" size="lg" onClick={onAddToCart}>
            Add to Cart · {formatUSD(price)}
          </Button>
          <Button variant="gold" size="md" onClick={share}>
            Save &amp; Share
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Keep tweaking
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
