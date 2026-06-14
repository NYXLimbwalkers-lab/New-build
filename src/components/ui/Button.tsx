import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-cocoa text-canvas hover:bg-espresso shadow-[var(--shadow-soft)]",
  ghost: "bg-transparent text-cocoa hover:bg-canvas-deep",
  outline:
    "bg-porcelain/70 text-cocoa border hairline hover:bg-porcelain",
  gold: "bg-gradient-to-b from-gold-soft to-champagne text-espresso shadow-[var(--shadow-soft)] hover:brightness-[1.03]",
};

const SIZES: Record<Size, string> = {
  sm: "px-5 py-2.5 text-sm min-h-[44px]",
  md: "px-6 py-3.5 text-sm min-h-[48px]",
  lg: "px-8 py-4 text-base min-h-[52px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "shimmer inline-flex items-center justify-center gap-2 rounded-full",
        "font-sans tracking-[0.18em] uppercase select-none cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
