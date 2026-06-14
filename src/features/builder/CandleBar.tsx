import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
import type { BuildConfig } from "@/data/types";
import { saveBuild, logEvent } from "@/db/db";
import { useMode } from "@/lib/mode";
import { Button } from "@/components/ui/Button";
import { PricePill } from "@/components/ui/PricePill";
import { CandleRenderer } from "./renderer";
import { useCandleBuild, STEP_LABEL } from "./useCandleBuild";
import { StepRail } from "./StepRail";
import { StepContent } from "./StepContent";
import { RevealCard } from "./RevealCard";
import { FavoritePicker } from "./FavoritePicker";
import { SPRING, swipePower, SWIPE_CONFIDENCE } from "@/lib/motionPresets";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

export function CandleBar({ initial }: { initial?: BuildConfig }) {
  const mode = useMode();
  const { config, update, undo, surprise, loadFrom, steps, price, canUndo } =
    useCandleBuild(initial);
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);
  const [reveal, setReveal] = useState(false);
  const [favOpen, setFavOpen] = useState(false);

  // Clamp the page if the step set shrinks (e.g. switching to the drink path).
  const current = Math.min(page, steps.length - 1);
  const stepId = steps[current];
  const atFirst = current === 0;
  const atLast = current === steps.length - 1;

  // Drag x drives a subtle parallax on the persistent stage (no re-renders).
  const dragX = useMotionValue(0);
  const stageX = useTransform(dragX, (v) => v * 0.06);

  const paginate = (d: number) => {
    setPage(([p]) => {
      const next = Math.min(Math.max(p + d, 0), steps.length - 1);
      return [next, d];
    });
  };

  function onDragEnd(_: unknown, info: PanInfo) {
    dragX.set(0);
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe < -SWIPE_CONFIDENCE && !atLast) paginate(1);
    else if (swipe > SWIPE_CONFIDENCE && !atFirst) paginate(-1);
  }

  useEffect(() => {
    logEvent("builder_step", { step: stepId }, mode);
  }, [stepId, mode]);

  async function finish() {
    setReveal(true);
    logEvent("builder_reveal", { name: config.name }, mode);
  }

  async function addToCart() {
    await saveBuild(config, price.total, mode);
    logEvent("add_to_cart", { price: price.total }, mode);
    setReveal(false);
    // TODO(Phase 2): push to the commerce adapter cart.
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:pb-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── PERSISTENT STAGE (never inside AnimatePresence; never reloads) ── */}
        <div className="lg:sticky lg:top-24 lg:w-1/2">
          <motion.div
            style={{ x: stageX }}
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border hairline bg-gradient-to-b from-blush-soft/30 to-canvas-deep/30 p-3 shadow-[var(--shadow-soft)]"
          >
            <CandleRenderer config={config} revealed={reveal} />
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <PricePill amount={price.total} />
            </div>
          </motion.div>

          {/* persistent controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFavOpen(true)}>
              ★ Start from a Favorite
            </Button>
            <Button variant="ghost" size="sm" onClick={surprise}>
              ✨ Surprise Me
            </Button>
            <Button variant="ghost" size="sm" onClick={undo} disabled={!canUndo}>
              ↶ Undo
            </Button>
          </div>
        </div>

        {/* ── SWIPEABLE STEPS ── */}
        <div className="lg:w-1/2">
          <StepRail steps={steps} current={current} onJump={(i) => setPage([i, i > current ? 1 : -1])} />

          {/* live region for SR users on step change */}
          <p className="sr-only" aria-live="polite">
            Step {current + 1} of {steps.length}: {STEP_LABEL[stepId]}
          </p>

          <div className="relative mt-2 min-h-[22rem] overflow-hidden">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.section
                key={stepId}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SPRING.page}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: atLast ? 0.12 : 0.7, right: atFirst ? 0.12 : 0.7 }}
                onDrag={(_, info) => dragX.set(info.offset.x)}
                onDragEnd={onDragEnd}
                className="touch-pan-y rounded-3xl border hairline bg-porcelain/60 p-5"
                role="group"
                aria-roledescription="slide"
                aria-label={`Step ${current + 1} of ${steps.length}`}
              >
                <StepContent step={stepId} config={config} update={update} />
              </motion.section>
            </AnimatePresence>
          </div>

          {/* nav */}
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" size="md" onClick={() => paginate(-1)} disabled={atFirst}>
              ← Back
            </Button>
            {atLast ? (
              <Button variant="gold" size="lg" onClick={finish}>
                Light it ✦
              </Button>
            ) : (
              <Button variant="primary" size="md" onClick={() => paginate(1)}>
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>

      <RevealCard
        open={reveal}
        config={config}
        price={price.total}
        onClose={() => setReveal(false)}
        onAddToCart={addToCart}
      />
      <FavoritePicker
        open={favOpen}
        onClose={() => setFavOpen(false)}
        onPick={(cfg) => {
          loadFrom(cfg);
          setPage([0, -1]);
        }}
      />
    </div>
  );
}
