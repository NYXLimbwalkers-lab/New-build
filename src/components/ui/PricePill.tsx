import { AnimatePresence, motion } from "motion/react";
import { formatUSD } from "@/data/build";
import { cn } from "@/lib/cn";

interface PricePillProps {
  amount: number;
  label?: string;
  className?: string;
}

/** Live price that gently animates when it changes. */
export function PricePill({ amount, label = "Your candle", className }: PricePillProps) {
  return (
    <div
      className={cn(
        "glass inline-flex items-center gap-3 rounded-full px-5 py-2.5",
        "shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <span className="label-caps !text-[0.6rem]">{label}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={amount}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 26 }}
          className="price text-lg text-espresso"
        >
          {formatUSD(amount)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
