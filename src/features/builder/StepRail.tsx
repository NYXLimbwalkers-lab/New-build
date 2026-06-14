import { motion } from "motion/react";
import { STEP_LABEL, type StepId } from "./useCandleBuild";
import { cn } from "@/lib/cn";

/*
  The step rail — a linear WIZARD (ordered list + aria-current="step"), same
  journey every time. The active marker glides between steps via layoutId.
*/
export function StepRail({
  steps,
  current,
  onJump,
}: {
  steps: StepId[];
  current: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={s} className="shrink-0">
            <button
              type="button"
              onClick={() => onJump(i)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition-colors",
                active ? "text-espresso" : done ? "text-cocoa" : "text-muted",
              )}
            >
              {active && (
                <motion.span
                  layoutId="step-pill"
                  className="absolute inset-0 rounded-full bg-blush-soft/70"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">
                {i + 1}. {STEP_LABEL[s]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
