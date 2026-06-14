import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface ChipProps {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Chip({ active, disabled, onClick, children, className }: ChipProps) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "rounded-full px-4 py-2 text-xs tracking-[0.12em] uppercase border transition-colors",
        "disabled:opacity-35 disabled:cursor-not-allowed",
        active
          ? "bg-cocoa text-canvas border-transparent"
          : "bg-porcelain/60 text-cocoa hairline hover:bg-porcelain",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
