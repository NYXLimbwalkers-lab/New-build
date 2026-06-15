import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { speak } from "@/lib/speak";
import { useA11y } from "@/lib/a11y";

/*
  A gentle first-run walkthrough for the Candle Bar — designed so a child or an
  elderly first-timer never feels lost. Big text, plain words, one idea per card,
  large targets, and a clear "skip" at every step. Shown once (localStorage),
  re-openable from the help affordance. Honors read-aloud + reduced motion.
*/

const TOUR_KEY = "delaja-builder-tour";

const CARDS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: "🕯️",
    title: "Welcome to the Candle Bar",
    body: "You get to design your very own dessert candle. There is no wrong way to do this — let's make something sweet.",
  },
  {
    emoji: "👆",
    title: "Tap the candle to change it",
    body: "See the glowing dots on the candle? Tap any one to pick a new vessel, color, or topping. The picture updates right away.",
  },
  {
    emoji: "➡️",
    title: "Or just press Next",
    body: "Prefer to go in order? Press the big Next button at the bottom and we'll walk through each part together, one at a time.",
  },
  {
    emoji: "✨",
    title: "In a hurry? Let us choose",
    body: "Tap “Make one for me” and we'll surprise you with a beautiful candle. You can still change anything you like afterward.",
  },
];

export function shouldShowTour() {
  return localStorage.getItem(TOUR_KEY) !== "1";
}

export function GuidedTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { readAloud } = useA11y();
  const [i, setI] = useState(0);
  const card = CARDS[i];
  const last = i === CARDS.length - 1;

  // Read the opening card aloud when the tour opens (AT users hear step 1 too).
  useEffect(() => {
    if (open && readAloud) speak(`${CARDS[0].title}. ${CARDS[0].body}`);
  }, [open, readAloud]);

  function finish() {
    localStorage.setItem(TOUR_KEY, "1");
    setI(0);
    onClose();
  }
  function next() {
    if (last) return finish();
    const n = i + 1;
    setI(n);
    if (readAloud) speak(`${CARDS[n].title}. ${CARDS[n].body}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="How the Candle Bar works"
        >
          <button
            className="absolute inset-0 bg-espresso/30 backdrop-blur-sm"
            onClick={finish}
            aria-label="Close walkthrough"
          />
          <motion.div
            key={i}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="relative w-full max-w-sm rounded-[2rem] border hairline bg-canvas p-7 text-center shadow-[var(--shadow-lift)]"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blush-soft/60 text-4xl">
              <span aria-hidden>{card.emoji}</span>
            </div>
            <h2 className="font-display text-2xl text-espresso">{card.title}</h2>
            <p className="mx-auto mt-3 max-w-xs font-serif text-lg leading-relaxed text-plum">
              {card.body}
            </p>

            {/* progress dots */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {CARDS.map((_, d) => (
                <span
                  key={d}
                  className={
                    "h-2 rounded-full transition-all " +
                    (d === i ? "w-6 bg-gold" : "w-2 bg-mauve/30")
                  }
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button variant="gold" size="lg" className="w-full" onClick={next}>
                {last ? "Let's make a candle ✦" : "Next"}
              </Button>
              <button
                onClick={finish}
                className="py-2 text-sm uppercase tracking-[0.16em] text-muted hover:text-cocoa"
              >
                Skip — I've got this
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
