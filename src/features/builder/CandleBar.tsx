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
import { addBuildToCart } from "@/features/cart/cart";
import { useCartUI } from "@/features/cart/CartContext";
import { useMode } from "@/lib/mode";
import { formatUSD, isDrinkBuild } from "@/data/build";
import {
  SCENT_BY_ID,
  VESSEL_BY_ID,
  WAX_BY_ID,
  WHIP_BY_ID,
  DRIZZLE_BY_ID,
} from "@/data/ingredients";
import { Button } from "@/components/ui/Button";
import { CandleRenderer } from "./renderer";
import { useCandleBuild, STEP_LABEL, type StepId } from "./useCandleBuild";
import { StepRail } from "./StepRail";
import { StepContent } from "./StepContent";
import { RevealCard } from "./RevealCard";
import { FavoritePicker } from "./FavoritePicker";
import { SPRING, swipePower, SWIPE_CONFIDENCE } from "@/lib/motionPresets";
import { cn } from "@/lib/cn";

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 56 : -56, opacity: 0 }),
};

/* Tap-a-part-to-edit: hotspots over the candle that jump to that step (Nike). */
const HOTSPOTS: Partial<Record<StepId, { top: string; left: string; label: string }>> = {
  toppings: { top: "20%", left: "37%", label: "Toppings" },
  whip: { top: "27%", left: "57%", label: "Whip" },
  drizzle: { top: "38%", left: "67%", label: "Drizzle" },
  wax: { top: "60%", left: "40%", label: "Wax" },
  vessel: { top: "80%", left: "55%", label: "Vessel" },
};

export function CandleBar({
  initial,
  onComplete,
}: {
  initial?: BuildConfig;
  /** Kiosk/party override for the add-to-cart completion (e.g. show a ticket). */
  onComplete?: (config: BuildConfig, price: number) => void;
}) {
  const mode = useMode();
  const { setOpen } = useCartUI();
  const { config, update, undo, surprise, loadFrom, steps, price, canUndo } =
    useCandleBuild(initial);
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);
  const [reveal, setReveal] = useState(false);
  const [favOpen, setFavOpen] = useState(false);
  const [hint, setHint] = useState(() => localStorage.getItem("delaja-builder-hint") !== "1");

  function dismissHint() {
    setHint(false);
    localStorage.setItem("delaja-builder-hint", "1");
  }
  function makeForMe() {
    surprise();
    setReveal(true);
  }

  const current = Math.min(page, steps.length - 1);
  const stepId = steps[current];
  const atFirst = current === 0;
  const atLast = current === steps.length - 1;

  const dragX = useMotionValue(0);
  const stageX = useTransform(dragX, (v) => v * 0.05);

  const paginate = (d: number) =>
    setPage(([p]) => [Math.min(Math.max(p + d, 0), steps.length - 1), d]);

  function onDragEnd(_: unknown, info: PanInfo) {
    dragX.set(0);
    const swipe = swipePower(info.offset.x, info.velocity.x);
    if (swipe < -SWIPE_CONFIDENCE && !atLast) paginate(1);
    else if (swipe > SWIPE_CONFIDENCE && !atFirst) paginate(-1);
  }

  useEffect(() => {
    logEvent("builder_step", { step: stepId }, mode);
  }, [stepId, mode]);

  async function addToCart() {
    await saveBuild(config, price.total, mode);
    await addBuildToCart(config, price.total, mode);
    setReveal(false);
    if (onComplete) onComplete(config, price.total);
    else setOpen(true);
  }

  const NextButton = atLast ? (
    <Button variant="gold" size="lg" onClick={() => setReveal(true)} className="flex-1 lg:flex-none">
      Light it ✦
    </Button>
  ) : (
    <Button variant="primary" size="md" onClick={() => paginate(1)} className="flex-1 lg:flex-none">
      Next →
    </Button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-32 pt-4 lg:pb-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* ── PERSISTENT STAGE ── */}
        <div className="lg:sticky lg:top-24 lg:w-1/2">
          <motion.div
            style={{ x: stageX }}
            className="relative mx-auto w-full max-w-md"
          >
            {/* soft pedestal glow instead of a hard bordered box */}
            <div className="absolute inset-x-6 bottom-6 top-10 rounded-[3rem] bg-gradient-to-b from-blush-soft/30 to-transparent blur-2xl" />
            <div className="relative">
              <CandleRenderer config={config} revealed={reveal} />
            </div>

            {/* tap-a-part hotspots (hidden during the lit reveal) */}
            {!reveal && (
              <div className="absolute inset-0 z-10">
                {steps.map((s) => {
                  const h = HOTSPOTS[s];
                  if (!h) return null;
                  const idx = steps.indexOf(s);
                  const active = s === stepId;
                  return (
                    <button
                      key={s}
                      onClick={() => setPage([idx, idx > current ? 1 : -1])}
                      style={{ top: h.top, left: h.left }}
                      className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
                      aria-label={`Edit ${h.label}`}
                    >
                      <motion.span
                        animate={active ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                        transition={active ? { repeat: Infinity, duration: 1.8 } : {}}
                        className={cn(
                          "block h-3 w-3 rounded-full border shadow-sm transition-colors",
                          active ? "border-gold bg-gold" : "border-gold/60 bg-porcelain/90",
                        )}
                      />
                      <span
                        className={cn(
                          "rounded-full bg-porcelain/85 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-cocoa shadow-sm backdrop-blur transition-opacity",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      >
                        {h.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* running recipe summary — glanceable */}
          <RecipeSummary config={config} />

          {/* quiet secondary toolbar */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <TextAction onClick={() => setFavOpen(true)}>★ Favorite</TextAction>
            <Dot />
            <TextAction onClick={surprise}>✨ Surprise me</TextAction>
            <Dot />
            <TextAction onClick={undo} disabled={!canUndo}>↶ Undo</TextAction>
          </div>
        </div>

        {/* ── STEPS ── */}
        <div className="lg:w-1/2">
          {/* simplest path: one tap to a finished candle */}
          <Button variant="gold" size="lg" className="mb-3 w-full" onClick={makeForMe}>
            ✨ Make one for me
          </Button>
          {hint && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl border hairline bg-blush-soft/40 p-3 text-sm text-cocoa">
              <span>
                Tap any part of the candle to change it — or just press Next. There's no
                wrong way ✦
              </span>
              <button onClick={dismissHint} className="ml-auto shrink-0 text-muted" aria-label="Dismiss hint">
                ✕
              </button>
            </div>
          )}

          <StepRail steps={steps} current={current} onJump={(i) => setPage([i, i > current ? 1 : -1])} />

          <p className="sr-only" aria-live="polite">
            Step {current + 1} of {steps.length}: {STEP_LABEL[stepId]}
          </p>

          {/* lighter panel — no heavy border box */}
          <div className="relative mt-3 min-h-[20rem] overflow-hidden">
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
                dragElastic={{ left: atLast ? 0.1 : 0.6, right: atFirst ? 0.1 : 0.6 }}
                onDrag={(_, info) => dragX.set(info.offset.x)}
                onDragEnd={onDragEnd}
                className="touch-pan-y"
                role="group"
                aria-roledescription="slide"
                aria-label={`Step ${current + 1} of ${steps.length}`}
              >
                <StepContent step={stepId} config={config} update={update} />
              </motion.section>
            </AnimatePresence>
          </div>

          {/* desktop inline nav */}
          <div className="mt-6 hidden items-center justify-between lg:flex">
            <Button variant="ghost" size="md" onClick={() => paginate(-1)} disabled={atFirst}>
              ← Back
            </Button>
            <span className="price text-lg text-cocoa">{formatUSD(price.total)}</span>
            {NextButton}
          </div>
        </div>
      </div>

      {/* ── MOBILE sticky CTA bar (always reachable) ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        <div className="glass mx-3 mb-3 flex items-center gap-3 rounded-full border hairline px-4 py-2.5 shadow-[var(--shadow-lift)]">
          <button
            onClick={() => paginate(-1)}
            disabled={atFirst}
            className="shrink-0 px-2 py-2 text-cocoa disabled:opacity-30"
            aria-label="Back"
          >
            ←
          </button>
          <span className="price flex-1 text-center text-lg text-espresso">
            {formatUSD(price.total)}
          </span>
          {NextButton}
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

function TextAction({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-cocoa disabled:opacity-30"
    >
      {children}
    </button>
  );
}

const Dot = () => <span className="text-mauve/40" aria-hidden>·</span>;

/** Glanceable summary of the current build (clean-configurator principle). */
function RecipeSummary({ config }: { config: BuildConfig }) {
  const drink = isDrinkBuild(config);
  const parts = [
    VESSEL_BY_ID[config.vesselId]?.name.split(" · ")[0],
    config.extraLayers.length
      ? `${config.extraLayers.length + 1} wax layers`
      : WAX_BY_ID[config.waxColorId]?.name,
    config.scents.map((s) => SCENT_BY_ID[s.scentId]?.name).filter(Boolean).join(" + "),
    !drink && config.whipId ? WHIP_BY_ID[config.whipId]?.name : null,
    !drink && config.drizzleId ? `${DRIZZLE_BY_ID[config.drizzleId]?.name} drizzle` : null,
    !drink && config.toppingIds.length ? `${config.toppingIds.length} topping${config.toppingIds.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="no-scrollbar mt-5 flex flex-wrap justify-center gap-1.5 px-2">
      {parts.map((p, i) => (
        <span
          key={i}
          className="rounded-full bg-porcelain/70 px-3 py-1 text-[0.7rem] text-cocoa"
        >
          {p}
        </span>
      ))}
    </div>
  );
}
