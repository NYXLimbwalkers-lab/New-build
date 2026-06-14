import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { ProductMedia } from "./ProductMedia";
import { PRODUCTS } from "@/data/products";
import { getRating } from "@/data/reviews";
import { formatUSD } from "@/data/build";
import type { Product, ScentFamily } from "@/data/types";
import { SPRING } from "@/lib/motionPresets";

/*
  Scent-discovery quiz → recommends candles + a starting build. Major discovery
  driver for fragrance/candle buyers; turns "I don't know what I want" into a
  confident, personal pick.
*/
interface Q {
  q: string;
  options: { label: string; families: ScentFamily[] }[];
}

const QUESTIONS: Q[] = [
  {
    q: "What's the mood you're after?",
    options: [
      { label: "Cozy & comforting", families: ["Bakery", "Dessert"] },
      { label: "Bright & happy", families: ["Fruity"] },
      { label: "Calm & clean", families: ["Fresh"] },
      { label: "Bold & a little extra", families: ["Boozy", "Woody"] },
    ],
  },
  {
    q: "Pick a treat:",
    options: [
      { label: "Warm dessert", families: ["Dessert"] },
      { label: "Fresh-baked goodies", families: ["Bakery"] },
      { label: "Fruit & cream", families: ["Fruity"] },
      { label: "A cocktail", families: ["Boozy"] },
    ],
  },
  {
    q: "Where will it live?",
    options: [
      { label: "Bedroom / self-care", families: ["Fresh", "Dessert"] },
      { label: "Kitchen", families: ["Bakery", "Fruity"] },
      { label: "Living room / bar cart", families: ["Boozy", "Woody"] },
      { label: "It's a gift", families: ["Dessert", "Fruity"] },
    ],
  },
];

export function ScentQuiz({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  const done = step >= QUESTIONS.length;

  function answer(families: ScentFamily[]) {
    setScores((prev) => {
      const next = { ...prev };
      for (const f of families) next[f] = (next[f] ?? 0) + 1;
      return next;
    });
    setStep((s) => s + 1);
  }

  function reset() {
    setStep(0);
    setScores({});
  }

  const topFamily = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "Dessert") as ScentFamily;

  const recs: Product[] = done
    ? [...PRODUCTS]
        .filter((p) => p.scentFamily === topFamily)
        .sort((a, b) => (getRating(b.id)?.avg ?? 0) - (getRating(a.id)?.avg ?? 0))
        .slice(0, 3)
    : [];

  return (
    <Sheet
      open={open}
      onClose={() => {
        onClose();
        setTimeout(reset, 300);
      }}
      label="Scent quiz"
    >
      <div className="px-6 pb-8 pt-2">
        <div className="mb-5 text-center">
          <span className="label-caps">Find your scent</span>
          <h2 className="mt-1 font-display text-3xl text-espresso">
            {done ? "Your match ✦" : "A few quick questions"}
          </h2>
        </div>

        {/* progress */}
        {!done && (
          <div className="mx-auto mb-6 flex max-w-xs gap-1.5">
            {QUESTIONS.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-gold" : "bg-canvas-deep"}`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={SPRING.glide}
              className="mx-auto max-w-md"
            >
              <p className="mb-4 text-center font-serif text-xl text-plum">
                {QUESTIONS[step].q}
              </p>
              <div className="flex flex-col gap-3">
                {QUESTIONS[step].options.map((o) => (
                  <button
                    key={o.label}
                    onClick={() => answer(o.families)}
                    className="rounded-2xl border hairline bg-porcelain/70 px-5 py-4 text-left font-display text-lg text-espresso transition-colors hover:bg-porcelain hover:shadow-[var(--shadow-soft)]"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.glide}
              className="mx-auto max-w-md"
            >
              <p className="mb-4 text-center font-serif text-xl text-plum">
                You're a <span className="text-rose">{topFamily}</span> soul. Start here:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {recs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      navigate(p.recipe ? `/build?from=${p.id}` : "/");
                    }}
                    className="overflow-hidden rounded-2xl border hairline bg-porcelain/70 text-left"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <ProductMedia product={p} />
                    </div>
                    <span className="block px-2 py-1.5 font-display text-xs leading-tight text-espresso">
                      {p.name}
                    </span>
                    <span className="block px-2 pb-2 price text-xs text-cocoa">
                      {formatUSD(p.price)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-2">
                <Button variant="gold" onClick={() => { onClose(); navigate("/build"); }}>
                  Build your own
                </Button>
                <Chip onClick={reset}>Retake</Chip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}
