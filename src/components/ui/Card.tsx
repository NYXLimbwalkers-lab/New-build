import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Arched (patisserie-case) top edge. */
  arched?: boolean;
  interactive?: boolean;
}

export function Card({
  arched,
  interactive,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn(
        "relative bg-porcelain/80 border hairline rounded-3xl overflow-hidden",
        "shadow-[var(--shadow-soft)]",
        arched && "arch-top",
        interactive && "shimmer cursor-pointer hover:shadow-[var(--shadow-lift)]",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
