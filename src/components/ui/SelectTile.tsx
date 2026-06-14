import { motion } from "motion/react";
import { haptic } from "@/lib/haptics";
import { useMagnetic } from "@/lib/useMagnetic";
import { SPRING } from "@/lib/motionPresets";
import { cn } from "@/lib/cn";

interface SelectTileProps {
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  /** Shared layoutId so the selection ring GLIDES between tiles in a group. */
  groupId?: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/*
  Tactile selectable tile. Press depth scale 0.97, magnetic cursor-follow (mouse),
  a haptic tick on touch, and a shared `layoutId` ring that glides between the
  selected tiles in a group. ≥48px hit area. Restrained — luxury, not playful.
*/
export function SelectTile({
  selected,
  disabled,
  onSelect,
  groupId = "tile-selection",
  className,
  children,
  ariaLabel,
}: SelectTileProps) {
  const mag = useMagnetic<HTMLButtonElement>();

  return (
    <motion.button
      ref={mag.ref}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerMove={mag.onPointerMove}
      onPointerLeave={mag.onPointerLeave}
      onClick={() => {
        if (disabled) return;
        haptic(8);
        onSelect();
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={SPRING.settle}
      style={mag.style}
      className={cn(
        "relative min-h-[48px] rounded-2xl border p-3 text-left",
        "bg-porcelain/70 transition-colors",
        "disabled:opacity-35 disabled:cursor-not-allowed",
        selected ? "border-transparent" : "hairline hover:bg-porcelain",
        className,
      )}
    >
      {selected && (
        <motion.span
          layoutId={groupId}
          transition={SPRING.glide}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow:
              "0 0 0 1.5px var(--color-gold), 0 0 0 5px color-mix(in srgb, var(--color-blush) 35%, transparent)",
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
